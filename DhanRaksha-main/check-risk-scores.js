import { config } from 'dotenv';

config();

async function checkRiskScores() {
    try {
        console.log('Checking risk scores for all users...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📊 Risk Score Analysis:');
        data.userRiskSummaries.forEach((user, index) => {
            const avgRisk = Number(user.avgTransactionRisk) || 0;
            const maxRisk = Number(user.maxTransactionRisk) || 0;
            
            let status = 'Low Risk';
            let color = 'green';
            
            if (avgRisk >= 70) {
                status = 'High Risk';
                color = 'red';
            } else if (avgRisk >= 40) {
                status = 'Medium Risk';
                color = 'amber';
            }
            
            console.log(`\n${index + 1}. ${user.name}:`);
            console.log(`   Average Risk: ${avgRisk.toFixed(1)} → ${status} (${color})`);
            console.log(`   Max Risk: ${maxRisk.toFixed(1)}`);
            console.log(`   Transaction Count: ${user.transactionCount}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkRiskScores();
