import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  role: z.enum(['USER', 'ADMIN']),
  balance: z.number().min(0, 'Balance cannot be negative')
})

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  initialDeposit: z.number().min(0, 'Initial deposit cannot be negative').optional()
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id as string

    // Get current user to check if admin
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users with their accounts (exclude admin users)
    const users = await db.user.findMany({
      where: {
        role: 'USER' // Only get regular users, exclude admins
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        Account: {
          select: {
            balance: true,
            currency: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            Transaction: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        balance: user.Account[0]?.balance || 0,
        currency: user.Account[0]?.currency || 'USD',
        accountCreated: user.Account[0]?.createdAt || null,
        transactionCount: user._count.Transaction
      }))
    })

  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id as string

    // Get current user to check if admin
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Validate user creation data
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    const { name, email, password, initialDeposit = 0 } = validation.data

    // Check if email already exists
    const existingUser = await db.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user with account
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'USER',
        updatedAt: new Date(),
        Account: {
          create: {
            balance: initialDeposit,
            currency: 'USD',
            updatedAt: new Date()
          }
        }
      },
      include: {
        Account: true
      }
    })

    // Create initial transaction if deposit > 0
    if (initialDeposit > 0) {
      await db.transaction.create({
        data: {
          amount: initialDeposit,
          type: 'INCOME',
          description: 'Initial deposit',
          userId: newUser.id,
          status: 'COMPLETED',
          riskScore: 0,
          date: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
        balance: newUser.Account[0]?.balance || 0,
        currency: newUser.Account[0]?.currency || 'USD',
        accountCreated: newUser.Account[0]?.createdAt || null
      }
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id as string

    // Get current user to check if admin
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId: targetUserId, ...updateData } = body

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate update data
    const validation = updateUserSchema.safeParse(updateData)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: targetUserId }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: {
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        updatedAt: new Date()
      }
    })

    // Update account balance if provided
    if (updateData.balance !== undefined) {
      const account = await db.account.findFirst({
        where: { userId: targetUserId }
      })

      if (account) {
        await db.account.update({
          where: { id: account.id },
          data: {
            balance: updateData.balance,
            updatedAt: new Date()
          }
        })
      } else {
        // Create account if it doesn't exist
        await db.account.create({
          data: {
            userId: targetUserId,
            balance: updateData.balance,
            currency: 'USD',
            updatedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id as string

    // Get current user to check if admin
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user (this will cascade delete related records)
    await db.user.delete({
      where: { id: targetUserId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
