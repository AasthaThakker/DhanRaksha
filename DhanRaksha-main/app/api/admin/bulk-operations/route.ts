import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const bulkOperationSchema = z.object({
  operation: z.enum(['UPDATE_ROLE', 'DELETE', 'EXPORT', 'BLOCK', 'UNBLOCK']),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  data: z.any().optional() // Additional data for operations like UPDATE_ROLE
})

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
    const validation = bulkOperationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    const { operation, userIds, data } = validation.data

    // Prevent admin from operating on themselves
    if (userIds.includes(session.id as string)) {
      return NextResponse.json({ 
        error: 'Cannot perform bulk operations on your own account' 
      }, { status: 400 })
    }

    let result

    switch (operation) {
      case 'UPDATE_ROLE':
        if (!data?.role || !['USER', 'ADMIN'].includes(data.role)) {
          return NextResponse.json({ error: 'Valid role is required' }, { status: 400 })
        }
        
        result = await db.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role, updatedAt: new Date() }
        })
        
        return NextResponse.json({
          success: true,
          message: `Updated ${result.count} users to ${data.role} role`,
          updatedCount: result.count
        })

      case 'DELETE':
        // Get users info before deletion
        const usersToDelete = await db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            _count: {
              select: {
                Transaction: true,
                Account: true,
                BehaviorSession: true,
                Notification: true
              }
            }
          }
        })

        result = await db.user.deleteMany({
          where: { id: { in: userIds } }
        })

        return NextResponse.json({
          success: true,
          message: `Deleted ${result.count} users`,
          deletedCount: result.count,
          deletedUsers: usersToDelete.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            recordsDeleted: user._count
          }))
        })

      case 'EXPORT':
        const usersToExport = await db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            receiveAnomalyProtection: true,
            Account: {
              select: {
                balance: true,
                currency: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                Transaction: true,
                BehaviorSession: true,
                Notification: true
              }
            }
          }
        })

        return NextResponse.json({
          success: true,
          message: `Exported ${usersToExport.length} users`,
          users: usersToExport.map(user => ({
            ...user,
            totalBalance: user.Account.reduce((sum, acc) => sum + acc.balance, 0),
            accountCount: user.Account.length
          }))
        })

      case 'BLOCK':
        // Create high-risk behavior sessions to effectively block users
        const blockResults = await Promise.all(
          userIds.map(userId =>
            db.behaviorSession.create({
              data: {
                userId,
                score: 100,
                riskLevel: 'HIGH',
                createdAt: new Date()
              }
            })
          )
        )

        return NextResponse.json({
          success: true,
          message: `Blocked ${blockResults.length} users`,
          blockedCount: blockResults.length,
          blockedUsers: blockResults.map(session => ({ userId: session.userId, sessionId: session.id }))
        })

      case 'UNBLOCK':
        // Remove high-risk behavior sessions
        const unblockResult = await db.behaviorSession.deleteMany({
          where: {
            userId: { in: userIds },
            riskLevel: 'HIGH',
            score: { gte: 90 }
          }
        })

        return NextResponse.json({
          success: true,
          message: `Unblocked ${unblockResult.count} users`,
          unblockedCount: unblockResult.count
        })

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ 
      error: 'Failed to perform bulk operation',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Get bulk operation statistics
export async function GET() {
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

    // Get statistics for bulk operations
    const [
      totalUsers,
      adminUsers,
      regularUsers,
      blockedUsers,
      highRiskUsers,
      recentUsers,
      inactiveUsers
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.user.count({ where: { role: 'USER' } }),
      // Count blocked users (those with high-risk behavior sessions)
      db.behaviorSession.groupBy({
        by: ['userId'],
        where: { riskLevel: 'HIGH', score: { gte: 90 } }
      }).then(sessions => sessions.length),
      // Count high-risk users
      db.behaviorSession.groupBy({
        by: ['userId'],
        where: { riskLevel: 'HIGH' }
      }).then(sessions => sessions.length),
      db.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      db.user.count({
        where: {
          updatedAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      statistics: {
        overview: {
          totalUsers,
          adminUsers,
          regularUsers,
          blockedUsers,
          highRiskUsers,
          recentUsers,
          inactiveUsers
        },
        bulkOperationLimits: {
          maxUsersPerOperation: 100,
          supportedOperations: ['UPDATE_ROLE', 'DELETE', 'EXPORT', 'BLOCK', 'UNBLOCK']
        }
      }
    })

  } catch (error: any) {
    console.error('Bulk operation stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
