import { db } from '../lib/db'
import { syncAccountBalance } from '../lib/balance'

async function createFalsePositiveTransactions() {
  console.log('🚨 Creating 3 False Positive Transactions from Bikram to Nand...\n')

  try {
    // Find Bikram and Nand users
    const bikram = await db.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'bikram', mode: 'insensitive' } },
          { email: { contains: 'bikram', mode: 'insensitive' } }
        ]
      }
    })

    const nand = await db.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'nand', mode: 'insensitive' } },
          { email: { contains: 'nand', mode: 'insensitive' } }
        ]
      }
    })

    if (!bikram || !nand) {
      console.log('❌ Could not find Bikram or Nand users')
      return
    }

    console.log(`👤 Found users:`)
    console.log(`   Sender: ${bikram.name} (${bikram.email})`)
    console.log(`   Recipient: ${nand.name} (${nand.email})`)

    // Get Bikram's current balance
    const bikramBalance = await syncAccountBalance(bikram.id)
    console.log(`\n💰 Bikram's current balance: ₹${bikramBalance.toLocaleString()}`)

    // Create 3 false positive transactions with suspicious patterns
    const falsePositiveTransactions = [
      {
        amount: 95000, // High amount, close to 100k threshold
        description: "Urgent payment - vendor settlement",
        riskScore: 75, // High risk score but below blocking threshold
        reason: "High amount + urgent wording"
      },
      {
        amount: 87500, // Another high amount
        description: "Investment transfer - quick processing",
        riskScore: 72, // High risk score
        reason: "Large amount + quick processing wording"
      },
      {
        amount: 125000, // Very high amount
        description: "Emergency fund transfer",
        riskScore: 78, // Very high risk score
        reason: "Very high amount + emergency wording"
      }
    ]

    console.log(`\n🚨 Creating ${falsePositiveTransactions.length} false positive transactions...`)

    const createdTransactions = []

    for (let i = 0; i < falsePositiveTransactions.length; i++) {
      const tx = falsePositiveTransactions[i]
      
      // Check if Bikram has sufficient funds
      if (bikramBalance < tx.amount) {
        console.log(`⚠️  Skipping transaction ${i + 1}: Insufficient funds (₹${bikramBalance.toLocaleString()} < ₹${tx.amount.toLocaleString()})`)
        continue
      }

      console.log(`\n📝 Transaction ${i + 1}:`)
      console.log(`   Amount: ₹${tx.amount.toLocaleString()}`)
      console.log(`   Description: ${tx.description}`)
      console.log(`   Risk Score: ${tx.riskScore}`)
      console.log(`   False Positive Reason: ${tx.reason}`)

      // Create sender transaction (TRANSFER from Bikram)
      const senderTransaction = await db.transaction.create({
        data: {
          amount: tx.amount,
          type: 'TRANSFER',
          description: `${tx.description} to ${nand.name}`,
          userId: bikram.id,
          status: 'COMPLETED',
          riskScore: tx.riskScore
        }
      })

      // Create recipient transaction (INCOME for Nand)
      const recipientTransaction = await db.transaction.create({
        data: {
          amount: tx.amount,
          type: 'INCOME',
          description: `Received from ${bikram.name} - ${tx.description}`,
          userId: nand.id,
          status: 'COMPLETED',
          riskScore: 0 // Recipient transactions typically have 0 risk score
        }
      })

      createdTransactions.push({
        sender: senderTransaction,
        recipient: recipientTransaction,
        amount: tx.amount,
        riskScore: tx.riskScore
      })

      console.log(`   ✅ Created sender transaction: ${senderTransaction.id}`)
      console.log(`   ✅ Created recipient transaction: ${recipientTransaction.id}`)
    }

    // Sync balances for both users
    console.log(`\n🔄 Syncing account balances...`)
    
    const bikramNewBalance = await syncAccountBalance(bikram.id)
    const nandNewBalance = await syncAccountBalance(nand.id)

    console.log(`💰 Updated Balances:`)
    console.log(`   Bikram: ₹${bikramNewBalance.toLocaleString()}`)
    console.log(`   Nand: ₹${nandNewBalance.toLocaleString()}`)

    // Summary
    console.log(`\n📊 False Positive Transaction Summary:`)
    console.log(`   Total transactions created: ${createdTransactions.length}`)
    
    let totalAmount = 0
    createdTransactions.forEach((tx, i) => {
      totalAmount += tx.amount
      console.log(`   ${i + 1}. ₹${tx.amount.toLocaleString()} (Risk: ${tx.riskScore})`)
    })
    
    console.log(`   Total amount transferred: ₹${totalAmount.toLocaleString()}`)
    console.log(`   Average risk score: ${(createdTransactions.reduce((sum, tx) => sum + tx.riskScore, 0) / createdTransactions.length).toFixed(1)}`)

    console.log(`\n🎉 False positive transactions created successfully!`)
    console.log(`📝 These transactions should trigger fraud detection alerts but are actually legitimate.`)

  } catch (error) {
    console.error('❌ Error creating false positive transactions:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the function
createFalsePositiveTransactions()
