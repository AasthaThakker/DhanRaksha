import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testNetworkMapAccess() {
    try {
        console.log('🔍 Testing Network Map Accessibility...\n');

        // Check if the component file exists and is readable
        const componentPath = path.join(process.cwd(), 'components/admin/network-map.tsx');
        if (fs.existsSync(componentPath)) {
            console.log('✅ Network Map Component: File exists');
            
            try {
                const componentContent = fs.readFileSync(componentPath, 'utf8');
                console.log('✅ Network Map Component: File is readable');
                
                // Check for potential syntax issues
                const hasExportDefault = componentContent.includes('export default function NetworkMap');
                const hasUseClient = componentContent.includes('"use client"');
                const hasImports = componentContent.includes('import');
                const hasReturnStatement = componentContent.includes('return (');
                
                console.log('📋 Component Structure:');
                console.log(`   ✅ Export default: ${hasExportDefault ? 'Present' : 'Missing'}`);
                console.log(`   ✅ Use client: ${hasUseClient ? 'Present' : 'Missing'}`);
                console.log(`   ✅ Imports: ${hasImports ? 'Present' : 'Missing'}`);
                console.log(`   ✅ Return statement: ${hasReturnStatement ? 'Present' : 'Missing'}`);
                
            } catch (readError) {
                console.log('❌ Network Map Component: File read error');
                console.log('   Error:', readError.message);
            }
        } else {
            console.log('❌ Network Map Component: File not found');
        }

        // Check admin page integration
        const adminPagePath = path.join(process.cwd(), 'app/admin/page.tsx');
        if (fs.existsSync(adminPagePath)) {
            const adminContent = fs.readFileSync(adminPagePath, 'utf8');
            
            const hasImport = adminContent.includes('import NetworkMap from "@/components/admin/network-map"');
            const hasUsage = adminContent.includes('<NetworkMap />');
            const hasNetworkMapSection = adminContent.includes('{/* Network Map */}');
            
            console.log('📋 Admin Page Integration:');
            console.log(`   ✅ Import statement: ${hasImport ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Component usage: ${hasUsage ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Section comment: ${hasNetworkMapSection ? 'Present' : 'Missing'}`);
        }

        // Check API endpoint
        const apiPath = path.join(process.cwd(), 'app/api/admin/network-map/route.ts');
        if (fs.existsSync(apiPath)) {
            const apiContent = fs.readFileSync(apiPath, 'utf8');
            
            const hasExport = apiContent.includes('export async function GET');
            const hasAuthCheck = apiContent.includes('getSession');
            const hasDbQueries = apiContent.includes('db.user.findMany');
            const hasResponse = apiContent.includes('NextResponse.json');
            
            console.log('📋 API Endpoint:');
            console.log(`   ✅ GET export: ${hasExport ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Auth check: ${hasAuthCheck ? 'Present' : 'Missing'}`);
            console.log(`   ✅ DB queries: ${hasDbQueries ? 'Present' : 'Missing'}`);
            console.log(`   ✅ Response: ${hasResponse ? 'Present' : 'Missing'}`);
        }

        // Check for potential runtime issues
        console.log('\n🔍 Runtime Issue Check:');
        
        // Check if there are any console.error calls in the component
        if (fs.existsSync(componentPath)) {
            const componentContent = fs.readFileSync(componentPath, 'utf8');
            const hasConsoleErrors = componentContent.includes('console.error');
            const hasTryCatch = componentContent.includes('try {');
            const hasErrorHandling = componentContent.includes('catch (error)');
            
            console.log(`   ✅ Error handling: ${hasTryCatch && hasErrorHandling ? 'Present' : 'Missing'}`);
            console.log(`   ⚠️  Console errors: ${hasConsoleErrors ? 'Found' : 'None'}`);
        }

        console.log('\n🎯 Troubleshooting Steps:');
        console.log('1. Check browser console for JavaScript errors');
        console.log('2. Verify admin authentication is working');
        console.log('3. Check if API endpoint is accessible');
        console.log('4. Verify database connection');
        
        console.log('\n📊 Next Steps:');
        console.log('1. Try accessing the admin dashboard directly');
        console.log('2. Check Network tab in browser dev tools');
        console.log('3. Look for any 404 or 500 errors');
        console.log('4. Verify the component renders without errors');

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testNetworkMapAccess();
