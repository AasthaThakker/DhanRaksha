import { config } from 'dotenv';

config();

async function testAPI() {
  try {
    console.log('Testing risk monitor API without authentication...');
    
    // Test the new test endpoint
    const response = await fetch('http://localhost:3000/api/test-risk-monitor');
    
    if (!response.ok) {
      console.error(`❌ API returned status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log(`📈 Risk trends: ${data.dailyRiskTrends?.length || 0}`);
    console.log(`👥 User summaries: ${data.userRiskSummaries?.length || 0}`);
    console.log(`🕸️ Spider chart data: ${data.spiderChartData?.length || 0}`);
    
    if (data.userRiskSummaries && data.userRiskSummaries.length > 0) {
      console.log('\n📋 Sample user risk summary:');
      const user = data.userRiskSummaries[0];
      console.log(`- User: ${user.name} (${user.email})`);
      console.log(`- Transaction Count: ${user.transactionCount}`);
      console.log(`- Avg Risk: ${user.avgTransactionRisk}`);
      console.log(`- Max Risk: ${user.maxTransactionRisk}`);
      console.log(`- Total Amount: ${user.totalAmount}`);
    }
    
    if (data.spiderChartData && data.spiderChartData.length > 0) {
      console.log('\n🕸️ Sample spider chart data:');
      const spider = data.spiderChartData[0];
      console.log(`- User: ${spider.name}`);
      console.log(`- Risk Score: ${spider.riskScore}`);
      console.log(`- Critical Risk Ratio: ${spider.criticalRiskRatio}%`);
      console.log(`- High Risk Ratio: ${spider.highRiskRatio}%`);
      console.log(`- Failed Transaction Ratio: ${spider.failedTransactionRatio}%`);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
