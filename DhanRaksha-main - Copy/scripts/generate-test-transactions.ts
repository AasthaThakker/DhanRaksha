import { PrismaClient, TransactionType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Transaction configuration
const TOTAL_TRANSACTIONS = 500
const BLOCKED_TRANSACTIONS = 42  // High risk score (>=70)
const PENDING_TRANSACTIONS = 34  // Medium risk score (30-69)
const SUCCESSFUL_TRANSACTIONS = 424 // Low risk score (<30)

const USERS = ['Aastha', 'Nand', 'Bikram']
const NORMAL_AMOUNT_MIN = 10000
const NORMAL_AMOUNT_MAX = 100000
const SUSPICIOUS_AMOUNT_MIN = 150000
const SUSPICIOUS_AMOUNT_MAX = 500000

// Risk score thresholds based on fraud decision logic
const RISK_THRESHOLDS = {
  BLOCKED_MIN: 70,  // >= 70 gets blocked
  PENDING_MIN: 30,  // 30-69 gets pending  
  SUCCESSFUL_MAX: 29 // < 30 gets approved
}

function getRandomAmount(isSuspicious: boolean = false): number {
  if (isSuspicious) {
    return Math.random() * (SUSPICIOUS_AMOUNT_MAX - SUSPICIOUS_AMOUNT_MIN) + SUSPICIOUS_AMOUNT_MIN
  }
  return Math.random() * (NORMAL_AMOUNT_MAX - NORMAL_AMOUNT_MIN) + NORMAL_AMOUNT_MIN
}

function getRandomRiskScore(targetStatus: 'blocked' | 'pending' | 'successful'): number {
  switch (targetStatus) {
    case 'blocked':
      return Math.random() * (100 - RISK_THRESHOLDS.BLOCKED_MIN) + RISK_THRESHOLDS.BLOCKED_MIN
    case 'pending':
      return Math.random() * (RISK_THRESHOLDS.BLOCKED_MIN - RISK_THRESHOLDS.PENDING_MIN) + RISK_THRESHOLDS.PENDING_MIN
    case 'successful':
      return Math.random() * RISK_THRESHOLDS.SUCCESSFUL_MAX
    default:
      return Math.random() * 100
  }
}

function getTransactionStatus(riskScore: number): string {
  if (riskScore >= RISK_THRESHOLDS.BLOCKED_MIN) return 'FAILED' // Blocked transactions
  if (riskScore >= RISK_THRESHOLDS.PENDING_MIN) return 'PENDING'
  return 'COMPLETED'
}

async function generateTransactions() {
  try {
    console.log('🚀 Starting transaction generation...')
    
    // Find users
    const users = await Promise.all(
      USERS.map(async (name) => {
        const user = await prisma.user.findFirst({
          where: { 
            name: {
              contains: name,
              mode: 'insensitive'
            }
          },
          include: { Account: true }
        })
        
        if (!user) {
          throw new Error(`User '${name}' not found`)
        }
        
        return user
      })
    )

    console.log(`✅ Found users: ${users.map(u => u.name).join(', ')}`)

    // Ensure all users have accounts
    for (const user of users) {
      if (!user.Account[0]) {
        console.log(`Creating account for ${user.name}...`)
        await prisma.account.create({
          data: {
            userId: user.id,
            balance: 1000000, // Give them enough balance
            currency: 'USD',
            updatedAt: new Date()
          }
        })
      }
    }

    // Generate transactions array with desired distribution
    const transactions = []
    
    // Add blocked transactions (mostly from Bikram to make him suspicious)
    let blockedCount = 0
    while (blockedCount < BLOCKED_TRANSACTIONS) {
      const senderIndex = blockedCount < BLOCKED_TRANSACTIONS * 0.7 ? 2 : Math.floor(Math.random() * 3) // 70% from Bikram
      let receiverIndex = Math.floor(Math.random() * 3)
      if (senderIndex === receiverIndex) {
        receiverIndex = (receiverIndex + 1) % 3 // Ensure different receiver
      }
      
      const riskScore = getRandomRiskScore('blocked')
      transactions.push({
        senderId: users[senderIndex].id,
        receiverId: users[receiverIndex].id,
        amount: getRandomAmount(true), // Suspicious amount
        riskScore,
        status: getTransactionStatus(riskScore),
        type: TransactionType.TRANSFER,
        description: `Suspicious transaction ${blockedCount + 1}`
      })
      blockedCount++
    }

    // Add pending transactions
    let pendingCount = 0
    while (pendingCount < PENDING_TRANSACTIONS) {
      const senderIndex = Math.floor(Math.random() * 3)
      let receiverIndex = Math.floor(Math.random() * 3)
      if (senderIndex === receiverIndex) {
        receiverIndex = (receiverIndex + 1) % 3 // Ensure different receiver
      }
      
      const riskScore = getRandomRiskScore('pending')
      transactions.push({
        senderId: users[senderIndex].id,
        receiverId: users[receiverIndex].id,
        amount: getRandomAmount(false),
        riskScore,
        status: getTransactionStatus(riskScore),
        type: TransactionType.TRANSFER,
        description: `Pending transaction ${pendingCount + 1}`
      })
      pendingCount++
    }

    // Add successful transactions
    let successfulCount = 0
    while (successfulCount < SUCCESSFUL_TRANSACTIONS) {
      const senderIndex = Math.floor(Math.random() * 3)
      let receiverIndex = Math.floor(Math.random() * 3)
      if (senderIndex === receiverIndex) {
        receiverIndex = (receiverIndex + 1) % 3 // Ensure different receiver
      }
      
      const riskScore = getRandomRiskScore('successful')
      transactions.push({
        senderId: users[senderIndex].id,
        receiverId: users[receiverIndex].id,
        amount: getRandomAmount(false),
        riskScore,
        status: getTransactionStatus(riskScore),
        type: TransactionType.TRANSFER,
        description: `Transaction ${successfulCount + 1}`
      })
      successfulCount++
    }

    // Shuffle transactions to randomize order
    transactions.sort(() => Math.random() - 0.5)

    console.log(`📊 Generated ${transactions.length} transactions with distribution:`)
    console.log(`   - Blocked: ${transactions.filter(t => t.status === 'FAILED').length}`)
    console.log(`   - Pending: ${transactions.filter(t => t.status === 'PENDING').length}`)
    console.log(`   - Successful: ${transactions.filter(t => t.status === 'COMPLETED').length}`)

    // Create transactions in database
    let createdCount = 0
    for (const tx of transactions) {
      try {
        // Create sender transaction (debit)
        await prisma.transaction.create({
          data: {
            amount: tx.amount,
            type: tx.type,
            description: tx.description,
            userId: tx.senderId,
            status: tx.status,
            riskScore: tx.riskScore,
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last 7 days
          }
        })

        // Create receiver transaction (credit) - only if not blocked
        if (tx.status !== 'FAILED') {
          await prisma.transaction.create({
            data: {
              amount: tx.amount,
              type: TransactionType.INCOME,
              description: `Received from transaction`,
              userId: tx.receiverId,
              status: tx.status === 'PENDING' ? 'PENDING' : 'COMPLETED',
              date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            }
          })
        }

        createdCount++
        if (createdCount % 50 === 0) {
          console.log(`✅ Created ${createdCount}/${transactions.length} transactions...`)
        }
      } catch (error) {
        console.error(`❌ Error creating transaction:`, error)
      }
    }

    // Create suspicious behavior session for Bikram
    const bikramUser = users.find(u => u.name.toLowerCase().includes('bikram'))
    if (bikramUser) {
      await prisma.behaviorSession.create({
        data: {
          userId: bikramUser.id,
          score: 85, // High risk score
          riskLevel: 'HIGH',
          createdAt: new Date()
        }
      })
      
      // Create notification for flagged user
      await prisma.notification.create({
        data: {
          title: 'User Flagged',
          message: `User ${bikramUser.name} has been flagged for suspicious activity due to high transaction risk scores`,
          type: 'USER_FLAGGED',
          userId: bikramUser.id,
          isRead: false,
          updatedAt: new Date()
        }
      })
      
      console.log(`🚨 Flagged ${bikramUser.name} as suspicious user`)
    }

    console.log(`\n✅ Successfully generated ${createdCount} transactions!`)
    console.log(`📈 Final distribution:`)
    
    const finalStats = await prisma.transaction.groupBy({
      by: ['status'],
      where: {
        userId: { in: users.map(u => u.id) },
        type: 'TRANSFER'
      },
      _count: { id: true }
    })
    
    finalStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.id}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateTransactions()
