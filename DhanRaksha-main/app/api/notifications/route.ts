import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const notifications = await db.notification.findMany({
            where: { userId: session.id as string },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                Transaction: {
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        description: true,
                        date: true
                    }
                }
            }
        })

        const unreadCount = await db.notification.count({
            where: { 
                userId: session.id as string,
                isRead: false 
            }
        })

        return NextResponse.json({
            notifications,
            unreadCount
        })
    } catch (error) {
        console.error('Notifications API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session || !session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { notificationIds } = await request.json()

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        await db.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: session.id as string
            },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Mark notifications read Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
