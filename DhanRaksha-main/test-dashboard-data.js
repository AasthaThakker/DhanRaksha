import { config } from 'dotenv';

config();

async function testDashboardData() {
    try {
        console.log('🧪 Testing Dashboard Data...\n');
        
        // Test the metrics API directly
        const metricsRes = await fetch('http://localhost:3000/api/admin/metrics');
        console.log('📊 Metrics API status:', metricsRes.status);
        
        if (metricsRes.ok) {
            const data = await metricsRes.json();
            console.log('✅ Metrics data received:', {
                totalUsers: data.metrics?.totalUsers || 0,
                recentFlaggedSessions: data.recentFlaggedSessions?.length || 0,
                highRiskAlerts: data.metrics?.highRiskAlerts || 0
            });
            
            // Check if there are any flagged sessions
            if (data.recentFlaggedSessions && data.recentFlaggedSessions.length > 0) {
                console.log('✅ Found flagged sessions:');
                data.recentFlaggedSessions.forEach((session, index) => {
                    console.log(`   ${index + 1}. User: ${session.user || session.email}, Risk: ${session.risk}, Reason: ${session.reason}`);
                });
            } else {
                console.log('⚠️  No flagged sessions found in database');
            }
            
        } else {
            console.log('❌ Failed to fetch metrics:', metricsRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testDashboardData();
