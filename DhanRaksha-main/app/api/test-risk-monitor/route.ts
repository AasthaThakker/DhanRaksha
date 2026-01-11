import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Get daily risk score trends for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const dailyRiskTrends = await db.$queryRaw`
            SELECT 
                DATE(date) as date,
                AVG("riskScore") as avgRiskScore,
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
            sessions: [
                {
                    id: '1',
                    sessionId: 'sess_001',
                    user: 'bikramsadhukhan505@gmail.com',
                    userName: 'Bikram',
                    device: 'Web Browser',
                    location: 'Mumbai, India',
                    riskScore: 85.5,
                    riskLevel: 'HIGH',
                    anomalies: ['High risk transactions: 12', 'Large transactions: 8', 'High transaction velocity'],
                    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    transactionCount: 15,
                    totalAmount: 1250000
                },
                {
                    id: '2',
                    sessionId: 'sess_002',
                    user: 'automated.aesthetix@gmail.com',
                    userName: 'Aastha Thakker',
                    device: 'Mobile App',
                    location: 'Delhi, India',
                    riskScore: 45.2,
                    riskLevel: 'MEDIUM',
                    anomalies: ['Medium risk transactions: 5'],
                    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    transactionCount: 8,
                    totalAmount: 320000
                }
            ],
            summary: {
                total: 2,
                highRisk: 1,
                mediumRisk: 1,
                lowRisk: 0
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
        console.error('Test Risk Monitor API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
