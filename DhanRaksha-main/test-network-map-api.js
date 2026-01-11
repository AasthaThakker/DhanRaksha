// Test script to verify network map API is working
const testNetworkMap = async () => {
  try {
    console.log('Testing Network Map API...')
    
    const response = await fetch('http://localhost:3000/api/admin/network-map', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response Success!')
      console.log('📊 Summary:', data.summary)
      console.log('👥 Users:', data.data?.nodes?.length || 0)
      console.log('🔗 Links:', data.data?.links?.length || 0)
      console.log('💰 Total Transactions:', data.data?.summary?.totalTransactions || 0)
      
      // Check if we have high risk users
      const highRiskUsers = data.data?.nodes?.filter(node => node.avgRiskScore > 70) || []
      console.log('🚨 High Risk Users:', highRiskUsers.length)
      
      if (highRiskUsers.length > 0) {
        console.log('🔴 High Risk User Details:')
        highRiskUsers.forEach(user => {
          console.log(`  - ${user.name}: Risk Score ${user.avgRiskScore}`)
        })
      }
      
    } else {
      console.log('❌ API Response Failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message)
  }
}

// Run the test
testNetworkMap()
