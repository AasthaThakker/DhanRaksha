import { config } from 'dotenv';

config();

async function debugFrontendRendering() {
    try {
        console.log('🔍 Debugging Frontend Rendering Issue...\n');
        
        // Check if page loads at all
        const pageRes = await fetch('http://localhost:3000/admin/risk-monitor');
        console.log('📄 Page load status:', pageRes.status);
        
        if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            
            // Check for dynamic data indicators
            const hasDynamicData = 
                pageHtml.includes('₹57,471.98') ||  // Nand's avg amount
                pageHtml.includes('₹1,094.896') ||  // John Doe's avg amount  
                pageHtml.includes('Bikram') ||        // Real user names
                pageHtml.includes('nand@gmail.com') ||   // Real emails
                pageHtml.includes('HIGH') ||          // Real risk levels
                pageHtml.includes('50 sessions');      // Real session counts
            
            console.log('🔍 Dynamic Data Detection:');
            console.log(`   ✅ Nand's amount found: ${pageHtml.includes('₹57,471.98')}`);
            console.log(`   ✅ John Doe's amount found: ${pageHtml.includes('₹1,094.896')}`);
            console.log(`   ✅ Real user names found: ${pageHtml.includes('Bikram')}`);
            console.log(`   ✅ Real emails found: ${pageHtml.includes('nand@gmail.com')}`);
            console.log(`   ✅ Real risk levels found: ${pageHtml.includes('HIGH')}`);
            console.log(`   ✅ Session counts found: ${pageHtml.includes('50 sessions')}`);
            console.log(`   🎯 Overall Dynamic Data: ${hasDynamicData}`);
            
            // Look for common frontend issues
            const hasLoadingState = pageHtml.includes('Loading') || pageHtml.includes('loading');
            const hasErrorState = pageHtml.includes('Error') || pageHtml.includes('error') || pageHtml.includes('failed');
            const hasNoData = pageHtml.includes('No data found') || pageHtml.includes('No sessions found');
            
            console.log('\n🐛 Frontend Issue Detection:');
            console.log(`   Loading states: ${hasLoadingState}`);
            console.log(`   Error states: ${hasErrorState}`);
            console.log(`   No data messages: ${hasNoData}`);
            
            if (!hasDynamicData) {
                console.log('\n❌ ISSUE: Dynamic data not rendering in frontend!');
                console.log('   The page might be showing cached or fallback data');
            } else if (hasLoadingState || hasErrorState || hasNoData) {
                console.log('\n⚠️  WARNING: Frontend showing loading/error/no-data states');
            } else {
                console.log('\n✅ SUCCESS: Frontend appears to be rendering dynamic data correctly');
            }
            
        } else {
            console.log('❌ Failed to load risk monitor page:', pageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    }
}

debugFrontendRendering();
