import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, login } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
        }

        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const isValid = await comparePassword(password, user.password)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Login success
        await login({ id: user.id, email: user.email, name: user.name, role: user.role })

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    } catch (error) {
        console.error('Login Error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
