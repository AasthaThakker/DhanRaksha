import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.id as string

        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                accounts: true,
                sessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const account = user.accounts[0]

        // Fetch recent transactions
        const recentTransactions = await db.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: 5,
        })

        // Calculate monthly spending
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthlySpendingAgg = await db.transaction.aggregate({
            where: {
                userId: user.id,

            },
            _sum: { amount: true },
            _count: true,
        })

        // Real Spending Trend (Last 6 months)
        const spendingData = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(now.getMonth() - i)
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)

            const monthSpending = await db.transaction.aggregate({
                where: {
                    userId: user.id,
                    type: 'TRANSFER', // Using TRANSFER as proxy for spending
                    date: { gte: monthStart, lte: monthEnd }
                },
                _sum: { amount: true }
            })

            spendingData.push({
                month: d.toLocaleString('default', { month: 'short' }),
                amount: monthSpending._sum.amount || 0
            })
        }

        // Real Weekly Activity (Last 7 days)
        const activityData = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(now.getDate() - i)
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)

            const dayCount = await db.transaction.count({
                where: {
                    userId: user.id,
                    date: { gte: dayStart, lte: dayEnd }
                }
            })

            activityData.push({
                date: d.toLocaleString('default', { weekday: 'short' }),
                transactions: dayCount
            })
        }

        return NextResponse.json({
            user: {
                name: user.name,
                email: user.email,
            },
            account: {
                balance: account.balance,
                currency: account.currency,
            },
            metrics: {
                monthlySpending: monthlySpendingAgg._sum.amount || 0,
                monthlyTransactionCount: monthlySpendingAgg._count,
                riskScore: user.sessions[0]?.riskLevel || 'LOW',
                riskScoreValue: user.sessions[0]?.score || 15,
            },
            recentTransactions: recentTransactions.map((tx: any) => ({
                id: tx.id,
                name: tx.description,
                amount: tx.type === 'INCOME' ? `+$${tx.amount}` : `-$${tx.amount}`,
                type: tx.type.toLowerCase(),
                date: tx.date,
                icon: tx.type === 'INCOME' ? '💰' : '📦',
            })),
            spendingData,
            activityData
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
