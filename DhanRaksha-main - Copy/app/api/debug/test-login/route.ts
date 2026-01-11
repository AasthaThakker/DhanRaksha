import { NextResponse } from 'next/server'
import { extractDeviceMetadata, storeTransactionMetadata } from '@/lib/device-metadata'

export async function POST(request: Request) {
    try {
        // Simulate a login session capture
        const deviceMetadata = await extractDeviceMetadata(request as any)
        const userId = 'test-user-' + Date.now()
        
        // Store login session metadata
        const sessionTransactionId = `login_${Date.now()}_${userId.substring(0, 8)}`
        storeTransactionMetadata(sessionTransactionId, deviceMetadata, userId)
        
        return NextResponse.json({
            success: true,
            testSession: {
                sessionId: deviceMetadata.sessionId,
                transactionId: sessionTransactionId,
                userId,
                deviceMetadata,
                storedAt: new Date().toISOString()
            }
        })

    } catch (error: any) {
        console.error('Test Login Session Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        const deviceMetadata = await extractDeviceMetadata(request as any)
        
        return NextResponse.json({
            success: true,
            currentDeviceMetadata: deviceMetadata
        })
    } catch (error: any) {
        console.error('Get Device Metadata Error:', error)
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 })
    }
}
