import { config } from 'dotenv';

config();

async function checkUserData() {
    try {
        console.log('Checking user risk summary data structure...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📊 First user summary structure:');
        const firstUser = data.userRiskSummaries[0];
        console.log('Keys:', Object.keys(firstUser));
        console.log('Full object:', firstUser);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUserData();
