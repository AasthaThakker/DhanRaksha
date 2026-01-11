export async function fetcher(url: string, options?: RequestInit) {
    const res = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for authentication
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })
    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'An error occurred')
    }
    return res.json()
}

export const api = {
    getDashboard: () => fetcher('/api/dashboard'),
    getTransactions: (limit?: number) => fetcher(`/api/transactions?limit=${limit || 50}`),
    verifyTransfer: (data: { recipientEmail: string; amount: number }) =>
        fetcher('/api/transfer/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    transfer: (data: { recipientEmail: string; amount: number; description?: string }) =>
        fetcher('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    getAdminMetrics: () => fetcher('/api/admin/metrics'),
    getUsers: () => fetcher('/api/admin/users'),
    register: (data: any) => fetcher('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    login: (data: any) => fetcher('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }),
    logout: () => fetcher('/api/auth/logout', { method: 'POST' }),
    getSecurityData: () => fetcher('/api/user/security'),
    addFunds: (data: { amount: number; description: string }) =>
        fetcher('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    getAccount: () => fetcher('/api/account'),
    getNotifications: () => fetcher('/api/notifications'),
    markNotificationsRead: (notificationIds: string[]) =>
        fetcher('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds }),
        }),
}
