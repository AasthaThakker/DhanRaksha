import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testUSDToINR() {
    try {
        console.log('🧪 Testing USD to INR Conversion...\n');

        // Check important files for USD references
        const files = [
            'app/api/auth/register/route.ts',
            'app/api/admin/users/route.ts', 
            'prisma/schema.prisma',
            'prisma/seed.ts',
            'scripts/generate-test-transactions.ts'
        ];

        let totalUSD = 0;
        let totalINR = 0;

        console.log('🔍 Scanning files for currency references...\n');

        files.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Count USD and INR occurrences
                const usdMatches = content.match(/USD/g) || [];
                const inrMatches = content.match(/INR/g) || [];
                
                totalUSD += usdMatches.length;
                totalINR += inrMatches.length;
                
                console.log(`📄 ${file}:`);
                console.log(`   💵 USD references: ${usdMatches.length}`);
                console.log(`   🇮🇳 INR references: ${inrMatches.length}`);
                
                if (usdMatches.length > 0) {
                    console.log(`   ⚠️  Found USD at positions: ${usdMatches.map((match, index) => {
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
        console.log(`   💵 Total USD references: ${totalUSD}`);
        console.log(`   🇮🇳 Total INR references: ${totalINR}`);

        // Check database schema
        const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
        if (fs.existsSync(schemaPath)) {
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            const hasINRDefault = schemaContent.includes('currency  String   @default("INR")');
            console.log(`   🗄️ Database schema default: ${hasINRDefault ? 'INR' : 'Not INR'}`);
        }

        // Final assessment
        const allGood = totalUSD === 0 && totalINR > 0;
        
        console.log(`\n🎯 Result:`);
        if (allGood) {
            console.log(`   ✅ All USD references converted to INR!`);
            console.log(`   🇮🇳 System now uses ${totalINR} INR references`);
        } else {
            console.log(`   ⚠️  Some USD references still present (${totalUSD})`);
            console.log(`   🇮🇳 Found ${totalINR} INR references`);
        }

        // Check if we need to run database migration
        if (totalUSD > 0) {
            console.log(`\n⚠️  Database migration may be required to update existing records`);
            console.log(`   Run: npx prisma migrate reset && npx prisma db seed`);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testUSDToINR();
