import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function testConnection() {
  try {
    const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/securebank";
    console.log('Testing connection to:', databaseUrl);
    
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    const db = new PrismaClient({ adapter });
    
    // Test basic connection
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Test transaction count
    const transactionCount = await db.transaction.count();
    console.log(`📊 Found ${transactionCount} transactions in database`);
    
    // Test user count
    const userCount = await db.user.count();
    console.log(`👥 Found ${userCount} users in database`);
    
    // List all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check column names in Transaction table
    const tableInfo = await db.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Transaction table columns:');
    tableInfo.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    if (transactionCount > 0) {
      const transactions = await db.transaction.findMany({
        take: 5,
        include: { User: true },
        orderBy: { riskScore: 'desc' }
      });
      
      console.log('\n📋 Sample transactions (sorted by risk score):');
      transactions.forEach(t => {
        console.log(`- User: ${t.User.name}, Amount: $${t.amount}, Risk: ${t.riskScore || 0}, Type: ${t.type}, Status: ${t.status}`);
      });
      
      // Check risk score distribution
      const riskStats = await db.$queryRaw`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN "riskScore" > 0 THEN 1 END) as with_risk,
          COUNT(CASE WHEN "riskScore" >= 70 THEN 1 END) as high_risk,
          COUNT(CASE WHEN "riskScore" >= 40 AND "riskScore" < 70 THEN 1 END) as medium_risk,
          COUNT(CASE WHEN "riskScore" > 0 AND "riskScore" < 40 THEN 1 END) as low_risk,
          MAX("riskScore") as max_risk,
          AVG("riskScore") as avg_risk
        FROM "Transaction"
      `;
      
      console.log('\n📊 Risk Score Distribution:');
      console.log(`Total transactions: ${riskStats[0].total}`);
      console.log(`With risk scores: ${riskStats[0].with_risk}`);
      console.log(`High risk (70+): ${riskStats[0].high_risk}`);
      console.log(`Medium risk (40-70): ${riskStats[0].medium_risk}`);
      console.log(`Low risk (0-40): ${riskStats[0].low_risk}`);
      console.log(`Max risk score: ${riskStats[0].max_risk}`);
      console.log(`Avg risk score: ${riskStats[0].avg_risk}`);
      
    } else {
      console.log('❌ No transactions found. You may need to generate test data.');
    }
    
    await db.$disconnect();
    console.log('✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
