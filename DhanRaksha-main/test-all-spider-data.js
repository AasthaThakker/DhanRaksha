import { config } from 'dotenv';

config();

async function testAllSpiderData() {
    try {
        console.log('Testing all spider chart data...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log(`🕸️ Found ${data.spiderChartData.length} users with spider data:`);
        
        data.spiderChartData.forEach((user, index) => {
            console.log(`\nUser ${index + 1}: ${user.name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Avg Amount: ₹${user.avgAmount.toLocaleString()}`);
            console.log(`  Max Amount: ₹${user.maxAmount.toLocaleString()}`);
            console.log(`  Risk Score: ${user.riskScore.toFixed(1)}`);
            console.log(`  Transaction Volume: ${user.transactionVolume}`);
            console.log(`  Critical Risk Count: ${user.criticalRiskCount}`);
            console.log(`  High Risk Count: ${user.highRiskCount}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testAllSpiderData();
