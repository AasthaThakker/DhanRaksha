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

        return NextResponse.json({
            metrics: {
                totalUsers,
                totalTransactions,
                totalTransactionVolume: totalVolume._sum.amount || 0,
                highRiskAlerts: highRiskCount,
                accuracy: 99.3, // Placeholder for AI accuracy
                fraudBlocked: highRiskCount * 2 // Placeholder logic
            },
            recentFlaggedSessions: recentFlaggedSessions.map((s: any) => ({
                id: s.id,
                user: s.user.email,
                risk: s.riskLevel.charAt(0) + s.riskLevel.slice(1).toLowerCase(),
                reason: s.score < 50 ? 'Unusual behavioral patterns' : 'Flagged activity',
                time: s.createdAt.toISOString()
            }))
        })

    } catch (error) {
        console.error('Admin Metrics API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
