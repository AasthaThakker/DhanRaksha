import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { extractDeviceMetadata, storeTransactionMetadata } from '@/lib/device-metadata'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract device metadata from current request
        const deviceMetadata = await extractDeviceMetadata(request)
        
        // Store session metadata as a "transaction" for tracking purposes
        // This creates a session record without an actual transaction
        const sessionTransactionId = `session_${Date.now()}_${session.id.substring(0, 8)}`
        storeTransactionMetadata(sessionTransactionId, deviceMetadata, session.id)

        return NextResponse.json({
            success: true,
            sessionMetadata: {
                sessionId: deviceMetadata.sessionId,
                deviceInfo: deviceMetadata,
                timestamp: deviceMetadata.timestamp,
                message: 'Session metadata captured successfully'
            }
        })

    } catch (error: any) {
        console.error('Session Capture Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Extract current device metadata
        const deviceMetadata = await extractDeviceMetadata(request)

        return NextResponse.json({
            success: true,
            currentSession: {
                sessionId: deviceMetadata.sessionId,
                deviceInfo: deviceMetadata,
                timestamp: deviceMetadata.timestamp,
                userId: session.id
            }
        })

    } catch (error: any) {
        console.error('Session Get Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
