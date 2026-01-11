import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { extractDeviceMetadata } from '@/lib/device-metadata'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10')

        const behaviorSessions = await db.behaviorSession.findMany({
            where: { userId: session.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                score: true,
                riskLevel: true,
                createdAt: true
            }
        })

        return NextResponse.json({
            success: true,
            sessions: behaviorSessions
        })

    } catch (error: any) {
        console.error('Behavior Sessions API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const deviceMetadata = extractDeviceMetadata(request)
        const { score, riskLevel } = await request.json()

        // Create behavior session record
        const behaviorSession = await db.behaviorSession.create({
            data: {
                userId: session.id,
                score: score || 50, // Default neutral score
                riskLevel: riskLevel || 'LOW'
            }
        })

        return NextResponse.json({
            success: true,
            session: behaviorSession,
            deviceMetadata
        })

    } catch (error: any) {
        console.error('Behavior Session Creation Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
