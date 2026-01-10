import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getRecentTransactionsWithMetadata } from '@/lib/device-metadata'

export async function GET() {
    try {
        const session = await getSession()
        
        // Get all recent transactions with metadata
        const allTransactions = getRecentTransactionsWithMetadata(session?.id as string || 'test')
        
        return NextResponse.json({
            success: true,
            session: {
                id: session?.id,
                email: session?.email,
                hasSession: !!session
            },
            allTransactions: allTransactions,
            loginTransactions: allTransactions.filter(item => item.transactionId.startsWith('login_')),
            otherTransactions: allTransactions.filter(item => !item.transactionId.startsWith('login_')),
            totalInMemory: allTransactions.length
        })

    } catch (error: any) {
        console.error('Debug Session Storage Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
