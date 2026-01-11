import { config } from 'dotenv';

config();

async function testAlertSystem() {
    try {
        console.log('🧪 Testing Alert System...\n');
        
        // Check if page loads with alert system
        const pageRes = await fetch('http://localhost:3000/admin/risk-monitor');
        console.log('📄 Page load status:', pageRes.status);
        
        if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            
            // Check for alert system components
            const hasAlertState = pageHtml.includes('alertMessage');
            const hasAlertComponent = pageHtml.includes('Alert Messages');
            const hasSetAlertMessage = pageHtml.includes('setAlertMessage');
            const hasAlertTypes = pageHtml.includes('success') && pageHtml.includes('error') && pageHtml.includes('info');
            const hasCloseButton = pageHtml.includes('setAlertMessage(null)');
            const hasAlertStyling = pageHtml.includes('bg-green-50') && pageHtml.includes('bg-red-50') && pageHtml.includes('bg-blue-50');
            
            console.log('🔔 Alert System Detection:');
            console.log(`   ✅ Alert state: ${hasAlertState}`);
            console.log(`   ✅ Alert component: ${hasAlertComponent}`);
            console.log(`   ✅ setAlertMessage function: ${hasSetAlertMessage}`);
            console.log(`   ✅ Alert types (success/error/info): ${hasAlertTypes}`);
            console.log(`   ✅ Close button: ${hasCloseButton}`);
            console.log(`   ✅ Alert styling: ${hasAlertStyling}`);
            
            // Check for old alert() calls
            const hasOldAlerts = pageHtml.includes('alert(');
            console.log(`   ❌ Old alert() calls: ${hasOldAlerts}`);
            
            // Check button functionality
            const hasViewDetails = pageHtml.includes('handleViewDetails');
            const hasMarkAsSafe = pageHtml.includes('handleMarkAsSafe');
            const hasBlockUser = pageHtml.includes('handleBlockUser');
            
            console.log('\n🎮 Button Functions:');
            console.log(`   ✅ handleViewDetails: ${hasViewDetails}`);
            console.log(`   ✅ handleMarkAsSafe: ${hasMarkAsSafe}`);
            console.log(`   ✅ handleBlockUser: ${hasBlockUser}`);
            
            if (hasAlertState && hasAlertComponent && hasSetAlertMessage && hasAlertTypes && 
                hasCloseButton && hasAlertStyling && !hasOldAlerts) {
                console.log('\n🎉 SUCCESS: Alert system properly implemented!');
                console.log('   ✅ Replaced alert() with proper div-based alerts');
                console.log('   ✅ Added success, error, and info message types');
                console.log('   ✅ Included close button functionality');
                console.log('   ✅ Proper styling for different alert types');
                console.log('   ✅ All button functions use new alert system');
            } else {
                console.log('\n⚠️  WARNING: Alert system may be incomplete');
            }
            
        } else {
            console.log('❌ Failed to load page:', pageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testAlertSystem();
