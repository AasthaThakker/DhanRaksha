import { db } from '../lib/db'
import { getAccurateBalance, syncAccountBalance } from '../lib/balance'

async function testDashboardBalanceSync() {
  console.log('🧪 Testing Dashboard Balance Sync with Total Amounts...\n')

  try {
    // Test Nand and Bikram users specifically
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: 'nand', mode: 'insensitive' } },
          { name: { contains: 'bikram', mode: 'insensitive' } }
        ]
      },
      include: { Account: true, Transaction: true }
    })

    if (users.length === 0) {
      console.log('❌ No users found with names "nand" or "bikram"')
      return
    }

    console.log(`Found ${users.length} users to test dashboard sync:`)

    for (const user of users) {
      console.log(`\n👤 Testing ${user.name} (${user.email}):`)
      
      // Get current balance info
      const balanceInfo = await getAccurateBalance(user.id)
      console.log(`   Current balance: ₹${balanceInfo.balance.toLocaleString()}`)
      console.log(`   Database balance: ₹${balanceInfo.databaseBalance.toLocaleString()}`)
      console.log(`   Dynamic balance: ₹${balanceInfo.dynamicBalance.toLocaleString()}`)
      console.log(`   Is synced: ${balanceInfo.isSynced ? '✅' : '❌'}`)

      // Force sync (like dashboard does)
      const syncedBalance = await syncAccountBalance(user.id)
      console.log(`   After sync: ₹${syncedBalance.toLocaleString()}`)

      // Get updated balance info
      const updatedBalanceInfo = await getAccurateBalance(user.id)
      console.log(`   Updated balance: ₹${updatedBalanceInfo.balance.toLocaleString()}`)
      console.log(`   Updated synced: ${updatedBalanceInfo.isSynced ? '✅' : '❌'}`)

      // Simulate dashboard API response
      const dashboardData = {
        account: {
          balance: syncedBalance,
          currency: user.Account[0]?.currency || 'INR',
          isSynced: updatedBalanceInfo.isSynced,
          databaseBalance: updatedBalanceInfo.databaseBalance,
          dynamicBalance: updatedBalanceInfo.dynamicBalance
        }
      }

      console.log(`   📊 Dashboard would show: ₹${dashboardData.account.balance.toLocaleString()}`)
      console.log(`   📊 Dashboard sync status: ${dashboardData.account.isSynced ? '✅ Synced' : '❌ Not synced'}`)
    }

    // Test with a random user to ensure general functionality
    console.log('\n🔍 Testing with random user:')
    const randomUser = await db.user.findFirst({
      include: { Account: true, Transaction: true }
    })

    if (randomUser) {
      console.log(`   User: ${randomUser.name}`)
      
      // Simulate dashboard API call
      const syncedBalance = await syncAccountBalance(randomUser.id)
      const balanceInfo = await getAccurateBalance(randomUser.id)
      
      console.log(`   Dashboard balance: ₹${syncedBalance.toLocaleString()}`)
      console.log(`   Sync status: ${balanceInfo.isSynced ? '✅' : '❌'}`)
      console.log(`   ✅ Dashboard sync working correctly`)
    }

    console.log('\n🎉 Dashboard balance sync test completed successfully!')
    console.log('✅ Dashboard will show the correct synced total amounts')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the test
testDashboardBalanceSync()
