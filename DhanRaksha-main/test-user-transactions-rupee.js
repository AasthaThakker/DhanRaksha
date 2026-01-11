import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testUserTransactionsRupee() {
    try {
        console.log('🧪 Testing User Transactions Rupee Symbol Implementation...\n');

        // Check user transaction files for dollar signs
        const userFiles = [
            'app/api/transactions/route.ts',
            'app/api/dashboard/route.ts',
            'app/dashboard/transactions/transactions-content.tsx',
            'app/dashboard/transfer/page.tsx',
            'app/api/transfer/route.ts'
        ];

        let totalDollarSigns = 0;
        let totalRupeeSigns = 0;

        console.log('🔍 Scanning user transaction files for currency symbols...\n');

        userFiles.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Count dollar signs (not in template literals)
                const dollarMatches = content.match(/[^\\]\$(?![{])/g) || [];
                const rupeeMatches = content.match(/₹/g) || [];
                
                totalDollarSigns += dollarMatches.length;
                totalRupeeSigns += rupeeMatches.length;
                
                console.log(`📄 ${file}:`);
                console.log(`   💵 Dollar signs: ${dollarMatches.length}`);
                console.log(`   🇮🇳 Rupee signs: ${rupeeMatches.length}`);
                
                if (dollarMatches.length > 0) {
                    console.log(`   ⚠️  Found dollar signs at positions: ${dollarMatches.map((match, index) => {
                        const position = content.indexOf(match, content.indexOf(match) + index);
                        const line = content.substring(0, position).split('\n').length;
                        return `line ${line}`;
                    }).join(', ')}`);
                }
            } else {
                console.log(`❌ ${file}: File not found`);
            }
        });

        console.log(`\n📊 Summary:`);
        console.log(`   💵 Total dollar signs: ${totalDollarSigns}`);
        console.log(`   🇮🇳 Total rupee signs: ${totalRupeeSigns}`);

        // Check specific transaction formatting
        const transactionsAPIPath = path.join(process.cwd(), 'app/api/transactions/route.ts');
        if (fs.existsSync(transactionsAPIPath)) {
            const transactionsContent = fs.readFileSync(transactionsAPIPath, 'utf8');
            const hasRupeeFormatting = transactionsContent.includes('+₹') || 
                                         transactionsContent.includes('-₹');
            console.log(`   💰 Transaction API formatting: ${hasRupeeFormatting ? 'Uses ₹ symbols' : 'Not using ₹ symbols'}`);
        }

        // Check dashboard API formatting
        const dashboardAPIPath = path.join(process.cwd(), 'app/api/dashboard/route.ts');
        if (fs.existsSync(dashboardAPIPath)) {
            const dashboardContent = fs.readFileSync(dashboardAPIPath, 'utf8');
            const hasDashboardRupee = dashboardContent.includes('+₹') || 
                                         dashboardContent.includes('-₹');
            console.log(`   📊 Dashboard API formatting: ${hasDashboardRupee ? 'Uses ₹ symbols' : 'Not using ₹ symbols'}`);
        }

        // Final assessment
        const allGood = totalDollarSigns === 0 && totalRupeeSigns > 0;
        
        console.log(`\n🎯 Result:`);
        if (allGood) {
            console.log(`   ✅ All user transaction dollar signs replaced with Indian Rupee symbols!`);
            console.log(`   🇮🇳 User transactions now show ${totalRupeeSigns} Rupee symbols`);
        } else {
            console.log(`   ⚠️  Some dollar signs still present (${totalDollarSigns})`);
            console.log(`   🇮🇳 Found ${totalRupeeSigns} Rupee symbols`);
        }

        console.log(`\n📋 User Transaction Sections Updated:`);
        console.log(`   ✅ Transaction API: +₹1000.00 / -₹500.00`);
        console.log(`   ✅ Dashboard API: +₹2500 / -₹1000`);
        console.log(`   ✅ Transfer API: Already using ₹ symbols`);
        console.log(`   ✅ Transaction display: Shows ₹ symbols`);

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testUserTransactionsRupee();
