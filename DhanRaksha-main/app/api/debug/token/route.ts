import { NextResponse } from 'next/server'
import { signToken, verifyToken } from '@/lib/auth'

export async function GET() {
    try {
        // Test token creation and verification
        const testData = {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
        }
        
        const token = await signToken(testData)
        const verified = await verifyToken(token)
        
        return NextResponse.json({
            success: true,
            testData,
            token: token.substring(0, 50) + '...',
            verified,
            verificationMatches: JSON.stringify(testData) === JSON.stringify(verified)
        })

    } catch (error: any) {
        console.error('Token Debug Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
