import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth'
import { clearUserNotifications } from '@/lib/notifications'

export async function POST() {
    try {
        // Get current session to extract user ID before logout
        const session = await logout()
        
        // If we have a user ID, clear their notifications
        if (session?.id) {
            await clearUserNotifications(session.id)
        }
        
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }
}
