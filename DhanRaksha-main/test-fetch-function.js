import { config } from 'dotenv';

config();

// Test the exact fetch function from frontend
async function testFetchFunction() {
    try {
        console.log('🧪 Testing Frontend Fetch Function Logic...\n');
        
        const params = new URLSearchParams({
            risk: 'all',
            search: ''
        });
        
        console.log('📡 Fetching:', `/api/test-risk-monitor?${params.toString()}`);
        
        const res = await fetch(`http://localhost:3000/api/test-risk-monitor?${params.toString()}`);
        console.log('📡 Response status:', res.status);
        console.log('📡 Response ok:', res.ok);
        
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Data received:');
            console.log(`   Sessions: ${data.sessions?.length || 0}`);
            console.log(`   Risk Trends: ${data.dailyRiskTrends?.length || 0}`);
            console.log(`   User Summaries: ${data.userRiskSummaries?.length || 0}`);
            console.log(`   Spider Chart Data: ${data.spiderChartData?.length || 0}`);
            console.log(`   Summary total: ${data.summary?.total || 0}`);
            
            // Simulate the state setting
            console.log('\n🔄 Simulating state updates:');
            console.log('   setSessions(data.sessions || [])');
            console.log('   setRiskTrends(data.dailyRiskTrends || [])');
            console.log('   setUserRiskSummaries(data.userRiskSummaries || [])');
            console.log('   setSpiderChartData(data.spiderChartData || [])');
            console.log('   setSummary(data.summary || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 })');
            console.log('   setLoading(false)');
            
            // Check if data is valid
            const hasValidData = data.sessions && data.sessions.length > 0 && 
                               data.userRiskSummaries && data.userRiskSummaries.length > 0 &&
                               data.spiderChartData && data.spiderChartData.length > 0;
            
            console.log(`\n🎯 Data Validation: ${hasValidData}`);
            
            if (hasValidData) {
                console.log('✅ SUCCESS: All data is valid and should render correctly');
            } else {
                console.log('⚠️  WARNING: Data may be incomplete or empty');
            }
            
        } else {
            console.log('❌ Fetch failed - Response not ok');
        }
        
    } catch (error) {
        console.error('❌ Fetch function error:', error);
    }
}

testFetchFunction();
