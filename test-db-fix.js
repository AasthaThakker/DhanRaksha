import { db } from './lib/db.js';

async function testDbConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test simple query
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test user creation (simulating register API)
    const testEmail = `test-${Date.now()}@example.com`;
    const hashedPassword = '$2a$10$example.hash.here';
    
    const user = await db.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: 'Test User',
        accounts: {
          create: {
            balance: 1000.00,
            currency: 'USD',
          },
        },
      },
      include: {
        accounts: true,
      }
    });
    
    console.log('✅ User creation successful:', { id: user.id, email: user.email });
    
    // Clean up
    await db.user.delete({ where: { id: user.id } });
    console.log('✅ Cleanup successful');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testDbConnection();
