import { config } from 'dotenv';

config();

async function debugApiResponse() {
    try {
        console.log('Debugging API response structure...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('📈 First trend item structure:');
        const firstTrend = data.dailyRiskTrends[0];
        console.log('Keys:', Object.keys(firstTrend));
        console.log('Full object:', firstTrend);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugApiResponse();
