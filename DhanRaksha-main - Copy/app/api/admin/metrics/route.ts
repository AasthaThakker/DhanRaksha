import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        // Simple security check - in a real app, verify 'ADMIN' role in database
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const totalUsers = await db.user.count()
        const totalTransactions = await db.transaction.count()
        const totalVolume = await db.transaction.aggregate({
            _sum: { amount: true }
        })

        const highRiskCount = await db.behaviorSession.count({
            where: { riskLevel: 'HIGH' }
        })

        const failedTransactions = await db.transaction.count({
            where: { status: 'FAILED' }
        })

        const recentFlaggedSessions = await db.behaviorSession.findMany({
            where: {
                OR: [
                    { riskLevel: 'HIGH' },
                    { riskLevel: 'MEDIUM' }
                ]
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        })

        // Generate fraud data for last 7 days
        const fraudData = []
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dayStart = new Date(date.setHours(0, 0, 0, 0))
            const dayEnd = new Date(date.setHours(23, 59, 59, 999))
            
            const dayAttempts = await db.transaction.count({
                where: {
                    date: {
                        gte: dayStart,
                        lte: dayEnd
                    },
                    status: 'FAILED'
                }
            })
            
            fraudData.push({
                date: days[date.getDay()],
                attempts: dayAttempts
            })
        }

        // Generate accuracy data for last 4 weeks
        const accuracyData = []
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date()
            weekStart.setDate(weekStart.getDate() - (i * 7))
            weekStart.setHours(0, 0, 0, 0)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            
            const totalWeekTransactions = await db.transaction.count({
                where: {
                    date: {
                        gte: weekStart,
                        lte: weekEnd
                    }
                }
            })
            
            const successfulWeekTransactions = await db.transaction.count({
                where: {
                    date: {
                        gte: weekStart,
                        lte: weekEnd
                    },
                    status: 'COMPLETED'
                }
            })
            
            const accuracy = totalWeekTransactions > 0 
                ? (successfulWeekTransactions / totalWeekTransactions) * 100 
                : 100
            
            accuracyData.push({
                week: `Week ${4 - i}`,
                accuracy: Math.min(accuracy, 100)
            })
        }

        return NextResponse.json({
            metrics: {
                totalUsers,
                totalTransactions,
                totalTransactionVolume: totalVolume._sum.amount || 0,
                highRiskAlerts: highRiskCount,
                accuracy: accuracyData.length > 0 ? accuracyData[accuracyData.length - 1].accuracy : 99.3,
                fraudBlocked: failedTransactions
            },
            recentFlaggedSessions: recentFlaggedSessions.map((s: any) => ({
                id: s.id,
                user: s.user.email,
                risk: s.riskLevel.charAt(0) + s.riskLevel.slice(1).toLowerCase(),
                reason: s.score < 50 ? 'Unusual behavioral patterns' : 'Flagged activity',
                time: s.createdAt.toISOString()
            })),
            fraudData,
            accuracyData
        })

    } catch (error) {
        console.error('Admin Metrics API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
