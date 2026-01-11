import { config } from 'dotenv';

config();

async function testFrontendFetch() {
    try {
        console.log('🔄 Testing frontend data fetch...');
        
        // Test the exact same fetch as frontend
        const params = new URLSearchParams({
            risk: 'all',
            search: ''
        });
        
        console.log('📡 Fetching from:', `/api/test-risk-monitor?${params.toString()}`);
        
        const res = await fetch(`http://localhost:3000/api/test-risk-monitor?${params.toString()}`);
        console.log('📡 Response status:', res.status);
        
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Frontend fetch successful!');
            console.log(`📊 Sessions: ${data.sessions?.length || 0}`);
            console.log(`📈 Risk Trends: ${data.dailyRiskTrends?.length || 0}`);
            console.log(`👥 User Summaries: ${data.userRiskSummaries?.length || 0}`);
            console.log(`🕸️ Spider Chart Data: ${data.spiderChartData?.length || 0}`);
            console.log(`📋 Summary: ${data.summary?.total || 0} total sessions`);
            
            // Test sample data
            if (data.sessions && data.sessions.length > 0) {
                const firstSession = data.sessions[0];
                console.log('\n💼 Sample Session Data:');
                console.log(`   User: ${firstSession.userName} (${firstSession.user})`);
                console.log(`   Risk Score: ${firstSession.riskScore}`);
                console.log(`   Risk Level: ${firstSession.riskLevel}`);
                console.log(`   Transactions: ${firstSession.transactionCount}`);
                console.log(`   Amount: ₹${firstSession.totalAmount?.toLocaleString()}`);
            }
            
        } else {
            console.log('❌ Frontend fetch failed with status:', res.status);
        }
        
    } catch (error) {
        console.error('❌ Frontend fetch error:', error);
    }
}

testFrontendFetch();
