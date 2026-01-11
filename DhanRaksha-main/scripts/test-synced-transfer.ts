import { db } from '../lib/db'
import { getAccurateBalance, syncAccountBalance, getDatabaseBalance } from '../lib/balance'

async function testSyncedBalanceTransfer() {
  console.log('🧪 Testing Transfer with Synced Database Balances...\n')

  try {
    // Get two test users for transfer
    const users = await db.user.findMany({
      include: { Account: true, Transaction: true },
      take: 2
    })

    if (users.length < 2) {
      console.log('❌ Need at least 2 users for transfer testing')
      return
    }

    const sender = users[0]
    const recipient = users[1]

    console.log(`👤 Sender: ${sender.name} (${sender.email})`)
    console.log(`👤 Recipient: ${recipient.name} (${recipient.email})`)

    // Check initial balance states
    console.log('\n📊 Initial Balance States:')
    
    const senderInitial = await getAccurateBalance(sender.id)
    const recipientInitial = await getAccurateBalance(recipient.id)
    
    console.log(`   Sender - Database: ₹${senderInitial.databaseBalance.toLocaleString()}`)
    console.log(`   Sender - Dynamic: ₹${senderInitial.dynamicBalance.toLocaleString()}`)
    console.log(`   Sender - Synced: ${senderInitial.isSynced ? '✅' : '❌'}`)
    
    console.log(`   Recipient - Database: ₹${recipientInitial.databaseBalance.toLocaleString()}`)
    console.log(`   Recipient - Dynamic: ₹${recipientInitial.dynamicBalance.toLocaleString()}`)
    console.log(`   Recipient - Synced: ${recipientInitial.isSynced ? '✅' : '❌'}`)

    // Test transfer amount
    const transferAmount = 1000
    console.log(`\n📝 Testing transfer of ₹${transferAmount.toLocaleString()}`)

    // Verify sender has sufficient funds
    if (senderInitial.balance < transferAmount) {
      console.log(`❌ Sender insufficient funds: ₹${senderInitial.balance.toLocaleString()} < ₹${transferAmount.toLocaleString()}`)
      return
    }

    console.log(`✅ Sender has sufficient funds`)

    // Create transfer transactions
    const senderTransaction = await db.transaction.create({
      data: {
        amount: transferAmount,
        type: 'TRANSFER',
        description: `Test transfer to ${recipient.name}`,
        userId: sender.id,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    const recipientTransaction = await db.transaction.create({
      data: {
        amount: transferAmount,
        type: 'INCOME',
        description: `Test transfer from ${sender.name}`,
        userId: recipient.id,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    console.log(`✅ Created transfer transactions`)

    // Test sync functionality
    console.log('\n🔄 Testing balance sync...')
    
    const senderNewBalance = await syncAccountBalance(sender.id)
    const recipientNewBalance = await syncAccountBalance(recipient.id)
    
    console.log(`   Sender synced balance: ₹${senderNewBalance.toLocaleString()}`)
    console.log(`   Recipient synced balance: ₹${recipientNewBalance.toLocaleString()}`)

    // Verify database balances match
    const senderDbBalance = await getDatabaseBalance(sender.id)
    const recipientDbBalance = await getDatabaseBalance(recipient.id)
    
    console.log(`   Sender database balance: ₹${senderDbBalance.toLocaleString()}`)
    console.log(`   Recipient database balance: ₹${recipientDbBalance.toLocaleString()}`)

    // Check final accurate balance states
    const senderFinal = await getAccurateBalance(sender.id)
    const recipientFinal = await getAccurateBalance(recipient.id)

    console.log('\n📊 Final Balance States:')
    console.log(`   Sender - Database: ₹${senderFinal.databaseBalance.toLocaleString()}`)
    console.log(`   Sender - Dynamic: ₹${senderFinal.dynamicBalance.toLocaleString()}`)
    console.log(`   Sender - Synced: ${senderFinal.isSynced ? '✅' : '❌'}`)
    
    console.log(`   Recipient - Database: ₹${recipientFinal.databaseBalance.toLocaleString()}`)
    console.log(`   Recipient - Dynamic: ₹${recipientFinal.dynamicBalance.toLocaleString()}`)
    console.log(`   Recipient - Synced: ${recipientFinal.isSynced ? '✅' : '❌'}`)

    // Verify transfer amounts
    const expectedSenderBalance = senderInitial.databaseBalance - transferAmount
    const expectedRecipientBalance = recipientInitial.databaseBalance + transferAmount

    console.log('\n🔍 Transfer Verification:')
    console.log(`   Sender expected: ₹${expectedSenderBalance.toLocaleString()}`)
    console.log(`   Sender actual: ₹${senderFinal.balance.toLocaleString()}`)
    console.log(`   Sender correct: ${Math.abs(senderFinal.balance - expectedSenderBalance) < 0.01 ? '✅' : '❌'}`)
    
    console.log(`   Recipient expected: ₹${expectedRecipientBalance.toLocaleString()}`)
    console.log(`   Recipient actual: ₹${recipientFinal.balance.toLocaleString()}`)
    console.log(`   Recipient correct: ${Math.abs(recipientFinal.balance - expectedRecipientBalance) < 0.01 ? '✅' : '❌'}`)

    // Clean up test transactions
    await db.transaction.delete({
      where: { id: senderTransaction.id }
    })
    await db.transaction.delete({
      where: { id: recipientTransaction.id }
    })

    // Resync to original state
    await syncAccountBalance(sender.id)
    await syncAccountBalance(recipient.id)

    console.log('\n🧹 Cleaned up test transactions and resynced balances')
    console.log('✅ Transfer test with synced balances completed successfully')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the test
testSyncedBalanceTransfer()
