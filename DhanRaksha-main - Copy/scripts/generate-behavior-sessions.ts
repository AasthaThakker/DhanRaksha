import { PrismaClient, RiskLevel } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter})

// Configuration
const TOTAL_SESSIONS = 100
const HIGH_RISK_SESSIONS = 15
const MEDIUM_RISK_SESSIONS = 25
const LOW_RISK_SESSIONS = 60

function getRandomRiskScore(targetRiskLevel: RiskLevel): number {
  switch (targetRiskLevel) {
    case 'HIGH':
      return Math.random() * (100 - 70) + 70 // 70-100
    case 'MEDIUM':
      return Math.random() * (70 - 40) + 40 // 40-70
    case 'LOW':
      return Math.random() * 40 // 0-40
    default:
      return Math.random() * 100
  }
}

function getRandomRiskLevel(): RiskLevel {
  const rand = Math.random()
  if (rand < 0.15) return 'HIGH'
  if (rand < 0.40) return 'MEDIUM'
  return 'LOW'
}

async function generateBehaviorSessions() {
  try {
    console.log('🚀 Starting behavior session generation...')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please generate users first.')
      return
    }

    console.log(`✅ Found ${users.length} users`)

    const sessions = []
    
    // Generate high risk sessions
    for (let i = 0; i < HIGH_RISK_SESSIONS; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const score = getRandomRiskScore('HIGH')
      
      sessions.push({
        userId: randomUser.id,
        score: score,
        riskLevel: 'HIGH' as RiskLevel,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
      })
    }

    // Generate medium risk sessions
    for (let i = 0; i < MEDIUM_RISK_SESSIONS; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const score = getRandomRiskScore('MEDIUM')
      
      sessions.push({
        userId: randomUser.id,
        score: score,
        riskLevel: 'MEDIUM' as RiskLevel,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
      })
    }

    // Generate low risk sessions
    for (let i = 0; i < LOW_RISK_SESSIONS; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const score = getRandomRiskScore('LOW')
      
      sessions.push({
        userId: randomUser.id,
        score: score,
        riskLevel: 'LOW' as RiskLevel,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
      })
    }

    // Shuffle sessions to randomize order
    sessions.sort(() => Math.random() - 0.5)

    // Insert sessions in batches
    const batchSize = 20
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize)
      await prisma.behaviorSession.createMany({
        data: batch
      })
      
      console.log(`✅ Created ${Math.min(i + batchSize, sessions.length)}/${sessions.length} behavior sessions...`)
    }

    console.log(`\n✅ Successfully generated ${sessions.length} behavior sessions!`)
    
    // Show distribution
    const highRiskCount = sessions.filter(s => s.riskLevel === 'HIGH').length
    const mediumRiskCount = sessions.filter(s => s.riskLevel === 'MEDIUM').length
    const lowRiskCount = sessions.filter(s => s.riskLevel === 'LOW').length
    
    console.log('\n📈 Final distribution:')
    console.log(`   - HIGH Risk: ${highRiskCount}`)
    console.log(`   - MEDIUM Risk: ${mediumRiskCount}`)
    console.log(`   - LOW Risk: ${lowRiskCount}`)

  } catch (error) {
    console.error('❌ Error generating behavior sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateBehaviorSessions()
