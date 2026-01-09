const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/securebank',
});

async function main() {
    await client.connect();

    try {
        await client.query(`
            ALTER TABLE "Transaction" 
            ADD COLUMN IF NOT EXISTS "riskScore" DOUBLE PRECISION DEFAULT 0;
        `);
        console.log('Added riskScore to Transaction');
    } catch (e) {
        console.log('Error adding riskScore:', e.message);
    }

    // Also check BehaviorSession table which is new in schema
    /*
    model BehaviorSession {
      id        String   @id @default(uuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id])
      score     Float // 0-100
      riskLevel RiskLevel
      createdAt DateTime @default(now())
    }
    */
    // If this table is missing, 'prisma db push' should have created it.
    // I'll try to create it if it doesn't exist.

    // Actually, handling enums and relations manually is hard.
    // Let's just focus on the reported error: "The column (not available) does not exist".
    // This usually refers to a specific column being queried. 
    // The query was `db.transaction.findMany`.

    await client.end();
}

main().catch(console.error);
