import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getRecentTransactionsWithMetadata } from '@/lib/device-metadata'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '5') // Default to 5 for behavior logs

        // Get user's recent transactions from database
        const transactions = await db.transaction.findMany({
            where: { userId: session.id },
            orderBy: { date: 'desc' },
            take: limit,
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

        // Get device metadata from in-memory storage
        const transactionsWithMetadata = getRecentTransactionsWithMetadata(session.id as string)
        
        // Merge transactions with device metadata
        const mergedTransactions = transactions.map((transaction, index) => {
            const metadata = transactionsWithMetadata[index]
            return {
                id: transaction.id,
                name: transaction.description,
                amount: transaction.type === 'INCOME' ? `+₹${transaction.amount.toFixed(2)}` : `-₹${transaction.amount.toFixed(2)}`,
                rawAmount: transaction.amount,
                type: transaction.type.toLowerCase(),
                status: transaction.status,
                date: transaction.date.toISOString(),
                deviceMetadata: metadata?.metadata || null
            }
        })

        return NextResponse.json({
            success: true,
            transactions: mergedTransactions
        })

    } catch (error: any) {
        console.error('Transactions API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
