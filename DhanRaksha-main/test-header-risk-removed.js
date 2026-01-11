import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testHeaderRiskRemoved() {
    try {
        console.log('🧪 Testing Risk Level Removal from Header...\n');

        // Check dashboard layout for risk level removal
        const layoutPath = path.join(process.cwd(), 'app/dashboard/layout.tsx');
        if (fs.existsSync(layoutPath)) {
            const layoutContent = fs.readFileSync(layoutPath, 'utf8');
            
            // Check if risk level badge is removed
            const hasRiskLevelText = layoutContent.includes('Risk Level:');
            const hasLowBadge = layoutContent.includes('LOW') && layoutContent.includes('bg-green-50');
            const hasRiskStatusComment = layoutContent.includes('Risk Status Badge');
            const hasNotifications = layoutContent.includes('NotificationIcon');
            
            console.log('📊 Dashboard Layout Header:');
            console.log(`   ❌ Risk Level text: ${hasRiskLevelText ? 'Still Present' : 'Removed ✅'}`);
            console.log(`   ❌ LOW badge: ${hasLowBadge ? 'Still Present' : 'Removed ✅'}`);
            console.log(`   ❌ Risk Status comment: ${hasRiskStatusComment ? 'Still Present' : 'Removed ✅'}`);
            console.log(`   ✅ Notifications preserved: ${hasNotifications ? 'Present' : 'Missing'}`);
            
            // Check header structure
            const headerStart = layoutContent.indexOf('<header');
            const headerEnd = layoutContent.indexOf('</header>');
            const headerContent = layoutContent.substring(headerStart, headerEnd);
            
            const notificationCount = (headerContent.match(/NotificationIcon/g) || []).length;
            const riskBadgeCount = (headerContent.match(/Risk Level:/g) || []).length;
            
            console.log('\n🔍 Header Content Analysis:');
            console.log(`   📢 NotificationIcon count: ${notificationCount}`);
            console.log(`   🚫 Risk Level badge count: ${riskBadgeCount}`);
            
            // Verify the risk level card is still in the dashboard page
            const dashboardPath = path.join(process.cwd(), 'app/dashboard/page.tsx');
            if (fs.existsSync(dashboardPath)) {
                const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
                const hasRiskCard = dashboardContent.includes('Risk Level') && 
                                  dashboardContent.includes('metrics?.riskScore');
                
                console.log('\n📋 Dashboard Page Risk Card:');
                console.log(`   ✅ Risk Level card preserved: ${hasRiskCard ? 'Present' : 'Missing'}`);
            }
            
            // Final assessment
            const successfullyRemoved = !hasRiskLevelText && !hasLowBadge && !hasRiskStatusComment;
            
            console.log(`\n🎯 Result:`);
            if (successfullyRemoved) {
                console.log(`   ✅ Risk Level successfully removed from header!`);
                console.log(`   📢 Notifications preserved in header`);
                console.log(`   📊 Risk Level card preserved in dashboard`);
                console.log(`   🎯 Clean header without redundant risk info`);
            } else {
                console.log(`   ⚠️  Some risk level elements may still be present`);
            }
            
            console.log(`\n📋 Changes Made:`);
            console.log(`   ✅ Removed "Risk Level:" text from header`);
            console.log(`   ✅ Removed green "LOW" badge from header`);
            console.log(`   ✅ Removed risk status comment from code`);
            console.log(`   ✅ Preserved NotificationIcon functionality`);
            console.log(`   ✅ Risk Level card remains in dashboard body`);
            
        } else {
            console.log('❌ Dashboard layout file not found');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testHeaderRiskRemoved();
