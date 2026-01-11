import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  role: z.enum(['USER', 'ADMIN']),
  balance: z.number().min(0, 'Balance cannot be negative'),
  receiveAnomalyProtection: z.boolean().optional()
})

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  initialDeposit: z.number().min(0, 'Initial deposit cannot be negative').optional(),
  role: z.enum(['USER', 'ADMIN']).optional()
})

// GET - Comprehensive user analytics
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.id as string },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (role && role !== 'ALL') {
      where.role = role
    }

    // Get users with comprehensive data
    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          receiveAnomalyProtection: true,
          avgReceiveAmount7d: true,
          Account: {
            select: {
              id: true,
              balance: true,
              currency: true,
              createdAt: true,
              updatedAt: true
            }
          },
          _count: {
            select: {
              Transaction: true,
              BehaviorSession: true,
              Notification: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      db.user.count({ where })
    ])

    // Get additional analytics data
    const [
      totalUsers,
      totalAdmins,
      totalBalance,
      highRiskUsers,
      recentTransactions,
      activeUsers
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.account.aggregate({ _sum: { balance: true } }),
      db.behaviorSession.count({
        where: { riskLevel: 'HIGH' },
        distinct: ['userId']
      }),
      db.transaction.count({
        where: {
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      db.user.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    // Calculate user statistics
    const userStats = users.map(user => ({
      ...user,
      totalBalance: user.Account.reduce((sum, acc) => sum + acc.balance, 0),
      accountCount: user.Account.length,
      avgTransactionAmount: user._count.Transaction > 0 ? 
        (user.Account[0]?.balance || 0) / user._count.Transaction : 0,
      riskLevel: user._count.BehaviorSession > 0 ? 'MONITORED' : 'LOW',
      lastActivity: user.updatedAt > user.createdAt ? 'ACTIVE' : 'INACTIVE'
    }))

    return NextResponse.json({
      success: true,
      data: {
        users: userStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalUsers: totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        analytics: {
          overview: {
            totalUsers,
            totalAdmins,
            totalRegularUsers: totalUsers - totalAdmins,
            totalBalance: totalBalance._sum.balance || 0,
            highRiskUsers,
            activeUsers,
            recentTransactions
          },
          userDistribution: {
            byRole: {
              admins: totalAdmins,
              users: totalUsers - totalAdmins
            },
            byRisk: {
              high: highRiskUsers,
              monitored: users.filter(u => u._count.BehaviorSession > 0).length,
              low: users.filter(u => u._count.BehaviorSession === 0).length
            },
            byActivity: {
              active: users.filter(u => u.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              inactive: users.filter(u => u.updatedAt <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
            }
          }
        }
      }
    })

  } catch (error: any) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.id as string },
      select: { role: true }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
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

    const { name, email, password, initialDeposit = 0, role = 'USER' } = validation.data

    // Check if email already exists
    const existingUser = await db.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Create new user with account
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: await hashPassword(password),
        role,
        updatedAt: new Date(),
        Account: {
          create: {
            balance: initialDeposit,
            currency: 'INR',
            updatedAt: new Date()
          }
        }
      },
      include: {
        Account: true,
        _count: {
          select: {
            Transaction: true,
            BehaviorSession: true,
            Notification: true
          }
        }
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
        currency: newUser.Account[0]?.currency || 'INR',
        stats: newUser._count
      }
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.id as string },
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
        email: updateData.email?.toLowerCase(),
        role: updateData.role,
        receiveAnomalyProtection: updateData.receiveAnomalyProtection,
        updatedAt: new Date()
      },
      include: {
        Account: true,
        _count: {
          select: {
            Transaction: true,
            BehaviorSession: true,
            Notification: true
          }
        }
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
            currency: 'INR',
            updatedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        totalBalance: updatedUser.Account.reduce((sum, acc) => sum + acc.balance, 0)
      }
    })

  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await db.user.findUnique({
      where: { id: session.id as string },
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
    if (targetUserId === session.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Get user details before deletion for response
    const userToDelete = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        _count: {
          select: {
            Transaction: true,
            BehaviorSession: true,
            Notification: true,
            Account: true
          }
        }
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user (this will cascade delete related records)
    await db.user.delete({
      where: { id: targetUserId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: userToDelete.id,
        email: userToDelete.email,
        name: userToDelete.name,
        role: userToDelete.role,
        deletedRecords: userToDelete._count
      }
    })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
