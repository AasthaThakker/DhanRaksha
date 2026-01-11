import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const riskFilter = searchParams.get('risk') || 'all'
        const searchQuery = searchParams.get('search') || ''

        // Get behavior sessions with user data
        const behaviorSessions = await db.behaviorSession.findMany({
            where: {
                ...(riskFilter !== 'all' && {
                    riskLevel: riskFilter.toUpperCase() as any
                })
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        // Get user data separately
        const userIds = behaviorSessions.map(session => session.userId)
        const users = await db.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        })
        const userMap = users.reduce((map, user) => {
            map[user.id] = user
            return map
        }, {} as Record<string, any>)

        // Filter by search query if provided
        const filteredSessions = searchQuery 
            ? behaviorSessions.filter(session => {
                const user = userMap[session.userId]
                return user && (
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })
            : behaviorSessions

        // Get recent transactions for each user to determine anomalies
        const sessionsWithTransactions = await Promise.all(
            filteredSessions.map(async (session) => {
                const recentTransactions = await db.transaction.findMany({
                    where: {
                        userId: session.userId,
                        date: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                        }
                    },
                    orderBy: { date: 'desc' },
                    take: 10
                })

                // Determine anomalies based on transaction patterns
                const anomalies = []
                const highRiskTransactions = recentTransactions.filter(t => (t.riskScore || 0) >= 70)
                const failedTransactions = recentTransactions.filter(t => t.status === 'FAILED')
                const largeTransactions = recentTransactions.filter(t => t.amount > 100000)

                if (highRiskTransactions.length > 0) {
                    anomalies.push(`High risk transactions: ${highRiskTransactions.length}`)
                }
                if (failedTransactions.length > 0) {
                    anomalies.push(`Failed transactions: ${failedTransactions.length}`)
                }
                if (largeTransactions.length > 0) {
                    anomalies.push(`Large transactions: ${largeTransactions.length}`)
                }
                if (recentTransactions.length > 5) {
                    anomalies.push('High transaction velocity')
                }

                return {
                    id: session.id,
                    sessionId: session.id.slice(0, 8),
                    user: userMap[session.userId]?.email || 'Unknown',
                    userName: userMap[session.userId]?.name || 'Unknown User',
                    device: 'Web Browser', // Default device info
                    location: 'Unknown', // Default location
                    riskScore: session.score,
                    riskLevel: session.riskLevel,
                    anomalies: anomalies.length > 0 ? anomalies : ['Normal pattern'],
                    time: session.createdAt.toISOString(),
                    transactionCount: recentTransactions.length,
                    totalAmount: recentTransactions.reduce((sum, t) => sum + t.amount, 0)
                }
            })
        )

        // Get daily risk score trends for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const dailyRiskTrends = await db.$queryRaw`
            SELECT 
                DATE(date) as date,
                AVG(riskScore) as avgRiskScore,
                COUNT(*) as transactionCount
            FROM "Transaction" 
            WHERE "date" >= ${thirtyDaysAgo}
                AND "riskScore" IS NOT NULL
            GROUP BY DATE(date)
            ORDER BY date DESC
            LIMIT 30
        `

        // Get user risk summaries with detailed transaction analysis
        const userRiskSummaries = await db.$queryRaw`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(t.id) as "transactionCount",
                AVG(t."riskScore") as "avgTransactionRisk",
                MAX(t."riskScore") as "maxTransactionRisk",
                MIN(t."riskScore") as "minTransactionRisk",
                SUM(CASE WHEN t.type = 'INCOME' THEN 1 ELSE 0 END) as "incomeCount",
                SUM(CASE WHEN t.type = 'EXPENSE' THEN 1 ELSE 0 END) as "expenseCount",
                SUM(CASE WHEN t.type = 'TRANSFER' THEN 1 ELSE 0 END) as "transferCount",
                SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as "completedCount",
                SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) as "failedCount",
                SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as "pendingCount",
                AVG(t.amount) as "avgAmount",
                SUM(t.amount) as "totalAmount",
                MAX(t.amount) as "maxAmount",
                MIN(t.amount) as "minAmount"
            FROM "User" u
            LEFT JOIN "Transaction" t ON u.id = t."userId"
            GROUP BY u.id, u.name, u.email
            HAVING COUNT(t.id) > 0
            ORDER BY "avgTransactionRisk" DESC NULLS LAST
        `

        // Get risk distribution data for spider charts
        const riskDistributionData = await db.$queryRaw`
            SELECT 
                u.id,
                u.name,
                u.email,
                
                -- Risk score categories
                SUM(CASE WHEN t."riskScore" >= 80 THEN 1 ELSE 0 END) as "criticalRiskCount",
                SUM(CASE WHEN t."riskScore" >= 60 AND t."riskScore" < 80 THEN 1 ELSE 0 END) as "highRiskCount",
                SUM(CASE WHEN t."riskScore" >= 40 AND t."riskScore" < 60 THEN 1 ELSE 0 END) as "mediumRiskCount",
                SUM(CASE WHEN t."riskScore" >= 20 AND t."riskScore" < 40 THEN 1 ELSE 0 END) as "lowRiskCount",
                SUM(CASE WHEN t."riskScore" < 20 THEN 1 ELSE 0 END) as "minimalRiskCount",
                
                -- Transaction type distribution
                SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE 0 END) as "totalIncome",
                SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) as "totalExpense",
                SUM(CASE WHEN t.type = 'TRANSFER' THEN t.amount ELSE 0 END) as "totalTransfer",
                
                -- Status distribution
                SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as "completedTransactions",
                SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) as "failedTransactions",
                SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) as "pendingTransactions",
                
                -- Amount-based risk indicators
                SUM(CASE WHEN t.amount > 100000 THEN 1 ELSE 0 END) as "largeTransactionCount",
                SUM(CASE WHEN t.amount > 50000 AND t.amount <= 100000 THEN 1 ELSE 0 END) as "mediumTransactionCount",
                SUM(CASE WHEN t.amount <= 50000 THEN 1 ELSE 0 END) as "smallTransactionCount",
                
                -- Time-based patterns (last 7 days vs older)
                SUM(CASE WHEN t.date >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as "recentTransactionCount",
                SUM(CASE WHEN t.date < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as "olderTransactionCount"
                
            FROM "User" u
            LEFT JOIN "Transaction" t ON u.id = t."userId"
            GROUP BY u.id, u.name, u.email
            HAVING COUNT(t.id) > 0
        `

        // Calculate spider chart data (normalized to 0-100 scale)
        const spiderChartData = (riskDistributionData as any[]).map(user => {
            const totalTransactions = Number(user.completedTransactions || 0) + Number(user.failedTransactions || 0) + Number(user.pendingTransactions || 0)
            const totalAmount = Number(user.totalIncome || 0) + Number(user.totalExpense || 0) + Number(user.totalTransfer || 0)
            
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                
                // Risk metrics (normalized)
                riskScore: Math.min(100, Number(user.avgTransactionRisk || 0)),
                criticalRiskRatio: totalTransactions > 0 ? (Number(user.criticalRiskCount || 0) / totalTransactions) * 100 : 0,
                highRiskRatio: totalTransactions > 0 ? (Number(user.highRiskCount || 0) / totalTransactions) * 100 : 0,
                failedTransactionRatio: totalTransactions > 0 ? (Number(user.failedTransactions || 0) / totalTransactions) * 100 : 0,
                largeTransactionRatio: totalTransactions > 0 ? (Number(user.largeTransactionCount || 0) / totalTransactions) * 100 : 0,
                recentActivityRatio: totalTransactions > 0 ? (Number(user.recentTransactionCount || 0) / totalTransactions) * 100 : 0,
                
                // Transaction diversity (normalized)
                incomeRatio: totalAmount > 0 ? (Number(user.totalIncome || 0) / totalAmount) * 100 : 0,
                expenseRatio: totalAmount > 0 ? (Number(user.totalExpense || 0) / totalAmount) * 100 : 0,
                transferRatio: totalAmount > 0 ? (Number(user.totalTransfer || 0) / totalAmount) * 100 : 0,
                
                // Amount patterns
                avgAmount: Number(user.avgAmount || 0),
                maxAmount: Number(user.maxAmount || 0),
                transactionVolume: totalTransactions,
                
                // Raw counts for reference
                criticalRiskCount: Number(user.criticalRiskCount || 0),
                highRiskCount: Number(user.highRiskCount || 0),
                mediumRiskCount: Number(user.mediumRiskCount || 0),
                lowRiskCount: Number(user.lowRiskCount || 0),
                minimalRiskCount: Number(user.minimalRiskCount || 0)
            }
        })

        return NextResponse.json({
            success: true,
            sessions: sessionsWithTransactions,
            summary: {
                total: sessionsWithTransactions.length,
                highRisk: sessionsWithTransactions.filter(s => s.riskLevel === 'HIGH').length,
                mediumRisk: sessionsWithTransactions.filter(s => s.riskLevel === 'MEDIUM').length,
                lowRisk: sessionsWithTransactions.filter(s => s.riskLevel === 'LOW').length
            },
            dailyRiskTrends: JSON.parse(JSON.stringify(dailyRiskTrends, (key, value) => 
                typeof value === 'bigint' ? Number(value) : value
            )),
            userRiskSummaries: JSON.parse(JSON.stringify(userRiskSummaries, (key, value) => 
                typeof value === 'bigint' ? Number(value) : value
            )),
            spiderChartData: JSON.parse(JSON.stringify(spiderChartData, (key, value) => 
                typeof value === 'bigint' ? Number(value) : value
            ))
        })

    } catch (error) {
        console.error('Risk Monitor API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
