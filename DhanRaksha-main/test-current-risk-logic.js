import { config } from 'dotenv';

config();

async function testCurrentRiskLogic() {
    try {
        console.log('🔄 Testing current risk status logic (user modified)...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📊 Current Risk Status Analysis:');
        console.log('   Logic: If maxRisk >= 70 → High Risk (Red)');
        console.log('   Logic: Else if weightedRisk >= 40 → Medium Risk (Amber)');  
        console.log('   Logic: Else → Low Risk (Green)\n');
        
        data.userRiskSummaries.forEach((user, index) => {
            const avgRisk = Number(user.avgTransactionRisk) || 0;
            const maxRisk = Number(user.maxTransactionRisk) || 0;
            const weightedRisk = (avgRisk * 0.7) + (maxRisk * 0.3);
            
            let status = 'Low Risk';
            let color = 'green';
            
            if (maxRisk >= 70) {
                status = 'High Risk';
                color = 'red';
            } else if (weightedRisk >= 40) {
                status = 'Medium Risk';
                color = 'amber';
            }
            
            console.log(`${index + 1}. ${user.name}:`);
            console.log(`   Avg: ${avgRisk.toFixed(1)} | Max: ${maxRisk.toFixed(1)} | Weighted: ${weightedRisk.toFixed(1)}`);
            console.log(`   Status: ${status} (${color})`);
            console.log(`   Max >= 70? ${maxRisk >= 70} | Weighted >= 40? ${weightedRisk >= 40}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testCurrentRiskLogic();
