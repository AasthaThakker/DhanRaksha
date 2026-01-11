import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, login, getSession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        // Step 1: Check if user exists
        const user = await db.user.findUnique({
            where: { email },
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
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Step 2: Check password
        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }

        // Step 3: Prepare session data
        const sessionData = { 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role,
            receiveAnomalyProtection: user.receiveAnomalyProtection,
            avgReceiveAmount7d: user.avgReceiveAmount7d,
            accountBalance: user.accounts[0]?.balance || 0,
            transactionCount: user._count.transactions
        }

        // Step 4: Create session
        await login(sessionData)

        // Step 5: Verify session was created
        const session = await getSession()

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            sessionData,
            sessionCreated: !!session,
            sessionResult: session
        })

    } catch (error: any) {
        console.error('Login Debug Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
