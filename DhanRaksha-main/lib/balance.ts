import { db } from '@/lib/db'

// Minimum balance constraint to prevent negative amounts
const MINIMUM_BALANCE = 200000

/**
 * Calculate dynamic account balance based on transaction history
 * This ensures balance is always accurate and reflects actual transactions
 */
export async function calculateDynamicBalance(userId: string): Promise<number> {
  try {
    // Get all completed transactions for the user
    const transactions = await db.transaction.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED'
      },
      select: {
        type: true,
        amount: true
      }
    })

    // Calculate balance: INCOME adds, TRANSFER/EXPENSE subtracts
    const balance = transactions.reduce((total, tx) => {
      if (tx.type === 'INCOME') {
        return total + tx.amount
      } else if (tx.type === 'TRANSFER' || tx.type === 'EXPENSE') {
        return total - tx.amount
      }
      return total
    }, 0)
    
    return Math.round(balance * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating dynamic balance:', error)
    throw error
  }
}

/**
 * Get the actual database account balance
 * This returns the balance stored in the Account table
 */
export async function getDatabaseBalance(userId: string): Promise<number> {
  try {
    const account = await db.account.findFirst({
      where: { userId },
      select: { balance: true }
    })

    if (!account) {
      throw new Error('Account not found')
    }

    return account.balance
  } catch (error) {
    console.error('Error getting database balance:', error)
    throw error
  }
}

/**
 * Sync account balance with database and ensure consistency
 * This updates the database balance to match the calculated dynamic balance
 */
export async function syncAccountBalance(userId: string): Promise<number> {
  try {
    // Calculate the actual balance from transactions
    const dynamicBalance = await calculateDynamicBalance(userId)
    
    // Update the database to match
    await db.account.updateMany({
      where: { userId },
      data: { balance: dynamicBalance }
    })
    
    console.log(`Synced balance for user ${userId}: ${dynamicBalance}`)
    return dynamicBalance
  } catch (error) {
    console.error('Error syncing account balance:', error)
    throw error
  }
}

/**
 * Get accurate balance by checking both database and dynamic calculation
 * Returns the database balance but ensures it's in sync with transactions
 */
export async function getAccurateBalance(userId: string): Promise<{
  balance: number
  databaseBalance: number
  dynamicBalance: number
  isSynced: boolean
}> {
  try {
    const databaseBalance = await getDatabaseBalance(userId)
    const dynamicBalance = await calculateDynamicBalance(userId)
    
    // Check if balances match
    const isSynced = Math.abs(databaseBalance - dynamicBalance) < 0.01
    
    // If not synced, update database
    if (!isSynced) {
      await syncAccountBalance(userId)
      return {
        balance: dynamicBalance,
        databaseBalance: dynamicBalance,
        dynamicBalance,
        isSynced: true
      }
    }
    
    return {
      balance: databaseBalance,
      databaseBalance,
      dynamicBalance,
      isSynced
    }
  } catch (error) {
    console.error('Error getting accurate balance:', error)
    throw error
  }
}

/**
 * Check if a transaction would violate minimum balance constraint
 * Only applies to withdrawals/expenses, not transfers
 */
export async function validateMinimumBalance(
  userId: string, 
  transactionAmount: number, 
  transactionType: 'EXPENSE'
): Promise<{ isValid: boolean; currentBalance: number; projectedBalance: number; message: string }> {
  try {
    const currentBalance = await getAccurateBalance(userId)
    
    // Calculate projected balance after transaction
    const projectedBalance = transactionType === 'EXPENSE'
      ? currentBalance.balance - transactionAmount
      : currentBalance.balance + transactionAmount

    const isValid = projectedBalance >= MINIMUM_BALANCE
    
    return {
      isValid,
      currentBalance: currentBalance.balance,
      projectedBalance,
      message: isValid 
        ? 'Transaction valid'
        : `Transaction would reduce balance below minimum requirement of ₹${MINIMUM_BALANCE.toLocaleString()}`
    }
  } catch (error) {
    console.error('Error validating minimum balance:', error)
    throw error
  }
}

/**
 * Get the minimum balance constant
 */
export function getMinimumBalance(): number {
  return MINIMUM_BALANCE
}
