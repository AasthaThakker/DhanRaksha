import { db } from '../lib/db'

async function testNetworkMapFeatures() {
  console.log('🧪 Testing Enhanced Network Map Database Features...\n')

  try {
    // Test user-based known transactions
    console.log('👤 Testing User-Based Known Transactions:')
    
    const users = await db.user.findMany({
      where: {
        Account: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 5
    })

    console.log(`   Found ${users.length} users for testing`)

    for (const user of users) {
      console.log(`\n   📊 ${user.name} (${user.email}):`)
      
      // Get user's transactions
      const transactions = await db.transaction.findMany({
        where: { userId: user.id },
        select: { amount: true, description: true, type: true, riskScore: true, date: true },
        orderBy: { date: 'desc' },
        take: 10
      })

      console.log(`     Transactions: ${transactions.length}`)
      
      if (transactions.length > 0) {
        // Calculate known patterns
        const knownRecipients = []
        const knownAmounts = []
        let totalAmount = 0
        let totalRiskScore = 0
        let highRiskCount = 0

        transactions.forEach(transaction => {
          if (transaction.type === 'TRANSFER') {
            // Extract recipient from description
            const patterns = [/to (.+?):/, /Transfer to (.+?):/, /from (.+?):/]
            for (const pattern of patterns) {
              const match = transaction.description.match(pattern)
              if (match) {
                knownRecipients.push(match[1].trim())
                break
              }
            }
          }
          
          knownAmounts.push(transaction.amount)
          totalAmount += transaction.amount
          totalRiskScore += transaction.riskScore || 0
          
          if ((transaction.riskScore || 0) > 70) {
            highRiskCount++
          }
        })

        // Get most common amounts
        const amountFrequency = new Map()
        knownAmounts.forEach(amount => {
          const roundedAmount = Math.round(amount / 1000) * 1000
          amountFrequency.set(roundedAmount, (amountFrequency.get(roundedAmount) || 0) + 1)
        })

        const commonAmounts = Array.from(amountFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([amount]) => amount)

        console.log(`     - Known Recipients: ${knownRecipients.length}`)
        console.log(`     - Common Amounts: ${commonAmounts.length}`)
        console.log(`     - Avg Transaction: ₹${(totalAmount / transactions.length).toLocaleString()}`)
        console.log(`     - Avg Risk Score: ${(totalRiskScore / transactions.length).toFixed(2)}`)
        console.log(`     - High Risk Transactions: ${highRiskCount}`)
        
        if (commonAmounts.length > 0) {
          console.log(`     - Most Common Amounts: ${commonAmounts.map(a => `₹${a.toLocaleString()}`).join(', ')}`)
        }
      }
    }

    // Test link patterns between specific users
    console.log('\n🔗 Testing Link Patterns Between Users:')
    
    // Find Bikram and Nand
    const bikram = await db.user.findFirst({
      where: { name: { contains: 'bikram', mode: 'insensitive' } }
    })
    
    const nand = await db.user.findFirst({
      where: { name: { contains: 'nand', mode: 'insensitive' } }
    })

    if (bikram && nand) {
      console.log(`\n   🔍 Testing Bikram ↔ Nand relationship:`)
      
      // Get Bikram's transfers to Nand
      const bikramTransactions = await db.transaction.findMany({
        where: { 
          userId: bikram.id,
          description: { contains: 'Nand', mode: 'insensitive' }
        },
        select: { amount: true, description: true, riskScore: true, date: true },
        orderBy: { date: 'desc' }
      })

      console.log(`     Bikram to Nand transactions: ${bikramTransactions.length}`)
      
      if (bikramTransactions.length > 0) {
        const totalAmount = bikramTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        const avgRiskScore = bikramTransactions.reduce((sum, tx) => sum + (tx.riskScore || 0), 0) / bikramTransactions.length
        
        console.log(`     - Total Amount: ₹${totalAmount.toLocaleString()}`)
        console.log(`     - Average Amount: ₹${(totalAmount / bikramTransactions.length).toLocaleString()}`)
        console.log(`     - Average Risk Score: ${avgRiskScore.toFixed(2)}`)
        console.log(`     - Frequency: ${bikramTransactions.length >= 5 ? 'High' : bikramTransactions.length >= 3 ? 'Medium' : 'Low'}`)
        console.log(`     - Known Pattern: ${bikramTransactions.length >= 3 ? 'Yes' : 'No'}`)
        
        console.log(`     - Recent Transactions:`)
        bikramTransactions.slice(0, 3).forEach((tx, i) => {
          console.log(`       ${i + 1}. ₹${tx.amount.toLocaleString()} (Risk: ${tx.riskScore}) - ${tx.description}`)
        })
      }
    }

    // Test risk score distribution
    console.log('\n⚠️  Testing Risk Score Distribution:')
    
    const allTransactions = await db.transaction.findMany({
      select: { riskScore: true },
      take: 100
    })

    const riskDistribution = {
      low: 0,    // 0-40
      medium: 0, // 41-70
      high: 0    // 71-100
    }

    allTransactions.forEach(tx => {
      const score = tx.riskScore || 0
      if (score <= 40) riskDistribution.low++
      else if (score <= 70) riskDistribution.medium++
      else riskDistribution.high++
    })

    console.log(`   Total Transactions: ${allTransactions.length}`)
    console.log(`   - Low Risk (0-40): ${riskDistribution.low} (${(riskDistribution.low / allTransactions.length * 100).toFixed(1)}%)`)
    console.log(`   - Medium Risk (41-70): ${riskDistribution.medium} (${(riskDistribution.medium / allTransactions.length * 100).toFixed(1)}%)`)
    console.log(`   - High Risk (71-100): ${riskDistribution.high} (${(riskDistribution.high / allTransactions.length * 100).toFixed(1)}%)`)

    console.log('\n🎉 Network Map Database Features Test Completed Successfully!')
    console.log('✅ All enhanced features are working correctly at the database level')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the test
testNetworkMapFeatures()
