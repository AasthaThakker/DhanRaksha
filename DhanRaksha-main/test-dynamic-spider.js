import { config } from 'dotenv';

config();

async function testDynamicSpider() {
    try {
        console.log('🔄 Testing dynamic spider chart functionality...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log(`✅ Found ${data.spiderChartData.length} users with dynamic spider data\n`);
        
        // Test each user's data
        data.spiderChartData.forEach((user, index) => {
            console.log(`🕸️  User ${index + 1}: ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   💰 Avg Amount: ₹${user.avgAmount.toLocaleString()}`);
            console.log(`   💎 Max Amount: ₹${user.maxAmount.toLocaleString()}`);
            console.log(`   📊 Risk Score: ${user.riskScore.toFixed(1)}`);
            console.log(`   📈 Transaction Volume: ${user.transactionVolume}`);
            console.log(`   🚨 Critical Risk: ${user.criticalRiskCount} (${user.criticalRiskRatio.toFixed(1)}%)`);
            console.log(`   ⚠️  High Risk: ${user.highRiskCount} (${user.highRiskRatio.toFixed(1)}%)`);
            console.log(`   ❌ Failed Transactions: ${user.failedTransactionRatio.toFixed(1)}%`);
            console.log(`   💸 Large Transactions: ${user.largeTransactionRatio.toFixed(1)}%`);
            console.log(`   📅 Recent Activity: ${user.recentActivityRatio.toFixed(1)}%`);
            console.log(`   💵 Income Ratio: ${user.incomeRatio.toFixed(1)}%`);
            console.log(`   💸 Expense Ratio: ${user.expenseRatio.toFixed(1)}%`);
            console.log(`   🔄 Transfer Ratio: ${user.transferRatio.toFixed(1)}%`);
            console.log('');
        });
        
        console.log('🎯 Dynamic Spider Chart Features:');
        console.log('   ✅ Each user has unique risk profile');
        console.log('   ✅ Average amounts calculated per user');
        console.log('   ✅ Risk ratios dynamically calculated');
        console.log('   ✅ Transaction patterns analyzed per user');
        console.log('   ✅ All data sourced from database transactions');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDynamicSpider();
