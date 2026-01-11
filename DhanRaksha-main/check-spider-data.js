import { config } from 'dotenv';

config();

async function checkSpiderData() {
    try {
        console.log('Checking spider chart data structure...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log('🕸️ First spider chart item structure:');
        const firstSpider = data.spiderChartData[0];
        console.log('Keys:', Object.keys(firstSpider));
        console.log('Avg Amount:', firstSpider.avgAmount);
        console.log('Max Amount:', firstSpider.maxAmount);
        console.log('Name:', firstSpider.name);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSpiderData();
