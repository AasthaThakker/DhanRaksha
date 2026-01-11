import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Step 1: Get session
        const session = await getSession()
        
        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'No session found',
                debug: {
                    session: null,
                    cookies: 'Check browser cookies for session token'
                }
            }, { status: 401 })
        }

        // Step 2: Get user from database to verify session data
        const user = await db.user.findUnique({
            where: { id: session.id },
            include: {
                accounts: true,
                _count: {
                    select: {
                        transactions: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found in database',
                debug: {
                    sessionId: session.id,
                    sessionEmail: session.email
                }
            }, { status: 404 })
        }

        // Step 3: Get transactions
        const transactions = await db.transaction.findMany({
            where: { userId: session.id },
            orderBy: { date: 'desc' },
            take: 5,
            select: {
                id: true,
                amount: true,
                type: true,
                status: true,
                description: true,
                date: true,
                riskScore: true
            }
        })

        return NextResponse.json({
            success: true,
            session: {
                id: session.id,
                email: session.email,
                name: session.name,
                role: session.role,
                hasAccountBalance: 'accountBalance' in session,
                hasTransactionCount: 'transactionCount' in session
            },
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                accountBalance: user.accounts[0]?.balance || 0,
                transactionCount: user._count.transactions
            },
            transactions: {
                count: transactions.length,
                data: transactions.map(t => ({
                    id: t.id,
                    amount: t.amount,
                    type: t.type,
                    description: t.description,
                    date: t.date
                }))
            }
        })

    } catch (error: any) {
        console.error('Session Test Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
