import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTransactionNotification } from '@/lib/notifications'
import { extractDeviceMetadata, storeTransactionMetadata } from '@/lib/device-metadata'

// 🔐 Fraud imports
import { ruleEngine } from '@/lib/fraud/rules'
import { buildFeatures } from '@/lib/fraud/features'
import { getMLScore } from '@/lib/fraud/ml'
import { unifiedScore } from '@/lib/fraud/score'
import { decision } from '@/lib/fraud/decision'
import { redis } from '@/lib/redisClient'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract device metadata for behavioral analysis
        const deviceMetadata = extractDeviceMetadata(request)

        const body = await request.json()
        const { recipientEmail, amount, description } = body

        // ------------------ BASIC VALIDATION ------------------
        if (!recipientEmail || !amount)
            return NextResponse.json({ error: 'Recipient email and amount are required' }, { status: 400 })

        if (amount < 0.01)
            return NextResponse.json({ error: 'Minimum transfer amount is ₹0.01' }, { status: 400 })

        // ------------------ FETCH SENDER ------------------
        const sender = await db.user.findUnique({
            where: { id: session.id as string },
            include: { Account: true }
        })

        if (!sender || !(sender as any).Account[0])
            return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

        if (sender.email.toLowerCase() === recipientEmail.toLowerCase())
            return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })

        const senderAccount = (sender as any).Account[0]
        if (senderAccount.balance < amount)
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })

        // ------------------ FETCH RECIPIENT ------------------
        const recipient = await db.user.findUnique({
            where: { email: recipientEmail },
            include: {
                Account: true,
                Transaction: {
                    where: {
                        type: 'INCOME',
                        date: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    },
                    select: { amount: true }
                }
            }
        })

        if (!recipient || !(recipient as any).Account[0])
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })

        // ================== 🔐 INCOMING PROTECTION (RECIPIENT SIDE) ==================
        // Check if recipient has anomaly protection enabled
        if (recipient.receiveAnomalyProtection) {
            // Calculate recipient's average received amount over last 7 days
            const receivedAmounts = recipient.Transaction.map((t: any) => t.amount)
            const avgReceiveAmount = receivedAmounts.length > 0
                ? receivedAmounts.reduce((a: number, b: number) => a + b, 0) / receivedAmounts.length
                : 0

            // Define anomaly threshold (default multiplier = 3)
            const ANOMALY_MULTIPLIER = 3
            const anomalyThreshold = avgReceiveAmount * ANOMALY_MULTIPLIER

            // Check if incoming amount is anomalous
            const isAnomalous = avgReceiveAmount > 0 && amount > anomalyThreshold

            if (isAnomalous) {
                // Log the blocked attempt for security monitoring
                console.warn(`Anomaly protection triggered: Recipient ${recipient.id} blocked incoming transfer of ₹${amount} (threshold: ₹${anomalyThreshold})`)

                return NextResponse.json({
                    error: 'Transaction blocked: Recipient has enabled protection against unusually large incoming transfers',
                    reason: `Incoming amount ₹${amount.toFixed(2)} exceeds recipient’s 7-day average receiving pattern by more than ${ANOMALY_MULTIPLIER}x`,
                    riskReason: 'Recipient anomaly protection triggered',
                    status: 'BLOCKED'
                }, { status: 403 })
            }
        }

        // ================== 🧠 FRAUD ENGINE ==================

        // 🔁 Redis cache
        const cacheKey = `risk:${sender.id}:${recipient.id}:${amount}`
        let cached = null
        if (redis) {
            cached = await redis.get(cacheKey)
        }
        let finalRiskScore: number

        if (cached !== null) {
            finalRiskScore = Number(cached)
        } else {
            // ---- Historical metrics ----
            const last7d = await db.transaction.aggregate({
                where: {
                    userId: sender.id,
                    date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                },
                _avg: { amount: true }
            })

            const velocity1m = await db.transaction.count({
                where: {
                    userId: sender.id,
                    date: { gte: new Date(Date.now() - 60 * 1000) }
                }
            })

            // ---- RULE ENGINE ----
            const ruleResult = ruleEngine({
                amount,
                avgDailyAmount: (last7d._avg.amount ?? 1),
                isNewDevice: true, // plug device fingerprint later
                velocity1m,
                ipCountry: request.headers.get('x-country') ?? 'NA',
                lastCountry: (sender as any).lastCountry ?? 'NA'
            })

            // ---- FEATURE VECTOR ----
            const features = buildFeatures({
                avgAmount7d: last7d._avg.amount ?? 0,
                txVelocity1h: velocity1m,
                deviceChangeFreq: 1,
                currentHour: new Date().getHours(),
                usualHourMean: (sender as any).usualLoginHour ?? 12
            })

            // ---- ML SCORE ----
            let mlScore = 0
            try {
                mlScore = await getMLScore(features)
            } catch (e) {
                console.warn("ML Service unavailable, falling back to rule score")
                mlScore = ruleResult.ruleScore
            }

            finalRiskScore = unifiedScore(ruleResult.ruleScore, mlScore)

            // Cache for 10 mins if Redis is available
            if (redis) {
                await redis.set(cacheKey, finalRiskScore.toString(), { ex: 600 })
            }
        }

        // ---- DECISION ----
        const action = decision(finalRiskScore)

        if (action === 'BLOCK') {
            return NextResponse.json({
                error: 'Transaction blocked due to high risk',
                riskScore: finalRiskScore
            }, { status: 403 })
        }

        if (action === 'HOLD') {
            const pendingTransaction = await db.transaction.create({
                data: {
                    amount,
                    type: 'TRANSFER',
                    userId: sender.id,
                    status: 'PENDING',
                    riskScore: finalRiskScore,
                    description: 'Transaction under review'
                }
            })

            // Create notification for pending payment
            await createTransactionNotification(
                sender.id,
                'TRANSFER',
                amount,
                'Transaction under review',
                pendingTransaction.id,
                'PENDING'
            )

            return NextResponse.json({
                status: 'PENDING_REVIEW',
                riskScore: finalRiskScore
            })
        }

        // ================== 💰 ATOMIC TRANSFER ==================
        const result = await db.$transaction([
            db.account.update({
                where: { id: senderAccount.id },
                data: { balance: { decrement: amount } }
            }),
            db.account.update({
                where: { id: (recipient as any).Account[0].id },
                data: { balance: { increment: amount } }
            }),
            db.transaction.create({
                data: {
                    amount,
                    type: 'TRANSFER',
                    userId: sender.id,
                    status: 'COMPLETED',
                    riskScore: finalRiskScore,
                    description: description
                        ? `Transfer to ${recipient.name}: ${description}`
                        : `Transfer to ${recipient.name}`
                }
            }),
            db.transaction.create({
                data: {
                    amount,
                    type: 'INCOME',
                    userId: recipient.id,
                    status: 'COMPLETED',
                    description: `Received from ${sender.name}`
                }
            })
        ])

        // Get transaction references for notifications
        const senderTransaction = result[2] // Sender's transaction
        const recipientTx = result[3] // Recipient's transaction

        // Create notifications for both sender and recipient
        // Notification for sender (money deducted)
        await createTransactionNotification(
            sender.id,
            'TRANSFER',
            amount,
            description
                ? `Transfer to ${recipient.name}: ${description}`
                : `Transfer to ${recipient.name}`,
            senderTransaction.id,
            'COMPLETED'
        )

        // Notification for recipient (money received)
        await createTransactionNotification(
            recipient.id,
            'INCOME',
            amount,
            `Received from ${sender.name}`,
            recipientTx.id,
            'COMPLETED'
        )

        return NextResponse.json({
            success: true,
            newBalance: result[0].balance,
            riskScore: finalRiskScore
        })

    } catch (err: any) {
        console.error('Transfer error:', err)
        return NextResponse.json({ error: `Transfer failed: ${err.message || err}` }, { status: 500 })
    }
}
