import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function clearTestNotifications() {
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

        // Delete all notifications for test users
        const deletedAastha = await prisma.notification.deleteMany({
            where: { userId: aastha.id }
        })

        const deletedBikram = await prisma.notification.deleteMany({
            where: { userId: bikram.id }
        })

        console.log(`🗑️  Deleted ${deletedAastha.count} notifications for ${aastha.name}`)
        console.log(`🗑️  Deleted ${deletedBikram.count} notifications for ${bikram.name}`)

        // Verify counts are now zero
        const aasthaNotifications = await prisma.notification.count({
            where: { userId: aastha.id }
        })

        const bikramNotifications = await prisma.notification.count({
            where: { userId: bikram.id }
        })

        console.log(`📊 ${aastha.name}: ${aasthaNotifications} total notifications`)
        console.log(`📊 ${bikram.name}: ${bikramNotifications} total notifications`)

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

clearTestNotifications()
