import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    // Cleanup existing data in correct order (delete dependents first)
    await prisma.notification.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.behaviorSession.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()

    const hashedPassword = await hash('password@123', 10)

    // Create Demo User (John Doe)
    const user = await prisma.user.create({
        data: {
            email: 'john@example.com',
            password: hashedPassword,
            name: 'John Doe',
            role: "USER",
            accounts: {
                create: {
                    balance: 24580.50,
                    currency: 'USD',
                },
            },
            sessions: {
                create: {
                    score: 85,
                    riskLevel: "LOW",
                },
            },
        },
        include: {
            accounts: true,
        },
    })

    // Create Admin User
    await prisma.user.create({
        data: {
            email: 'admin@banking.com',
            password: hashedPassword,
            name: 'Admin User',
            role: "ADMIN",
        },
    })

    // Create Transactions
    const transactions = [
        {
            amount: 15.99,
            type: "EXPENSE" as const,
            description: 'Netflix Subscription',
            date: new Date(), // Today
        },
        {
            amount: 5000.00,
            type: "INCOME" as const,
            description: 'Salary Deposit',
            date: new Date(Date.now() - 86400000), // Yesterday
        },
        {
            amount: 18.50,
            type: "EXPENSE" as const,
            description: 'Uber Ride',
            date: new Date(Date.now() - 2 * 86400000), // 2 days ago
        },
        {
            amount: 89.99,
            type: "EXPENSE" as const,
            description: 'Amazon Purchase',
            date: new Date(Date.now() - 3 * 86400000), // 3 days ago
        },
        {
            amount: 350.00,
            type: "INCOME" as const,
            description: 'Freelance Payment',
            date: new Date(Date.now() - 4 * 86400000), // 4 days ago
        },
    ]

    for (const tx of transactions) {
        await prisma.transaction.create({
            data: {
                amount: tx.amount,
                type: tx.type,
                description: tx.description,
                date: tx.date,
                userId: user.id,
            },
        })
    }

    console.log('Seed data created successfully')
    console.log('User ID:', user.id)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
