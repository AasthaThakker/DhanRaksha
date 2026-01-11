import { db } from '../lib/db'
import { calculateDynamicBalance, syncAccountBalance, getAccurateBalance } from '../lib/balance'

async function testDynamicBalance() {
  console.log('🧪 Testing Dynamic Balance System...\n')

  try {
    // Get a test user
    const testUser = await db.user.findFirst({
      include: { Account: true, Transaction: true }
    })

    if (!testUser) {
      console.log('❌ No test user found')
      return
    }

    console.log(`👤 Testing with user: ${testUser.name} (${testUser.email})`)
    console.log(`📊 Current static balance: ₹${testUser.Account[0]?.balance || 0}`)

    // Get all transactions for this user
    const transactions = await db.transaction.findMany({
      where: { userId: testUser.id },
      orderBy: { date: 'desc' }
    })

    console.log(`📝 Found ${transactions.length} transactions`)

    // Calculate dynamic balance
    const dynamicBalance = await calculateDynamicBalance(testUser.id)
    console.log(`💰 Dynamic balance: ₹${dynamicBalance}`)

    // Check if balances match
    const staticBalance = testUser.Account[0]?.balance || 0
    const difference = Math.abs(staticBalance - dynamicBalance)
    
    console.log(`🔍 Difference: ₹${difference}`)

    if (difference > 0.01) {
      console.log('⚠️  Balance mismatch detected! Syncing...')
      await syncAccountBalance(testUser.id)
      console.log('✅ Balance synced successfully')
    } else {
      console.log('✅ Balances are in sync')
    }

    // Test accurate balance function
    const accurateBalance = await getAccurateBalance(testUser.id)
    console.log(`🎯 Accurate balance result:`, accurateBalance)

    // Show transaction breakdown
    console.log('\n📋 Transaction Breakdown:')
    let income = 0
    let expenses = 0
    
    transactions.forEach(tx => {
      if (tx.type === 'INCOME') {
        income += tx.amount
        console.log(`  +₹${tx.amount} - ${tx.description} (${tx.type})`)
      } else {
        expenses += tx.amount
        console.log(`  -₹${tx.amount} - ${tx.description} (${tx.type})`)
      }
    })

    console.log(`\n💵 Total Income: ₹${income}`)
    console.log(`💸 Total Expenses: ₹${expenses}`)
    console.log(`🧮 Net Balance: ₹${income - expenses}`)

    // Test with a new transaction
    console.log('\n🧪 Testing with new transaction...')
    
    // Create a test income transaction
    const testTransaction = await db.transaction.create({
      data: {
        amount: 100,
        type: 'INCOME',
        description: 'Test dynamic balance income',
        userId: testUser.id,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    console.log(`✅ Created test transaction: ₹${testTransaction.amount}`)

    // Calculate new balance
    const newDynamicBalance = await calculateDynamicBalance(testUser.id)
    console.log(`🆕 New dynamic balance: ₹${newDynamicBalance}`)
    console.log(`📈 Expected balance: ₹${dynamicBalance + 100}`)

    // Clean up test transaction
    await db.transaction.delete({
      where: { id: testTransaction.id }
    })
    console.log('🧹 Cleaned up test transaction')

    // Final sync
    await syncAccountBalance(testUser.id)
    console.log('✅ Final balance sync completed')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the test
testDynamicBalance()
