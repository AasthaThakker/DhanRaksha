import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function createTestNotifications() {
    try {
        // Get test users
        const aastha = await prisma.user.findFirst({
            where: { 
                name: {
                    contains: 'aastha',
                    mode: 'insensitive'
                }
            }
        })

        const bikram = await prisma.user.findFirst({
            where: { 
                name: {
                    contains: 'bikram',
                    mode: 'insensitive'
                }
            }
        })

        if (!aastha || !bikram) {
            console.log('❌ Test users not found')
            return
        }

        console.log(`✅ Found users: ${aastha.name}, ${bikram.name}`)

        // Get current notification counts
        const aasthaNotifications = await prisma.notification.count({
            where: { userId: aastha.id, isRead: false }
        })

        const bikramNotifications = await prisma.notification.count({
            where: { userId: bikram.id, isRead: false }
        })

        console.log(`📊 ${aastha.name}: ${aasthaNotifications} unread notifications`)
        console.log(`📊 ${bikram.name}: ${bikramNotifications} unread notifications`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createTestNotifications()
