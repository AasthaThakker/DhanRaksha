import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Detailed analytics for a specific user
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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get comprehensive user data
    const [
      user,
      transactions,
      behaviorSessions,
      notifications,
      riskMetrics
    ] = await Promise.all([
      // User basic info with accounts
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          receiveAnomalyProtection: true,
          avgReceiveAmount7d: true,
          securityQuestion: true,
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
        }
      }),

      // Transaction analytics
      db.transaction.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          description: true,
          riskScore: true,
          date: true
        },
        orderBy: { date: 'desc' },
        take: 100
      }),

      // Behavior sessions
      db.behaviorSession.findMany({
        where: { userId },
        select: {
          id: true,
          score: true,
          riskLevel: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),

      // Notifications
      db.notification.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),

      // Risk metrics calculation
      db.transaction.groupBy({
        by: ['type', 'status'],
        where: { userId },
        _count: { id: true },
        _sum: { amount: true }
      })
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate transaction analytics
    const transactionAnalytics = {
      total: transactions.length,
      byType: riskMetrics.reduce((acc, item) => {
        acc[item.type] = {
          count: item._count.id,
          totalAmount: item._sum.amount || 0
        }
        return acc
      }, {} as Record<string, { count: number; totalAmount: number }>),
      byStatus: riskMetrics.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
      averageAmount: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
      highRiskTransactions: transactions.filter(t => (t.riskScore || 0) > 70).length,
      recentTransactions: transactions.filter(t => 
        new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    }

    // Calculate behavior analytics
    const behaviorAnalytics = {
      totalSessions: behaviorSessions.length,
      averageScore: behaviorSessions.length > 0 ? 
        behaviorSessions.reduce((sum, s) => sum + s.score, 0) / behaviorSessions.length : 0,
      riskDistribution: behaviorSessions.reduce((acc, session) => {
        acc[session.riskLevel] = (acc[session.riskLevel] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      highRiskSessions: behaviorSessions.filter(s => s.riskLevel === 'HIGH').length,
      recentSessions: behaviorSessions.filter(s => 
        new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }

    // Calculate notification analytics
    const notificationAnalytics = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recent: notifications.filter(n => 
        new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }

    // Account analytics
    const accountAnalytics = {
      totalAccounts: user.Account.length,
      totalBalance: user.Account.reduce((sum, acc) => sum + acc.balance, 0),
      accountCurrencies: [...new Set(user.Account.map(acc => acc.currency))],
      oldestAccount: user.Account.length > 0 ? 
        new Date(Math.min(...user.Account.map(acc => new Date(acc.createdAt).getTime()))) : null,
      newestAccount: user.Account.length > 0 ? 
        new Date(Math.max(...user.Account.map(acc => new Date(acc.createdAt).getTime()))) : null
    }

    // Time-based analytics
    const now = new Date()
    const userAge = now.getTime() - new Date(user.createdAt).getTime()
    const daysSinceCreation = Math.floor(userAge / (1000 * 60 * 60 * 24))
    const lastActivity = new Date(user.updatedAt)
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    // Risk assessment
    const riskAssessment = {
      overallRisk: behaviorAnalytics.averageScore > 70 ? 'HIGH' : 
                   behaviorAnalytics.averageScore > 40 ? 'MEDIUM' : 'LOW',
      riskFactors: {
        highRiskTransactions: transactionAnalytics.highRiskTransactions > 0,
        highRiskSessions: behaviorAnalytics.highRiskSessions > 0,
        unusualActivity: transactionAnalytics.recentTransactions > 20,
        accountBalance: accountAnalytics.totalBalance > 100000 ? 'HIGH' : 'NORMAL'
      },
      protectionEnabled: user.receiveAnomalyProtection
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        analytics: {
          overview: {
            accountAge: daysSinceCreation,
            daysSinceLastActivity,
            isActive: daysSinceLastActivity <= 7,
            riskLevel: riskAssessment.overallRisk
          },
          transactions: transactionAnalytics,
          behavior: behaviorAnalytics,
          notifications: notificationAnalytics,
          accounts: accountAnalytics,
          risk: riskAssessment,
          recentActivity: {
            lastTransaction: transactions[0]?.date || null,
            lastBehaviorSession: behaviorSessions[0]?.createdAt || null,
            lastNotification: notifications[0]?.createdAt || null
          }
        }
      }
    })

  } catch (error: any) {
    console.error('User analytics GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 })
  }
}
