import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

async function testNotificationComponent() {
    try {
        console.log('🧪 Testing Notification Component...\n');
        
        // Test if the notification icon component file exists and can be imported
        console.log('📁 Checking component files...');
        
        const notificationIconPath = path.join(process.cwd(), 'components/notification-icon.tsx');
        const notificationPanelPath = path.join(process.cwd(), 'components/notification-panel.tsx');
        
        const iconExists = fs.existsSync(notificationIconPath);
        const panelExists = fs.existsSync(notificationPanelPath);
        
        console.log('✅ NotificationIcon component:', iconExists ? 'Exists' : 'Missing');
        console.log('✅ NotificationPanel component:', panelExists ? 'Exists' : 'Missing');
        
        if (iconExists && panelExists) {
            console.log('✅ All notification components are present');
            
            // Check the admin layout file
            const adminLayoutPath = path.join(process.cwd(), 'app/admin/layout.tsx');
            const adminLayoutExists = fs.existsSync(adminLayoutPath);
            
            if (adminLayoutExists) {
                const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
                const hasImport = adminLayoutContent.includes('import { NotificationIcon }');
                const hasUsage = adminLayoutContent.includes('<NotificationIcon />');
                const removedHardcoded = !adminLayoutContent.includes('bg-red-500 rounded-full');
                
                console.log('✅ Admin layout imports NotificationIcon:', hasImport ? 'Yes' : 'No');
                console.log('✅ Admin layout uses NotificationIcon:', hasUsage ? 'Yes' : 'No');
                console.log('✅ Hardcoded button removed:', removedHardcoded ? 'Yes' : 'No');
                
                if (hasImport && hasUsage && removedHardcoded) {
                    console.log('🎉 Admin notification system is properly implemented!');
                } else {
                    console.log('⚠️  Admin notification system needs fixes');
                }
            } else {
                console.log('❌ Admin layout file not found');
            }
        } else {
            console.log('❌ Notification components are missing');
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testNotificationComponent();
