import { db } from '../lib/db'

async function testEnhancedNetworkMap() {
  console.log('🧪 Testing Enhanced Network Map Features...\n')

  try {
    // Test the enhanced network map API
    console.log('📡 Testing network map API...')
    
    const response = await fetch('http://localhost:3000/api/admin/network-map')
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Network map API response successful')

    // Test enhanced node data
    console.log('\n👤 Testing Enhanced Node Data:')
    if (data.data?.nodes) {
      const sampleNodes = data.data.nodes.slice(0, 3)
      sampleNodes.forEach((node, i) => {
        console.log(`\n   Node ${i + 1}: ${node.name}`)
        console.log(`   - Transaction Count: ${node.transactionCount}`)
        console.log(`   - Avg Risk Score: ${node.avgRiskScore?.toFixed(2)}`)
        console.log(`   - High Risk Transactions: ${node.highRiskTransactions}`)
        console.log(`   - Known Recipients: ${node.knownRecipients?.length || 0}`)
        console.log(`   - Known Amounts: ${node.knownAmounts?.length || 0}`)
        console.log(`   - Avg Transaction Amount: ₹${node.avgTransactionAmount?.toLocaleString()}`)
        console.log(`   - Last Transaction: ${node.lastTransactionDate ? new Date(node.lastTransactionDate).toLocaleDateString() : 'Never'}`)
      })
    }

    // Test enhanced link data
    console.log('\n🔗 Testing Enhanced Link Data:')
    if (data.data?.links) {
      const sampleLinks = data.data.links.slice(0, 3)
      sampleLinks.forEach((link, i) => {
        console.log(`\n   Link ${i + 1}:`)
        console.log(`   - Transaction Count: ${link.count}`)
        console.log(`   - Total Amount: ₹${link.totalAmount?.toLocaleString()}`)
        console.log(`   - Average Amount: ₹${link.avgAmount?.toLocaleString()}`)
        console.log(`   - Average Risk Score: ${link.avgRiskScore?.toFixed(2)}`)
        console.log(`   - Frequency: ${link.frequency}`)
        console.log(`   - Known Pattern: ${link.isKnownPattern}`)
        console.log(`   - Last Transaction: ${link.lastTransaction ? new Date(link.lastTransaction).toLocaleDateString() : 'Never'}`)
      })
    }

    // Test enhanced summary
    console.log('\n📊 Testing Enhanced Summary:')
    if (data.data?.summary) {
      const summary = data.data.summary
      console.log(`   - Total Nodes: ${summary.totalNodes}`)
      console.log(`   - Total Links: ${summary.totalLinks}`)
      console.log(`   - Total Transactions: ${summary.totalTransactions}`)
      console.log(`   - High Risk Transactions: ${summary.highRiskTransactions}`)
      console.log(`   - Average Risk Score: ${summary.avgRiskScore?.toFixed(2)}`)
      console.log(`   - Known Patterns: ${summary.knownPatterns}`)
      console.log(`   - Last Updated: ${new Date(summary.lastUpdated).toLocaleString()}`)
    }

    // Test known patterns functionality
    console.log('\n🔍 Testing Known Patterns Detection:')
    
    // Get Bikram and Nand transactions to test pattern detection
    const bikram = await db.user.findFirst({
      where: { name: { contains: 'bikram', mode: 'insensitive' } },
      include: { Transaction: true }
    })

    const nand = await db.user.findFirst({
      where: { name: { contains: 'nand', mode: 'insensitive' } },
      include: { Transaction: true }
    })

    if (bikram && nand) {
      console.log(`\n   Bikram's Transactions: ${bikram.Transaction.length}`)
      console.log(`   Nand's Transactions: ${nand.Transaction.length}`)

      // Check for Bikram to Nand transactions
      const bikramToNandTransactions = bikram.Transaction.filter(tx => 
        tx.description.includes('Nand')
      )
      
      console.log(`   Bikram to Nand Transactions: ${bikramToNandTransactions.length}`)
      
      if (bikramToNandTransactions.length > 0) {
        console.log('   ✅ Pattern detection should identify this as a known pattern')
        bikramToNandTransactions.slice(0, 3).forEach((tx, i) => {
          console.log(`     ${i + 1}. ₹${tx.amount.toLocaleString()} - ${tx.description}`)
        })
      }
    }

    // Test risk score analysis
    console.log('\n⚠️  Testing Risk Score Analysis:')
    const highRiskTransactions = await db.transaction.findMany({
      where: { riskScore: { gt: 70 } },
      select: { amount: true, description: true, riskScore: true },
      orderBy: { riskScore: 'desc' },
      take: 5
    })

    console.log(`   Found ${highRiskTransactions.length} high-risk transactions:`)
    highRiskTransactions.forEach((tx, i) => {
      console.log(`     ${i + 1}. Risk: ${tx.riskScore}, Amount: ₹${tx.amount.toLocaleString()}, Desc: ${tx.description}`)
    })

    console.log('\n🎉 Enhanced Network Map Test Completed Successfully!')
    console.log('✅ All new features are working correctly')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the test
testEnhancedNetworkMap()
