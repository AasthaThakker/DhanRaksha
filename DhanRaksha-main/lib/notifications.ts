import { db } from './db'

export async function createNotification(
    userId: string,
    type: 'MONEY_DEDUCTED' | 'PAYMENT_PENDING' | 'TRANSACTION_COMPLETED' | 'USER_FLAGGED' | 'SYSTEM_ALERT',
    title: string,
    message: string,
    transactionId?: string
) {
    try {
        const notification = await db.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                transactionId,
                updatedAt: new Date()
            }
        })
        return notification
    } catch (error) {
        console.error('Error creating notification:', error)
        throw error
    }
}

export async function createTransactionNotification(
    userId: string,
    transactionType: string,
    amount: number,
    description: string,
    transactionId: string,
    status: string = 'COMPLETED',
    riskReasons?: string[]
) {
    if (transactionType === 'TRANSFER' && status === 'COMPLETED') {
        await createNotification(
            userId,
            'MONEY_DEDUCTED',
            'Money Deducted',
            `₹${amount.toFixed(2)} has been deducted from your account for: ${description}`,
            transactionId
        )
    } else if (status === 'PENDING') {
        const pendingMessage = riskReasons && riskReasons.length > 0
            ? `Your payment of ₹${amount.toFixed(2)} for: ${description} is pending because: ${riskReasons.join(', ')}`
            : `Your payment of ₹${amount.toFixed(2)} for: ${description} is pending`;
        
        await createNotification(
            userId,
            'PAYMENT_PENDING',
            'Payment Pending',
            pendingMessage,
            transactionId
        )
    } else if (status === 'FAILED') {
        const failedMessage = riskReasons && riskReasons.length > 0
            ? `Your payment of ₹${amount.toFixed(2)} for: ${description} failed because: ${riskReasons.join(', ')}`
            : `Your payment of ₹${amount.toFixed(2)} for: ${description} failed`;
        
        await createNotification(
            userId,
            'PAYMENT_PENDING',
            'Payment Failed',
            failedMessage,
            transactionId
        )
    } else if (status === 'COMPLETED') {
        await createNotification(
            userId,
            'TRANSACTION_COMPLETED',
            'Transaction Completed',
            `Your transaction of ₹${amount.toFixed(2)} for: ${description} has been completed`,
            transactionId
        )
    }
}

export async function createUserFlaggedNotification(
    userId: string,
    riskLevel: string
) {
    await createNotification(
        userId,
        'USER_FLAGGED',
        'Account Flagged',
        `Your account has been flagged due to unusual activity. Risk level: ${riskLevel}. Please contact support if needed.`
    )
}

export async function clearUserNotifications(userId: string) {
    try {
        const deleted = await db.notification.deleteMany({
            where: { userId }
        })
        return deleted.count
    } catch (error) {
        console.error('Error clearing notifications:', error)
        throw error
    }
}
