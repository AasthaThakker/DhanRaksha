import { db } from '../lib/db'
import { syncAccountBalance } from '../lib/balance'

async function addFundsToBikram() {
  console.log('💰 Adding ₹2,500,000 to Bikram\'s account...\n')

  try {
    // Find Bikram user
    const bikram = await db.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'bikram', mode: 'insensitive' } },
          { email: { contains: 'bikram', mode: 'insensitive' } }
        ]
      },
      include: { Account: true }
    })

    if (!bikram) {
      console.log('❌ Bikram user not found')
      return
    }

    console.log(`👤 Found Bikram: ${bikram.name} (${bikram.email})`)

    // Check if user has an account
    if (!bikram.Account || bikram.Account.length === 0) {
      console.log('❌ Bikram has no account')
      return
    }

    const account = bikram.Account[0]
    const amountToAdd = 2500000

    console.log(`\n📊 Current Account Status:`)
    console.log(`   Current balance: ₹${account.balance.toLocaleString()}`)

    console.log(`\n💸 Adding ₹${amountToAdd.toLocaleString()}...`)

    // Create income transaction
    const transaction = await db.transaction.create({
      data: {
        amount: amountToAdd,
        type: 'INCOME',
        description: 'Admin funds addition - ₹2,500,000',
        userId: bikram.id,
        status: 'COMPLETED',
        riskScore: 0
      }
    })

    console.log(`   ✅ Created transaction: ${transaction.id}`)
    console.log(`   ✅ Transaction amount: ₹${transaction.amount.toLocaleString()}`)

    // Sync account balance
    const newBalance = await syncAccountBalance(bikram.id)
    console.log(`   💰 New synced balance: ₹${newBalance.toLocaleString()}`)

    // Verify the balance update
    const updatedAccount = await db.account.findFirst({
      where: { userId: bikram.id },
      select: { balance: true }
    })

    console.log(`   ✅ Verified database balance: ₹${updatedAccount?.balance?.toLocaleString()}`)

    // Calculate the expected balance
    const expectedBalance = account.balance + amountToAdd
    console.log(`\n🔍 Verification:`)
    console.log(`   Expected balance: ₹${expectedBalance.toLocaleString()}`)
    console.log(`   Actual balance: ₹${newBalance.toLocaleString()}`)
    console.log(`   Match: ${Math.abs(newBalance - expectedBalance) < 0.01 ? '✅' : '❌'}`)

    // Show transaction summary
    console.log(`\n📋 Transaction Summary:`)
    console.log(`   User: ${bikram.name}`)
    console.log(`   Previous balance: ₹${account.balance.toLocaleString()}`)
    console.log(`   Amount added: ₹${amountToAdd.toLocaleString()}`)
    console.log(`   New balance: ₹${newBalance.toLocaleString()}`)
    console.log(`   Transaction ID: ${transaction.id}`)
    console.log(`   Status: COMPLETED`)

    console.log('\n🎉 Successfully added ₹2,500,000 to Bikram\'s account!')

  } catch (error) {
    console.error('❌ Error adding funds:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the function
addFundsToBikram()
