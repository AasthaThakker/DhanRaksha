import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// 🔐 Fraud imports
import { ruleEngine } from '@/lib/fraud/rules'
import { buildFeatures } from '@/lib/fraud/features'
import { getMLScore } from '@/lib/fraud/ml'
import { unifiedScore } from '@/lib/fraud/score'
import { redis } from '@/lib/redisClient'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { recipientEmail, amount } = body

        if (!recipientEmail || !amount) {
            return NextResponse.json({ error: 'Recipient and amount required' }, { status: 400 })
        }

        const sender = await db.user.findUnique({
            where: { id: session.id as string },
            include: { 
                Account: true 
            }
        })

        if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })

        // ================== 🧠 FRAUD ENGINE (SIMULATION/PREVIEW) ==================

        // 🔁 Redis cache
        const cacheKey = `risk:${sender.id}:${amount}`
        let cached = null
        if (redis) {
            cached = await redis.get(cacheKey)
        }
        let finalRiskScore: number

        if (cached) {
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
                isNewDevice: true,
                velocity1m,
                ipCountry: request.headers.get('x-country') ?? 'NA',
                lastCountry: (sender as any).lastCountry ?? 'NA'
            })

            // ---- FEATURE VECTOR ----
            const features = buildFeatures({
                avgAmount7d: last7d._avg.amount ?? 1,
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

        return NextResponse.json({
            riskScore: finalRiskScore,
            status: finalRiskScore < 30 ? 'SAFE' : finalRiskScore < 70 ? 'SUSPICIOUS' : 'HIGH_RISK',
            message: finalRiskScore < 30
                ? 'Behavior matches known pattern'
                : finalRiskScore < 70
                    ? 'Unusual pattern detected'
                    : 'High risk anomaly detected'
        })

    } catch (error: any) {
        console.error('Verify API Error:', error)
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
    }
}
