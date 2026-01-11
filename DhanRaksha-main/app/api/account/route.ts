import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { getAccurateBalance, syncAccountBalance, validateMinimumBalance, getMinimumBalance } from '@/lib/balance'

const addFundsSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be at least $0.01').max(10000, 'Amount cannot exceed $10,000'),
  description: z.string().min(1, 'Description is required').max(100, 'Description too long')
})

const withdrawFundsSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be at least $0.01').max(10000, 'Amount cannot exceed $10,000'),
  description: z.string().min(1, 'Description is required').max(100, 'Description too long')
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = addFundsSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    const { amount, description } = validation.data
    const userId = session.id as string

    // Get user's account
    const account = await db.account.findFirst({
      where: { userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Create transaction record first
    const transaction = await db.transaction.create({
      data: {
        amount: amount,
        type: 'INCOME',
        description: description,
        userId: userId,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    // Sync account balance with database
    const newBalance = await syncAccountBalance(userId)

    // Update the account balance to stay in sync
    await db.account.update({
      where: { id: account.id },
      data: { balance: newBalance }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully added $${amount.toFixed(2)} to your account`,
      newBalance: newBalance,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date
      }
    })

  } catch (error: any) {
    console.error('Add funds error:', error)
    return NextResponse.json({ error: 'Failed to add funds' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = withdrawFundsSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }

    const { amount, description } = validation.data
    const userId = session.id as string

    // Validate minimum balance constraint
    const balanceValidation = await validateMinimumBalance(userId, amount, 'EXPENSE')
    if (!balanceValidation.isValid) {
      return NextResponse.json({ 
        error: balanceValidation.message,
        currentBalance: balanceValidation.currentBalance,
        projectedBalance: balanceValidation.projectedBalance,
        minimumBalance: 200000
      }, { status: 400 })
    }

    // Get user's account
    const account = await db.account.findFirst({
      where: { userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Create expense transaction record first
    const transaction = await db.transaction.create({
      data: {
        amount: amount,
        type: 'EXPENSE',
        description: description,
        userId: userId,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    // Sync account balance with database
    const newBalance = await syncAccountBalance(userId)

    // Update the account balance to stay in sync
    await db.account.update({
      where: { id: account.id },
      data: { balance: newBalance }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully withdrew $${amount.toFixed(2)} from your account`,
      newBalance: newBalance,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date
      }
    })

  } catch (error: any) {
    console.error('Withdraw funds error:', error)
    return NextResponse.json({ error: 'Failed to withdraw funds' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.id as string

    // Get user's account
    const account = await db.account.findFirst({
      where: { userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get accurate balance (synced with database)
    const balanceInfo = await getAccurateBalance(userId)

    return NextResponse.json({
      balance: balanceInfo.balance,
      actualBalance: balanceInfo.dynamicBalance,
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      isDynamicCalculation: true,
      minimumBalance: getMinimumBalance(),
      canWithdraw: balanceInfo.balance > getMinimumBalance()
    })

  } catch (error: any) {
    console.error('Get account error:', error)
    return NextResponse.json({ error: 'Failed to get account details' }, { status: 500 })
  }
}
