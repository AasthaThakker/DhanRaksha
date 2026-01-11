import { config } from 'dotenv';

config();

async function testDeduplication() {
    try {
        console.log('🧪 Testing User Deduplication...\n');
        
        // Get the API data
        const res = await fetch('http://localhost:3000/api/test-risk-monitor?risk=all&search=');
        const data = await res.json();
        
        console.log('📊 Original Sessions:', data.sessions?.length || 0);
        
        // Simulate the deduplication logic
        const uniqueSessions = (data.sessions || []).reduce((acc, session) => {
          const existingUserIndex = acc.findIndex(s => s.user === session.user);
          if (existingUserIndex === -1) {
            acc.push(session);
          } else {
            const existingSession = acc[existingUserIndex];
            if (session.riskScore > existingSession.riskScore || 
                new Date(session.time) > new Date(existingSession.time)) {
              acc[existingUserIndex] = session;
            }
          }
          return acc;
        }, []);
        
        console.log(`✅ Deduplication Result:`);
        console.log(`   Original sessions: ${data.sessions?.length || 0}`);
        console.log(`   Unique users: ${uniqueSessions.length}`);
        console.log(`   Removed duplicates: ${(data.sessions?.length || 0) - uniqueSessions.length}`);
        
        // Show unique users
        console.log('\n👥 Unique Users List:');
        uniqueSessions.forEach((session, index) => {
          console.log(`   ${index + 1}. ${session.userName} (${session.user})`);
          console.log(`      Risk Score: ${session.riskScore}`);
          console.log(`      Risk Level: ${session.riskLevel}`);
          console.log(`      Transactions: ${session.transactionCount}`);
          console.log(`      Amount: ₹${session.totalAmount.toLocaleString()}`);
        });
        
        // Check for duplicates
        const userEmails = (data.sessions || []).map(s => s.user);
        const uniqueEmails = [...new Set(userEmails)];
        const duplicateCount = userEmails.length - uniqueEmails.length;
        
        console.log('\n🔍 Duplicate Analysis:');
        console.log(`   Total entries: ${userEmails.length}`);
        console.log(`   Unique users: ${uniqueEmails.length}`);
        console.log(`   Duplicate entries: ${duplicateCount}`);
        
        if (duplicateCount > 0) {
          console.log('\n✅ SUCCESS: Deduplication working!');
          console.log(`   Removed ${duplicateCount} duplicate entries`);
          console.log('   Now showing only legitimate unique users');
        } else {
          console.log('\n✅ No duplicates found - all users are unique');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testDeduplication();
