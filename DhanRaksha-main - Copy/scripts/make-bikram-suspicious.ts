import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function makeBikramSuspicious() {
  try {
    // Find Bikram
    const bikram = await prisma.user.findFirst({
      where: { 
        name: {
          contains: 'bikram',
          mode: 'insensitive'
        }
      }
    })

    if (!bikram) {
      console.log('❌ Bikram not found')
      return
    }

    console.log(`✅ Found Bikram: ${bikram.name}`)

    // Option 1: Create a custom metadata table for fraud flags
    // For now, we'll create behavior sessions to flag him

    // Create multiple high-risk behavior sessions
    await prisma.behaviorSession.createMany({
      data: [
        {
          userId: bikram.id,
          score: 95, // Very high risk
          riskLevel: 'HIGH',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          userId: bikram.id,
          score: 88,
          riskLevel: 'HIGH', 
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          userId: bikram.id,
          score: 92,
          riskLevel: 'HIGH',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ]
    })

    // Create suspicious notifications
    await prisma.notification.createMany({
      data: [
        {
          title: 'Suspicious Activity Detected',
          message: 'Multiple high-risk transactions detected from unusual location',
          type: 'USER_FLAGGED',
          userId: bikram.id,
          isRead: false
        },
        {
          title: 'Transaction Pattern Anomaly',
          message: 'User transaction velocity exceeds normal patterns',
          type: 'SYSTEM_ALERT', 
          userId: bikram.id,
          isRead: false
        }
      ]
    })

    // Option 2: Manually create some failed transactions to trigger pattern
    const failedCount = 5
    for (let i = 0; i < failedCount; i++) {
      await prisma.transaction.create({
        data: {
          amount: Math.random() * 200000 + 100000, // High amounts 100k-300k
          type: 'TRANSFER',
          description: `Suspicious transaction ${i + 1}`,
          userId: bikram.id,
          status: 'FAILED',
          riskScore: Math.random() * 20 + 80, // 80-100 risk score
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })
    }

    console.log(`✅ Made ${bikram.name} suspicious with:`)
    console.log(`   - 3 high-risk behavior sessions`)
    console.log(`   - 2 suspicious notifications`) 
    console.log(`   - ${failedCount} failed transactions with high risk scores`)
    console.log(`\n📊 Future transactions will likely fail due to:`)
    console.log(`   - High ML scores from behavior patterns`)
    console.log(`   - Suspicious transaction history`)
    console.log(`   - Multiple risk flags`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeBikramSuspicious()
