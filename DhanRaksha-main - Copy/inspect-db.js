const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/securebank',
});

async function main() {
    await client.connect();
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Transaction';
    `);

    // Prisma capitalizes models but Postgres usually lowercases tables unless quoted. 
    // Prisma default mapping for "Transaction" model is "Transaction" table if not mapped? 
    // Actually Prisma usually maps to "Transaction" (case sensitive) if not configured otherwise? 
    // Or "transaction"?

    // Let's check all tables first.
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    if (res.rows.length > 0) {
        console.log('Columns in Transaction:', res.rows.map(r => r.column_name));
    } else {
        const res2 = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transaction';
        `);
        console.log('Columns in transaction:', res2.rows.map(r => r.column_name));
    }

    await client.end();
}

main().catch(console.error);
