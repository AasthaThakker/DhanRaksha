import { db } from './db';

export async function createAdminNotification(data: {
    title: string;
    message: string;
    type: 'MONEY_DEDUCTED' | 'PAYMENT_PENDING' | 'TRANSACTION_COMPLETED' | 'USER_FLAGGED' | 'SYSTEM_ALERT';
}) {
    try {
        // Find admin user
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.warn('No admin user found, cannot create notification');
            return null;
        }

        // Create notification for admin
        const notification = await db.notification.create({
            data: {
                ...data,
                userId: adminUser.id,
                updatedAt: new Date()
            }
        });

        console.log(`✅ Admin notification created: ${data.title}`);
        return notification;

    } catch (error) {
        console.error('❌ Error creating admin notification:', error);
        return null;
    }
}

export async function createFlaggedUserNotification(userEmail: string, riskLevel: string) {
    return await createAdminNotification({
        title: 'User Flagged for Review',
        message: `User ${userEmail} has been flagged with ${riskLevel} risk level and requires attention`,
        type: 'USER_FLAGGED'
    });
}

export async function createSystemAlertNotification(message: string) {
    return await createAdminNotification({
        title: 'System Alert',
        message,
        type: 'SYSTEM_ALERT'
    });
}

export async function createTransactionAlertNotification(amount: number, type: string) {
    return await createAdminNotification({
        title: 'High Value Transaction Alert',
        message: `Transaction of ₹${amount.toFixed(2)} (${type}) requires review`,
        type: 'SYSTEM_ALERT'
    });
}
