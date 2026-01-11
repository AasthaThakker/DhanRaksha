import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { syncAccountBalance } from '@/lib/balance'

/**
 * Sync all user account balances with dynamic calculation
 * This can be run periodically to ensure data consistency
 */
export async function syncAllAccountBalances(): Promise<{
  synced: number
  errors: string[]
}> {
  const errors: string[] = []
  let synced = 0

  try {
    // Get all users with accounts
    const users = await db.user.findMany({
      include: { Account: true },
      where: {
        Account: {
          some: {}
        }
      }
    })

    console.log(`Found ${users.length} users to sync`)

    for (const user of users) {
      try {
        await syncAccountBalance(user.id)
        synced++
        console.log(`✅ Synced balance for user: ${user.email}`)
      } catch (error) {
        const errorMsg = `Failed to sync balance for user ${user.email}: ${error}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    console.log(`Balance sync completed: ${synced} synced, ${errors.length} errors`)
  } catch (error) {
    console.error('Critical error during balance sync:', error)
    errors.push(`Critical error: ${error}`)
  }

  return { synced, errors }
}

/**
 * API endpoint to trigger balance sync
 * Can be called by admin or cron job
 */
export async function POST() {
  try {
    // Add authentication check here if needed
    const result = await syncAllAccountBalances()
    
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced} accounts${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
    })
  } catch (error) {
    console.error('Balance sync API error:', error)
    return NextResponse.json({
      error: 'Failed to sync balances',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
