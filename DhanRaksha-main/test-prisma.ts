import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
    console.log('Testing Prisma Client connection...')
    try {
        await prisma.$connect()
        console.log('✅ Connected successfully!')
        const userCount = await prisma.user.count()
        console.log(`Found ${userCount} users`)
        await prisma.$disconnect()
    } catch (error) {
        console.error('❌ Connection failed:')
        console.error(error)
        process.exit(1)
    }
}

test()
