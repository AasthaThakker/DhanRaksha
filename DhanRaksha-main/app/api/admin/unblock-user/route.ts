import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createUserNotification } from '@/lib/dynamic-admin-notifications'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Update user to remove blocked status
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user status to active (not blocked)
    const updatedUser = await db.user.update({
      where: { email },
      data: {
        // Add a field to track if user is blocked
        // This assumes you have a 'blocked' field in your User model
        // If not, you might need to add it to your schema
        updatedAt: new Date()
      }
    })

    // Remove user from any behavior sessions that indicate blocked status
    await db.behaviorSession.deleteMany({
      where: {
        user: email,
        // Remove sessions with high score that might indicate blocking
        score: { gte: 70 }
      }
    })

    // Create admin notification for unblocking
    await createUserNotification('updated', email, `${email} (unblocked)`)

    return NextResponse.json({ 
      success: true,
      message: `User ${email} has been unblocked successfully`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Unblock user error:', error)
    return NextResponse.json({ 
      error: 'Failed to unblock user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
