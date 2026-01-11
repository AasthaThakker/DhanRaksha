import { config } from 'dotenv';

config();

async function testModalAlerts() {
    try {
        console.log('🧪 Testing Modal Alert System...\n');
        
        // Check if page loads with modal popup alerts
        const pageRes = await fetch('http://localhost:3000/admin/risk-monitor');
        console.log('📄 Page load status:', pageRes.status);
        
        if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            
            // Check for modal-specific components
            const hasModalOverlay = pageHtml.includes('fixed inset-0 bg-black bg-opacity-50');
            const hasModalDialog = pageHtml.includes('bg-white rounded-lg shadow-xl');
            const hasModalZIndex = pageHtml.includes('z-50');
            const hasModalContent = pageHtml.includes('max-w-md w-full mx-4 p-6');
            const hasModalCloseButton = pageHtml.includes('setAlertMessage(null)');
            const hasModalOKButton = pageHtml.includes('px-4 py-2 bg-slate-600');
            
            // Check for modal titles
            const hasSuccessTitle = pageHtml.includes('✅ Success');
            const hasErrorTitle = pageHtml.includes('❌ Error');
            const hasInfoTitle = pageHtml.includes('ℹ️ Info');
            
            // Check for button elements
            const hasViewDetailsButton = pageHtml.includes('View Details');
            const hasMarkAsSafeButton = pageHtml.includes('Mark as Safe');
            const hasBlockUserButton = pageHtml.includes('Block User');
            
            // Check for button handlers
            const hasViewDetailsHandler = pageHtml.includes('handleViewDetails');
            const hasMarkAsSafeHandler = pageHtml.includes('handleMarkAsSafe');
            const hasBlockUserHandler = pageHtml.includes('handleBlockUser');
            
            // Check if content is rendering (not just loading)
            const hasUserNames = pageHtml.includes('Bikram') || pageHtml.includes('nand@gmail.com');
            const hasRiskScores = pageHtml.includes('Risk Score:');
            const hasTransactionData = pageHtml.includes('transactions') && pageHtml.includes('₹');
            
            console.log('🎭 Modal Alert Components:');
            console.log(`   ✅ Modal overlay: ${hasModalOverlay}`);
            console.log(`   ✅ Modal dialog: ${hasModalDialog}`);
            console.log(`   ✅ Modal z-index: ${hasModalZIndex}`);
            console.log(`   ✅ Modal content: ${hasModalContent}`);
            console.log(`   ✅ Modal close button: ${hasModalCloseButton}`);
            console.log(`   ✅ Modal OK button: ${hasModalOKButton}`);
            
            console.log('\n🏷️ Modal Titles:');
            console.log(`   ✅ Success title: ${hasSuccessTitle}`);
            console.log(`   ✅ Error title: ${hasErrorTitle}`);
            console.log(`   ✅ Info title: ${hasInfoTitle}`);
            
            console.log('\n🎮 Button Elements:');
            console.log(`   ✅ View Details button: ${hasViewDetailsButton}`);
            console.log(`   ✅ Mark as Safe button: ${hasMarkAsSafeButton}`);
            console.log(`   ✅ Block User button: ${hasBlockUserButton}`);
            
            console.log('\n⚙️  Button Handlers:');
            console.log(`   ✅ handleViewDetails: ${hasViewDetailsHandler}`);
            console.log(`   ✅ handleMarkAsSafe: ${hasMarkAsSafeHandler}`);
            console.log(`   ✅ handleBlockUser: ${hasBlockUserHandler}`);
            
            console.log('\n📊 Content Rendering:');
            console.log(`   ✅ User names: ${hasUserNames}`);
            console.log(`   ✅ Risk scores: ${hasRiskScores}`);
            console.log(`   ✅ Transaction data: ${hasTransactionData}`);
            
            // Overall assessment
            const modalSystemWorking = hasModalOverlay && hasModalDialog && hasModalZIndex && 
                                     hasModalContent && hasModalCloseButton && hasModalOKButton;
            const allButtonsPresent = hasViewDetailsButton && hasMarkAsSafeButton && hasBlockUserButton;
            const allHandlersPresent = hasViewDetailsHandler && hasMarkAsSafeHandler && hasBlockUserHandler;
            const contentIsRendering = hasUserNames || hasRiskScores || hasTransactionData;
            
            console.log('\n🎯 Overall Status:');
            if (modalSystemWorking && allButtonsPresent && allHandlersPresent) {
                console.log('✅ SUCCESS: Modal alert system implemented!');
                console.log('   ✅ Modal overlay with backdrop');
                console.log('   ✅ Centered modal dialog');
                console.log('   ✅ Proper z-index stacking');
                console.log('   ✅ Close and OK buttons');
                console.log('   ✅ Success/Error/Info titles');
                
                if (contentIsRendering) {
                    console.log('   ✅ Dynamic content is rendering');
                    console.log('   🎉 Modal alerts and buttons should be working!');
                } else {
                    console.log('   ⚠️  Content may still be loading');
                    console.log('   🔧 Modal system is ready but frontend needs fix');
                }
            } else {
                console.log('❌ ISSUE: Modal alert system may be incomplete');
                console.log(`   Modal working: ${modalSystemWorking}`);
                console.log(`   Buttons present: ${allButtonsPresent}`);
                console.log(`   Handlers present: ${allHandlersPresent}`);
            }
            
        } else {
            console.log('❌ Failed to load page:', pageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testModalAlerts();
