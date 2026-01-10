import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, login } from '@/lib/auth'
import { extractDeviceMetadata, storeTransactionMetadata } from '@/lib/device-metadata'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        // Extract device metadata before authentication
        const deviceMetadata = await extractDeviceMetadata(request as any)

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
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await comparePassword(password, user.password)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Login success - include comprehensive user data in session
        await login({ 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            role: user.role,
            receiveAnomalyProtection: user.receiveAnomalyProtection,
            avgReceiveAmount7d: user.avgReceiveAmount7d,
            accountBalance: user.accounts[0]?.balance || 0,
            transactionCount: user._count.transactions
        })

        // Store session metadata for security tracking
        const sessionTransactionId = `login_${Date.now()}_${user.id.substring(0, 8)}`
        storeTransactionMetadata(sessionTransactionId, deviceMetadata, user.id)

        return NextResponse.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.name },
            sessionMetadata: {
                sessionId: deviceMetadata.sessionId,
                deviceInfo: deviceMetadata,
                loginTime: deviceMetadata.timestamp
            }
        })
    } catch (error: any) {
        console.error('Login Error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
