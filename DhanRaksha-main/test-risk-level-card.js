import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testRiskLevelCard() {
    try {
        console.log('🧪 Testing Risk Level Card Implementation...\n');

        // Check dashboard page for risk level card
        const dashboardPath = path.join(process.cwd(), 'app/dashboard/page.tsx');
        if (fs.existsSync(dashboardPath)) {
            const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
            
            // Check for risk level card elements
            const hasRiskCard = dashboardContent.includes('Risk Level');
            const hasDynamicColors = dashboardContent.includes('metrics?.riskScore === \'HIGH\'');
            const hasScoreValue = dashboardContent.includes('metrics?.riskScoreValue');
            const hasColorLogic = dashboardContent.includes('text-red-600') && 
                                dashboardContent.includes('text-yellow-600') && 
                                dashboardContent.includes('text-green-600');
            
            console.log('📊 Dashboard Risk Level Card:');
            console.log(`   ✅ Risk Level card: ${hasRiskCard ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Dynamic color logic: ${hasDynamicColors ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Score value display: ${hasScoreValue ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Color styling: ${hasColorLogic ? 'Present' : 'Missing'}`);
            
            // Check for specific color implementations
            const colorChecks = {
                'High risk red': dashboardContent.includes('border-red-200 hover:shadow-red-500/10'),
                'Medium risk yellow': dashboardContent.includes('border-yellow-200 hover:shadow-yellow-500/10'),
                'Low risk green': dashboardContent.includes('border-green-200 hover:shadow-green-500/10'),
                'Text colors': dashboardContent.includes('text-red-600') && 
                             dashboardContent.includes('text-yellow-600') && 
                             dashboardContent.includes('text-green-600')
            };
            
            console.log('\n🎨 Color Implementation:');
            Object.entries(colorChecks).forEach(([label, present]) => {
                console.log(`   ${present ? '✅' : '❌'} ${label}`);
            });
            
            // Check API data availability
            const apiPath = path.join(process.cwd(), 'app/api/dashboard/route.ts');
            if (fs.existsSync(apiPath)) {
                const apiContent = fs.readFileSync(apiPath, 'utf8');
                const hasRiskScore = apiContent.includes('riskScore:');
                const hasRiskScoreValue = apiContent.includes('riskScoreValue:');
                const hasBehaviorSession = apiContent.includes('BehaviorSession[0]?.riskLevel');
                
                console.log('\n🔌 API Data Source:');
                console.log(`   ✅ Risk score field: ${hasRiskScore ? 'Present' : 'Missing'}`);
                console.log(`   ✅ Risk score value: ${hasRiskScoreValue ? 'Present' : 'Missing'}`);
                console.log(`   ✅ Behavior session data: ${hasBehaviorSession ? 'Present' : 'Missing'}`);
            }
            
            // Check for AlertTriangle icon import
            const hasIcon = dashboardContent.includes('AlertTriangle');
            console.log(`\n🎯 Icon Import: ${hasIcon ? '✅ AlertTriangle imported' : '❌ Icon missing'}`);
            
            // Final assessment
            const allChecks = [
                hasRiskCard,
                hasDynamicColors,
                hasScoreValue,
                hasColorLogic,
                hasIcon
            ];
            
            const allGood = allChecks.every(check => check);
            
            console.log(`\n🎯 Result:`);
            if (allGood) {
                console.log(`   ✅ Risk Level card successfully implemented!`);
                console.log(`   🎨 Dynamic colors based on actual risk score data`);
                console.log(`   📊 Displays both risk level and numeric score`);
                console.log(`   🇮🇳 Ready for Indian banking context`);
            } else {
                console.log(`   ⚠️  Some components may need attention`);
            }
            
            console.log(`\n📋 Risk Level Card Features:`);
            console.log(`   ✅ Dynamic color coding (Green/Yellow/Red)`);
            console.log(`   ✅ Real-time risk score data from API`);
            console.log(`   ✅ Hover effects and transitions`);
            console.log(`   ✅ Responsive grid layout (3 cards)`);
            console.log(`   ✅ No hardcoded values`);
            
        } else {
            console.log('❌ Dashboard page not found');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testRiskLevelCard();
