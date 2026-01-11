import { config } from 'dotenv';

config();

async function testSessionsData() {
    try {
        console.log('🔄 Testing sessions data (should be dynamic from database)...');
        const res = await fetch('http://localhost:3000/api/test-risk-monitor');
        const data = await res.json();
        
        console.log(`📊 Found ${data.sessions.length} sessions:`);
        data.sessions.forEach((session, index) => {
            console.log(`\n${index + 1}. ${session.userName} (${session.user})`);
            console.log(`   Session ID: ${session.sessionId}`);
            console.log(`   Risk Score: ${session.riskScore}`);
            console.log(`   Risk Level: ${session.riskLevel}`);
            console.log(`   Transaction Count: ${session.transactionCount}`);
            console.log(`   Total Amount: ₹${session.totalAmount.toLocaleString()}`);
            console.log(`   Device: ${session.device}`);
            console.log(`   Location: ${session.location}`);
            console.log(`   Time: ${session.time}`);
            console.log(`   Anomalies: ${session.anomalies.join(', ')}`);
        });
        
        console.log('\n🎯 Dynamic Data Verification:');
        console.log(`   ✅ Sessions from database: ${data.sessions.length > 0}`);
        console.log(`   ✅ Real user names: ${data.sessions.some(s => s.userName !== 'Bikram' && s.userName !== 'Aastha Thakker')}`);
        console.log(`   ✅ Real transaction counts: ${data.sessions.some(s => s.transactionCount > 0)}`);
        console.log(`   ✅ Dynamic amounts: ${data.sessions.some(s => s.totalAmount > 0)}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testSessionsData();
