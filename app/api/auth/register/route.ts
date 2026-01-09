export const runtime = "nodejs"
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, login } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, name } = body

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await hashPassword(password)

        // Create user with initial account
        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                accounts: {
                    create: {
                        balance: 1000.00, // Sign up bonus
                        currency: 'USD',
                    },
                },
                sessions: {
                    create: {
                        score: 75,
                        riskLevel: 'LOW',
                    },
                },
            },
            include: {
                accounts: true,
            }
        })

        // Log user in
        await login({ id: user.id, email: user.email, name: user.name, role: user.role })

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    } catch (error) {
        console.error('Register Error:', error)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
