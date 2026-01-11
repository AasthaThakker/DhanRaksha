import { createUserNotification, createSuspiciousUserNotification, createBlockUserNotification, createTransactionNotification } from '../lib/dynamic-admin-notifications';
import { db } from '../lib/db';

async function testDynamicNotifications() {
    try {
        console.log('🧪 Testing Dynamic Admin Notifications...\n');

        // Test 1: User creation notification
        console.log('📝 Testing user creation notification...');
        await createUserNotification('created', 'testuser@example.com', 'Test User');
        
        // Test 2: User update notification  
        console.log('📝 Testing user update notification...');
        await createUserNotification('updated', 'testuser@example.com', 'Test User');
        
        // Test 3: Suspicious user notification
        console.log('📝 Testing suspicious user notification...');
        await createSuspiciousUserNotification('suspicious@example.com', 'HIGH', 'Multiple failed login attempts');
        
        // Test 4: Block user notification
        console.log('📝 Testing block user notification...');
        await createBlockUserNotification('blocked@example.com', 'Admin');
        
        // Test 5: Transaction notification
        console.log('📝 Testing transaction notification...');
        await createTransactionNotification('transaction@example.com', 50000, 'TRANSFER', true);
        
        // Test 6: High value transaction (non-suspicious)
        console.log('📝 Testing high value transaction notification...');
        await createTransactionNotification('vip@example.com', 100000, 'INCOME', false);

        // Verify notifications were created
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (adminUser) {
            const notifications = await db.notification.findMany({
                where: { userId: adminUser.id },
                orderBy: { createdAt: 'desc' },
                take: 10
            });

            console.log(`\n✅ Created ${notifications.length} admin notifications:`);
            notifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
            });
        }

        console.log('\n🎉 Dynamic notification system test completed!');

    } catch (error) {
        console.error('❌ Error testing dynamic notifications:', error);
    } finally {
        await db.$disconnect();
    }
}

testDynamicNotifications();
