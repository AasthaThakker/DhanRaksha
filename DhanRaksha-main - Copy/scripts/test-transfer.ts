
import { db } from '../lib/db'

async function testTransfer() {
    console.log("🧪 Starting Transfer Test...")

    try {
        console.log("👉 Fetching users...")
        // 1. Get two users
        const users = await db.user.findMany({
            take: 2,
            include: { accounts: true }
        })
        console.log("✅ Users fetched:", users.length)

        if (users.length < 2) {
            console.error("❌ Need at least 2 users to test transfer")
            return
        }

        const sender = users[0]
        const recipient = users[1]
        const amount = 10.00
        const finalRiskScore = 0

        console.log(`👤 Sender: ${sender.email} (${sender.accounts[0].id})`)
        console.log(`👤 Recipient: ${recipient.email} (${recipient.accounts[0].id})`)
        console.log(`💰 Amount: ${amount}`)

        // 2. Attempt Transaction
        console.log("🔄 Executing Transaction...")

        const result = await db.$transaction([
            db.account.update({
                where: { id: sender.accounts[0].id },
                data: { balance: { decrement: amount } }
            }),
            db.account.update({
                where: { id: recipient.accounts[0].id },
                data: { balance: { increment: amount } }
            }),
            db.transaction.create({
                data: {
                    amount,
                    type: 'TRANSFER',
                    userId: sender.id,
                    status: 'COMPLETED',
                    riskScore: finalRiskScore,
                    description: `Test Transfer to ${recipient.name}`
                }
            }),
            db.transaction.create({
                data: {
                    amount,
                    type: 'INCOME',
                    userId: recipient.id,
                    status: 'COMPLETED',
                    description: `Received from ${sender.name}`
                }
            })
        ])

        console.log("✅ Transaction Successful!", result)

    } catch (e: any) {
        console.error("❌ Transaction Failed!")
        console.error(e)
    }
}

testTransfer()
