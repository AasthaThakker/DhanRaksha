import { config } from 'dotenv';

config();

async function testAdminNotificationUI() {
    try {
        console.log('🧪 Testing Admin Notification UI...\n');
        
        // Test if the admin layout page loads
        const adminPageRes = await fetch('http://localhost:3000/admin');
        console.log('📄 Admin page status:', adminPageRes.status);
        
        if (adminPageRes.ok) {
            const html = await adminPageRes.text();
            
            // Check if NotificationIcon component is present
            const hasNotificationIcon = html.includes('NotificationIcon') || 
                                       html.includes('notification-icon') ||
                                       html.includes('data-testid="notification-icon"');
            
            console.log('✅ NotificationIcon component:', hasNotificationIcon ? 'Present' : 'Missing');
            
            // Check for hardcoded notification button (should be gone)
            const hasHardcodedButton = html.includes('bg-red-500 rounded-full');
            console.log('❌ Hardcoded notification button:', hasHardcodedButton ? 'Still present' : 'Removed');
            
            // Check for proper notification structure
            const hasBellIcon = html.includes('<Bell') || html.includes('Bell className');
            console.log('🔔 Bell icon:', hasBellIcon ? 'Present' : 'Missing');
            
            if (hasNotificationIcon && !hasHardcodedButton && hasBellIcon) {
                console.log('✅ Admin notification UI is properly implemented!');
            } else {
                console.log('⚠️  Admin notification UI needs attention');
            }
        } else {
            console.log('❌ Failed to load admin page:', adminPageRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testAdminNotificationUI();
