import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const addFundsSchema = z.object({
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

    // Update account balance
    const updatedAccount = await db.account.update({
      where: { id: account.id },
      data: {
        balance: account.balance + amount
      }
    })

    // Create transaction record
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

    return NextResponse.json({
      success: true,
      message: `Successfully added $${amount.toFixed(2)} to your account`,
      newBalance: updatedAccount.balance,
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

    return NextResponse.json({
      balance: account.balance,
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    })

  } catch (error: any) {
    console.error('Get account error:', error)
    return NextResponse.json({ error: 'Failed to get account details' }, { status: 500 })
  }
}
