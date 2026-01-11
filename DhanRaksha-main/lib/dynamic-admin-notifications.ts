import { db } from './db';

export async function createUserNotification(action: 'created' | 'deleted' | 'updated', userEmail: string, userName?: string) {
    const messages = {
        created: `New user ${userName || userEmail} has registered and requires verification`,
        deleted: `User ${userName || userEmail} has been deleted from the system`,
        updated: `User ${userName || userEmail} profile has been updated`
    };

    return await createAdminNotification({
        title: `User ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: messages[action],
        type: 'SYSTEM_ALERT'
    });
}

export async function createBlockUserNotification(userEmail: string, blockedBy?: string) {
    return await createAdminNotification({
        title: 'User Blocked',
        message: `User ${userEmail} has been blocked${blockedBy ? ` by ${blockedBy}` : ''} due to suspicious activity`,
        type: 'USER_FLAGGED'
    });
}

export async function createSuspiciousUserNotification(userEmail: string, riskLevel: string, reason: string) {
    return await createAdminNotification({
        title: 'Suspicious User Activity',
        message: `User ${userEmail} flagged with ${riskLevel} risk level: ${reason}`,
        type: 'USER_FLAGGED'
    });
}

export async function createTransactionNotification(userEmail: string, amount: number, type: string, isSuspicious: boolean = false) {
    const title = isSuspicious ? 'Suspicious Transaction Alert' : 'High Value Transaction';
    const message = `${isSuspicious ? 'Suspicious' : 'High value'} transaction of ₹${amount.toFixed(2)} (${type}) by ${userEmail}${isSuspicious ? ' requires immediate review' : ' requires review'}`;
    
    return await createAdminNotification({
        title,
        message,
        type: isSuspicious ? 'USER_FLAGGED' : 'SYSTEM_ALERT'
    });
}

export async function createSystemNotification(event: string, details: string) {
    return await createAdminNotification({
        title: `System ${event}`,
        message: details,
        type: 'SYSTEM_ALERT'
    });
}

// Helper function to create admin notification
async function createAdminNotification(data: {
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
