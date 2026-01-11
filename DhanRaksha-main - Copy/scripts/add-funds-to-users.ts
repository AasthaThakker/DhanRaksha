import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function addFundsToUsers() {
    try {
        const users = ['bikram', 'aastha']
        const amount = 1000.00

        for (const userName of users) {
            console.log(`Processing user: ${userName}`)

            // Find user by name (case-insensitive)
            const user = await prisma.user.findFirst({
                where: { 
                    name: {
                        contains: userName,
                        mode: 'insensitive'
                    }
                },
                include: {
                    accounts: true
                }
            })

            if (!user) {
                console.log(`❌ User '${userName}' not found`)
                continue
            }

            console.log(`✅ Found user: ${user.name} (${user.email})`)

            // Get or create account
            let account = user.accounts[0]
            if (!account) {
                console.log(`Creating account for ${user.name}...`)
                account = await prisma.account.create({
                    data: {
                        userId: user.id,
                        balance: 0.00,
                        currency: 'USD',
                    }
                })
            }

            // Update balance
            const oldBalance = account.balance
            const newBalance = oldBalance + amount
            
            await prisma.account.update({
                where: { id: account.id },
                data: { balance: newBalance }
            })

            // Create transaction record
            await prisma.transaction.create({
                data: {
                    amount: amount,
                    type: 'INCOME',
                    description: `Admin deposit - $${amount}`,
                    userId: user.id,
                    status: 'COMPLETED',
                    riskScore: 0
                }
            })

            console.log(`💰 Added $${amount} to ${user.name}'s account`)
            console.log(`   Old balance: $${oldBalance.toFixed(2)}`)
            console.log(`   New balance: $${newBalance.toFixed(2)}`)
            console.log('')
        }

        console.log('✅ All operations completed successfully!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

addFundsToUsers()
