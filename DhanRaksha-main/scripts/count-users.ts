import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank"
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function countUsers() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Total users: ${userCount}`);
    
    // Also get breakdown by role
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const regularUserCount = await prisma.user.count({ where: { role: 'USER' } });
    
    console.log(`Admin users: ${adminCount}`);
    console.log(`Regular users: ${regularUserCount}`);
    
  } catch (error) {
    console.error('Error counting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countUsers();
