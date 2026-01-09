import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const user = await db.user.findUnique({
            where: { id: session.id as string },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const transactions = await db.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: limit,
        })

        return NextResponse.json({
            transactions: transactions.map(tx => ({
                id: tx.id,
                name: tx.description,
                amount: tx.type === 'INCOME' ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`,
                rawAmount: tx.amount,
                type: tx.type.toLowerCase(),
                status: tx.status,
                date: tx.date.toISOString(),
            }))
        })

    } catch (error) {
        console.error('Transactions API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
