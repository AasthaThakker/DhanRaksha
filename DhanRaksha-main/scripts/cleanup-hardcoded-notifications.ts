import { db } from '../lib/db';

async function cleanupHardcodedNotifications() {
    try {
        console.log('🧹 Cleaning up hardcoded admin notifications...\n');

        // Find admin user
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.log('❌ No admin user found');
            return;
        }

        // Get all current notifications
        const allNotifications = await db.notification.findMany({
            where: { userId: adminUser.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Found ${allNotifications.length} total notifications`);

        // Identify hardcoded notifications (old generic ones)
        const hardcodedPatterns = [
            'New User Registration',
            'High Risk Activity Detected', 
            'System Update',
            'Security Alert'
        ];

        const hardcodedNotifications = allNotifications.filter(notif => 
            hardcodedPatterns.some(pattern => notif.title.includes(pattern))
        );

        console.log(`🎯 Found ${hardcodedNotifications.length} hardcoded notifications to remove`);

        // Remove hardcoded notifications
        if (hardcodedNotifications.length > 0) {
            await db.notification.deleteMany({
                where: {
                    id: { in: hardcodedNotifications.map(n => n.id) }
                }
            });
            console.log(`✅ Removed ${hardcodedNotifications.length} hardcoded notifications`);
        }

        // Show remaining dynamic notifications
        const remainingNotifications = await db.notification.findMany({
            where: { userId: adminUser.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log(`\n📋 Remaining ${remainingNotifications.length} dynamic notifications:`);
        remainingNotifications.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
        });

        console.log('\n🎉 Cleanup completed! Only dynamic notifications remain.');

    } catch (error) {
        console.error('❌ Error cleaning up notifications:', error);
    } finally {
        await db.$disconnect();
    }
}

cleanupHardcodedNotifications();
