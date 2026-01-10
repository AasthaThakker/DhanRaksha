import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        
        return NextResponse.json({
            success: true,
            session: session,
            hasSession: !!session,
            hasId: !!(session && session.id),
            sessionData: session ? {
                id: session.id,
                email: session.email,
                name: session.name,
                role: session.role,
                accountBalance: session.accountBalance,
                transactionCount: session.transactionCount
            } : null
        })

    } catch (error: any) {
        console.error('Session Debug Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
