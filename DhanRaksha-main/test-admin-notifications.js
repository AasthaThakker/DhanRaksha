import { config } from 'dotenv';

config();

async function testAdminNotifications() {
    try {
        console.log('🧪 Testing Admin Notifications...\n');
        
        // Test the notifications API directly
        const notificationsRes = await fetch('http://localhost:3000/api/notifications');
        console.log('📊 Notifications API status:', notificationsRes.status);
        
        if (notificationsRes.ok) {
            const data = await notificationsRes.json();
            console.log('✅ Notifications data received:', {
                totalNotifications: data.notifications?.length || 0,
                unreadCount: data.unreadCount || 0
            });
            
            // Check if there are any notifications
            if (data.notifications && data.notifications.length > 0) {
                console.log('✅ Found notifications:');
                data.notifications.forEach((notif, index) => {
                    console.log(`   ${index + 1}. ${notif.title}: ${notif.message} (${notif.isRead ? 'read' : 'unread'})`);
                });
            } else {
                console.log('⚠️  No notifications found');
            }
            
        } else {
            console.log('❌ Failed to fetch notifications:', notificationsRes.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testAdminNotifications();
