import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function checkUserAccounts() {
    try {
        console.log('Checking all users and their account status...\n')

        // Get all users with their accounts
        const users = await prisma.user.findMany({
            include: {
                accounts: true,
                _count: {
                    select: {
                        accounts: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        console.log(`Total users found: ${users.length}\n`)

        const usersWithoutAccounts: Array<{id: string, name: string, email: string}> = []
        const usersWithAccounts = []

        for (const user of users) {
            const accountCount = user._count.accounts
            const hasAccount = accountCount > 0
            
            if (hasAccount) {
                usersWithAccounts.push({
                    name: user.name,
                    email: user.email,
                    accountCount: accountCount,
                    balance: user.accounts[0]?.balance || 0
                })
            } else {
                usersWithoutAccounts.push({
                    id: user.id,
                    name: user.name,
                    email: user.email
                })
            }
        }

        // Users with accounts
        console.log('✅ Users WITH accounts:')
        usersWithAccounts.forEach(user => {
            console.log(`   ${user.name} (${user.email}) - Balance: $${user.balance.toFixed(2)}`)
        })

        // Users without accounts
        if (usersWithoutAccounts.length > 0) {
            console.log('\n❌ Users WITHOUT accounts:')
            usersWithoutAccounts.forEach(user => {
                console.log(`   ${user.name} (${user.email})`)
            })
            
            console.log('\n🔧 Creating accounts for users without accounts...')
            
            // Get the full user objects for those without accounts
            const usersWithoutAccountsFull = await prisma.user.findMany({
                where: {
                    id: {
                        in: usersWithoutAccounts.map(u => u.id)
                    }
                }
            })
            
            for (const user of usersWithoutAccountsFull) {
                console.log(`Creating account for ${user.name}...`)
                await prisma.account.create({
                    data: {
                        userId: user.id,
                        balance: 100.00, // Give them a starting balance
                        currency: 'USD',
                    }
                })
                console.log(`✅ Account created for ${user.name} with $100.00`)
            }
        } else {
            console.log('\n✅ All users have accounts!')
        }

        console.log('\n🎉 Account check completed!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUserAccounts()
