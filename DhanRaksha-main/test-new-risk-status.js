import { config } from 'dotenv';

config();

async function testNewRiskStatus() {
    try {
        console.log('🔄 Testing new risk status logic (70% avg + 30% max)...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📊 Updated Risk Status Analysis:');
        data.userRiskSummaries.forEach((user, index) => {
            const avgRisk = Number(user.avgTransactionRisk) || 0;
            const maxRisk = Number(user.maxTransactionRisk) || 0;
            const weightedRisk = (avgRisk * 0.7) + (maxRisk * 0.3);
            
            let status = 'Low Risk';
            let color = 'green';
            
            if (weightedRisk >= 70) {
                status = 'High Risk';
                color = 'red';
            } else if (weightedRisk >= 40) {
                status = 'Medium Risk';
                color = 'amber';
            }
            
            console.log(`\n${index + 1}. ${user.name}:`);
            console.log(`   Average Risk: ${avgRisk.toFixed(1)}`);
            console.log(`   Max Risk: ${maxRisk.toFixed(1)}`);
            console.log(`   Weighted Risk (70% avg + 30% max): ${weightedRisk.toFixed(1)}`);
            console.log(`   Status: ${status} (${color})`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testNewRiskStatus();
