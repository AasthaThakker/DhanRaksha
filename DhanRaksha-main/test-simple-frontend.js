import { config } from 'dotenv';

config();

async function testSimpleFrontend() {
    try {
        console.log('🧪 Simple Frontend Test...\n');
        
        // Check if page loads without JavaScript errors
        const pageRes = await fetch('http://localhost:3000/admin/risk-monitor');
        console.log('📄 Page status:', pageRes.status);
        
        if (pageRes.ok) {
            const pageHtml = await pageRes.text();
            
            // Look for basic indicators that page rendered
            const hasLoadingText = pageHtml.includes('Loading') || pageHtml.includes('loading');
            const hasErrorText = pageHtml.includes('Error') || pageHtml.includes('error');
            const hasRiskMonitorText = pageHtml.includes('Risk Monitor') || pageHtml.includes('Flagged Sessions');
            const hasAnyDynamicContent = pageHtml.includes('Bikram') || pageHtml.includes('nand@gmail.com');
            
            console.log('🔍 Page Content Analysis:');
            console.log(`   Loading states: ${hasLoadingText}`);
            console.log(`   Error states: ${hasErrorText}`);
            console.log(`   Risk Monitor content: ${hasRiskMonitorText}`);
            console.log(`   Any dynamic content: ${hasAnyDynamicContent}`);
            
            if (hasLoadingText && !hasAnyDynamicContent) {
                console.log('\n❌ ISSUE: Page stuck in loading state');
                console.log('   The frontend is not progressing past loading state');
                console.log('   This suggests a JavaScript error in the component');
            } else if (hasErrorText) {
                console.log('\n❌ ISSUE: Page showing error state');
            } else if (!hasRiskMonitorText) {
                console.log('\n❌ ISSUE: Risk Monitor content not rendering');
            } else {
                console.log('\n✅ Page appears to be rendering content');
            }
            
            // Check for React component structure
            const hasReactComponent = pageHtml.includes('export default function') || pageHtml.includes('useState');
            const hasJSX = pageHtml.includes('className=') || pageHtml.includes('<div');
            
            console.log('\n🏗️  Component Structure:');
            console.log(`   React component: ${hasReactComponent}`);
            console.log(`   JSX rendering: ${hasJSX}`);
            
        } else {
            console.log('❌ Failed to load page:', pageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testSimpleFrontend();
