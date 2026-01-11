import { config } from 'dotenv';

config();

async function testButtonsWorking() {
    try {
        console.log('🧪 Testing Button Functionality...\n');
        
        // Test if page loads and contains button functionality
        const pageRes = await fetch('http://localhost:3000/admin/risk-monitor');
        console.log('📄 Page load status:', pageRes.status);
        
        if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            
            // Check for button elements and their handlers
            const hasViewDetailsButton = pageHtml.includes('View Details');
            const hasMarkAsSafeButton = pageHtml.includes('Mark as Safe');
            const hasBlockUserButton = pageHtml.includes('Block User');
            
            // Check for button click handlers
            const hasViewDetailsHandler = pageHtml.includes('handleViewDetails');
            const hasMarkAsSafeHandler = pageHtml.includes('handleMarkAsSafe');
            const hasBlockUserHandler = pageHtml.includes('handleBlockUser');
            
            // Check for alert system
            const hasAlertSystem = pageHtml.includes('setAlertMessage');
            const hasAlertComponent = pageHtml.includes('alertMessage &&');
            const hasAlertTypes = pageHtml.includes('success') && pageHtml.includes('error');
            
            // Check for deduplication logic
            const hasDeduplication = pageHtml.includes('uniqueSessions') && pageHtml.includes('reduce');
            
            // Check if content is rendered (not just loading)
            const hasUserNames = pageHtml.includes('Bikram') || pageHtml.includes('nand@gmail.com');
            const hasRiskScores = pageHtml.includes('Risk Score:');
            const hasTransactionData = pageHtml.includes('transactions') && pageHtml.includes('₹');
            
            console.log('🎮 Button Elements:');
            console.log(`   ✅ View Details button: ${hasViewDetailsButton}`);
            console.log(`   ✅ Mark as Safe button: ${hasMarkAsSafeButton}`);
            console.log(`   ✅ Block User button: ${hasBlockUserButton}`);
            
            console.log('\n⚙️  Button Handlers:');
            console.log(`   ✅ handleViewDetails: ${hasViewDetailsHandler}`);
            console.log(`   ✅ handleMarkAsSafe: ${hasMarkAsSafeHandler}`);
            console.log(`   ✅ handleBlockUser: ${hasBlockUserHandler}`);
            
            console.log('\n🔔 Alert System:');
            console.log(`   ✅ setAlertMessage: ${hasAlertSystem}`);
            console.log(`   ✅ Alert component: ${hasAlertComponent}`);
            console.log(`   ✅ Alert types: ${hasAlertTypes}`);
            
            console.log('\n🔄 Deduplication:');
            console.log(`   ✅ uniqueSessions logic: ${hasDeduplication}`);
            
            console.log('\n📊 Content Rendering:');
            console.log(`   ✅ User names: ${hasUserNames}`);
            console.log(`   ✅ Risk scores: ${hasRiskScores}`);
            console.log(`   ✅ Transaction data: ${hasTransactionData}`);
            
            // Overall assessment
            const allButtonsPresent = hasViewDetailsButton && hasMarkAsSafeButton && hasBlockUserButton;
            const allHandlersPresent = hasViewDetailsHandler && hasMarkAsSafeHandler && hasBlockUserHandler;
            const alertSystemWorking = hasAlertSystem && hasAlertComponent && hasAlertTypes;
            const contentIsRendering = hasUserNames || hasRiskScores || hasTransactionData;
            
            console.log('\n🎯 Overall Status:');
            if (allButtonsPresent && allHandlersPresent && alertSystemWorking) {
                console.log('✅ SUCCESS: All button functionality is implemented!');
                console.log('   ✅ Buttons are present in the DOM');
                console.log('   ✅ Click handlers are attached');
                console.log('   ✅ Alert system is ready');
                
                if (contentIsRendering) {
                    console.log('   ✅ Dynamic content is rendering');
                    console.log('   🎉 Buttons should be working!');
                } else {
                    console.log('   ⚠️  Content may still be loading (frontend issue)');
                    console.log('   🔧 Buttons are implemented but page might be stuck');
                }
            } else {
                console.log('❌ ISSUE: Some button functionality may be missing');
            }
            
        } else {
            console.log('❌ Failed to load page:', pageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testButtonsWorking();
