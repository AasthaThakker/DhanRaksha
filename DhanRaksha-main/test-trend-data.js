import { config } from 'dotenv';

config();

async function testTrendData() {
    try {
        console.log('Testing risk trend data...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📈 Risk Trends Data:');
        data.dailyRiskTrends.forEach((trend, index) => {
            console.log(`Day ${index + 1}: ${trend.date} - Avg Risk: ${trend.avgRiskScore}, Transactions: ${trend.transactionCount}`);
        });
        
        console.log('\n📊 Trend Summary:');
        console.log(`Total days with data: ${data.dailyRiskTrends.length}`);
        if (data.dailyRiskTrends.length > 0) {
            const avgRisk = data.dailyRiskTrends.reduce((sum, t) => sum + (t.avgRiskScore || 0), 0) / data.dailyRiskTrends.length;
            const totalTransactions = data.dailyRiskTrends.reduce((sum, t) => sum + (t.transactionCount || 0), 0);
            console.log(`Average risk score across all days: ${avgRisk.toFixed(2)}`);
            console.log(`Total transactions in trend period: ${totalTransactions}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testTrendData();
