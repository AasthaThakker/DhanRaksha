import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testRupeeSymbols() {
    try {
        console.log('🧪 Testing Indian Rupee Symbol Implementation...\n');

        // Check admin files for dollar signs
        const adminFiles = [
            'app/admin/page.tsx',
            'app/admin/users/page.tsx', 
            'app/admin/risk-monitor/risk-monitor-content.tsx',
            'app/admin/layout.tsx'
        ];

        let totalDollarSigns = 0;
        let totalRupeeSigns = 0;

        console.log('🔍 Scanning admin files for currency symbols...\n');

        adminFiles.forEach(file => {
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

        // Check if DollarSign icon is still imported
        const usersPagePath = path.join(process.cwd(), 'app/admin/users/page.tsx');
        if (fs.existsSync(usersPagePath)) {
            const usersContent = fs.readFileSync(usersPagePath, 'utf8');
            const hasDollarSignImport = usersContent.includes('DollarSign');
            const hasWalletImport = usersContent.includes('Wallet');
            
            console.log(`\n🎨 Icon imports:`);
            console.log(`   ❌ DollarSign import: ${hasDollarSignImport ? 'Still present' : 'Removed'}`);
            console.log(`   ✅ Wallet import: ${hasWalletImport ? 'Present' : 'Missing'}`);
        }

        // Final assessment
        const allGood = totalDollarSigns === 0 && totalRupeeSigns > 0;
        
        console.log(`\n🎯 Result:`);
        if (allGood) {
            console.log(`   ✅ All dollar signs replaced with Indian Rupee symbols!`);
            console.log(`   🇮🇳 Admin panel now shows ₹${totalRupeeSigns} Rupee symbols`);
        } else {
            console.log(`   ⚠️  Some dollar signs still present (${totalDollarSigns})`);
            console.log(`   🇮🇳 Found ${totalRupeeSigns} Rupee symbols`);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testRupeeSymbols();
