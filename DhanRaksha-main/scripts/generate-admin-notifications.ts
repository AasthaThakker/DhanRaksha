import { db } from '../lib/db';

async function generateAdminNotifications() {
    try {
        console.log('🔧 Generating admin notifications...');

        // Find admin user
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.log('❌ No admin user found. Creating one...');
            
            // Create admin user if not exists
            const newAdmin = await db.user.create({
                data: {
                    email: 'admin@dhanraksha.com',
                    name: 'Admin User',
                    password: '$2b$10$example.hash.here', // This should be properly hashed
                    role: 'ADMIN',
                    receiveAnomalyProtection: true,
                    avgReceiveAmount7d: 0
                }
            });
            console.log('✅ Admin user created:', newAdmin.email);
        } else {
            console.log('✅ Admin user found:', adminUser.email);
        }

        // Get the admin user (either existing or newly created)
        const admin = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            throw new Error('Failed to find or create admin user');
        }

        // Create admin notifications
        const notifications = [
            {
                title: 'New User Registration',
                message: 'A new user has registered and requires verification',
                type: 'SYSTEM_ALERT' as const,
                userId: admin.id
            },
            {
                title: 'High Risk Activity Detected',
                message: 'Multiple users flagged for suspicious transactions',
                type: 'USER_FLAGGED' as const,
                userId: admin.id
            },
            {
                title: 'System Update',
                message: 'Fraud detection algorithms updated successfully',
                type: 'SYSTEM_ALERT' as const,
                userId: admin.id
            },
            {
                title: 'Security Alert',
                message: 'Unusual login patterns detected from multiple IPs',
                type: 'SYSTEM_ALERT' as const,
                userId: admin.id
            }
        ];

        // Clear existing admin notifications
        await db.notification.deleteMany({
            where: { userId: admin.id }
        });

        // Create new notifications
        for (const notif of notifications) {
            await db.notification.create({
                data: {
                    ...notif,
                    updatedAt: new Date()
                }
            });
        }

        console.log(`✅ Created ${notifications.length} admin notifications`);

        // Verify notifications were created
        const createdNotifications = await db.notification.findMany({
            where: { userId: admin.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`📊 Total notifications for admin: ${createdNotifications.length}`);
        createdNotifications.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
        });

    } catch (error) {
        console.error('❌ Error generating admin notifications:', error);
    } finally {
        await db.$disconnect();
    }
}

generateAdminNotifications();
