import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        // Test database connection
        const userCount = await db.user.count()
        
        // Get first user for testing
        const firstUser = await db.user.findFirst({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        // Check environment variables
        const envVars = {
            NODE_ENV: process.env.NODE_ENV,
            JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
            DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        }

        return NextResponse.json({
            success: true,
            database: {
                connected: true,
                userCount,
                firstUser
            },
            environment: envVars
        })

    } catch (error: any) {
        console.error('Database Debug Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
