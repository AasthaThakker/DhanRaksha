import { db } from '../lib/db'
import { syncAccountBalance } from '../lib/balance'

async function addFundsToUsers() {
  console.log('💰 Adding ₹300,000 to Nand and Bikram users...\n')

  try {
    // Find Nand and Bikram users
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: 'nand', mode: 'insensitive' } },
          { name: { contains: 'bikram', mode: 'insensitive' } },
          { email: { contains: 'nand', mode: 'insensitive' } },
          { email: { contains: 'bikram', mode: 'insensitive' } }
        ]
      },
      include: { Account: true }
    })

    if (users.length === 0) {
      console.log('❌ No users found with names "nand" or "bikram"')
      return
    }

    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`)
    })

    const amountToAdd = 300000
    console.log(`\n💸 Adding ₹${amountToAdd.toLocaleString()} to each user...`)

    for (const user of users) {
      // Check if user has an account
      if (!user.Account || user.Account.length === 0) {
        console.log(`⚠️  ${user.name} has no account, skipping...`)
        continue
      }

      const account = user.Account[0]
      console.log(`\n👤 Processing ${user.name}:`)
      console.log(`   Current balance: ₹${account.balance.toLocaleString()}`)

      // Create income transaction
      const transaction = await db.transaction.create({
        data: {
          amount: amountToAdd,
          type: 'INCOME',
          description: 'Admin funds addition - ₹300,000',
          userId: user.id,
          status: 'COMPLETED',
          riskScore: 0
        }
      })

      console.log(`   ✅ Created transaction: ${transaction.id}`)

      // Sync account balance
      const newBalance = await syncAccountBalance(user.id)
      console.log(`   💰 New balance: ₹${newBalance.toLocaleString()}`)

      // Verify the balance update
      const updatedAccount = await db.account.findFirst({
        where: { userId: user.id },
        select: { balance: true }
      })

      console.log(`   ✅ Verified database balance: ₹${updatedAccount?.balance?.toLocaleString()}`)
    }

    console.log('\n🎉 Successfully added funds to all eligible users!')

    // Show final summary
    console.log('\n📊 Final Summary:')
    for (const user of users) {
      if (user.Account && user.Account.length > 0) {
        const finalAccount = await db.account.findFirst({
          where: { userId: user.id },
          select: { balance: true }
        })
        console.log(`- ${user.name}: ₹${finalAccount?.balance?.toLocaleString()}`)
      }
    }

  } catch (error) {
    console.error('❌ Error adding funds:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the function
addFundsToUsers()
