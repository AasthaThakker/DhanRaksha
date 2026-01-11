import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all users with their accounts and transaction statistics
        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                Account: {
                    select: {
                        balance: true,
                        currency: true
                    }
                }
            },
            where: {
                Account: {
                    some: {}
                }
            }
        })

        // Get transactions with fraud detection focus - prioritize high-risk transactions
        const transactions = await db.transaction.findMany({
            select: {
                id: true,
                amount: true,
                type: true,
                status: true,
                description: true,
                date: true,
                riskScore: true,
                userId: true,
                User: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { riskScore: 'desc' }, // Prioritize high-risk transactions
                { date: 'desc' }
            ]
            // Focus on transactions that could be fraud attempts
        })

        // Get known transaction patterns for each user
        const knownPatterns = await getUserKnownPatterns(users.map(u => u.id))

        // Create enhanced network nodes
        const nodes = users.map(user => {
            const userTransactions = transactions.filter(t => t.userId === user.id)
            const patterns = knownPatterns.get(user.id) || { knownRecipients: [], knownAmounts: [], avgAmount: 0 }
            
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                balance: user.Account[0]?.balance || 0,
                currency: user.Account[0]?.currency || 'INR',
                joinDate: user.createdAt.toISOString(),
                transactionCount: userTransactions.length,
                totalSent: userTransactions.filter(t => t.type === 'TRANSFER').reduce((sum, t) => sum + t.amount, 0),
                totalReceived: userTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
                avgRiskScore: userTransactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / userTransactions.length,
                highRiskTransactions: userTransactions.filter(t => (t.riskScore || 0) > 70).length,
                knownRecipients: patterns.knownRecipients,
                knownAmounts: patterns.knownAmounts,
                avgTransactionAmount: patterns.avgAmount,
                lastTransactionDate: userTransactions[0]?.date.toISOString() || null
            }
        })

        // Create enhanced links with transaction patterns
        const links = []
        const transactionMap = new Map()

        transactions.forEach(transaction => {
            const senderId = transaction.userId
            // Extract receiver from description for TRANSFER transactions
            // For INCOME transactions, we need to find the sender from description
            let receiverId = null
            
            if (transaction.type === 'TRANSFER') {
                receiverId = extractReceiverFromDescription(transaction.description, users)
            } else if (transaction.type === 'EXPENSE') {
                // For EXPENSE transactions, try to extract recipient from description
                const recipientName = extractReceiverFromDescription(transaction.description, users)
                if (recipientName) {
                    const recipientUser = users.find(u => 
                        u.name.toLowerCase().includes(recipientName.toLowerCase()) ||
                        recipientName.toLowerCase().includes(u.name.toLowerCase())
                    )
                    if (recipientUser) {
                        // Create link from current user to recipient
                        const receiverIdForExpense = recipientUser.id
                        const senderIdForExpense = transaction.userId // Current user is sender
                        
                        if (receiverIdForExpense && receiverIdForExpense !== senderIdForExpense) {
                            const linkKey = [senderIdForExpense, receiverIdForExpense].sort().join('-')
                            
                            if (!transactionMap.has(linkKey)) {
                                transactionMap.set(linkKey, {
                                    source: senderIdForExpense,
                                    target: receiverIdForExpense,
                                    count: 0,
                                    totalAmount: 0,
                                    avgAmount: 0,
                                    riskScores: [],
                                    transactions: [],
                                    frequency: 'low',
                                    isKnownPattern: false,
                                    lastTransaction: null,
                                    senderName: null,
                                    receiverName: null
                                })
                            }
                            
                            const link = transactionMap.get(linkKey)
                            if (link) {
                                link.count++
                                link.totalAmount += transaction.amount
                                link.riskScores.push(transaction.riskScore || 0)
                                
                                // Get sender and receiver names
                                const senderNode = nodes.find(n => n.id === senderIdForExpense)
                                const receiverNode = nodes.find(n => n.id === receiverIdForExpense)
                                
                                link.transactions.push({
                                    id: transaction.id,
                                    amount: transaction.amount,
                                    type: transaction.type,
                                    status: transaction.status,
                                    description: transaction.description,
                                    date: transaction.date.toISOString(),
                                    riskScore: transaction.riskScore || 0,
                                    senderName: transaction.User?.name || senderNode?.name || 'Unknown',
                                    senderEmail: transaction.User?.email || senderNode?.email || 'unknown@example.com',
                                    receiverName: recipientUser?.name || 'Unknown',
                                    receiverEmail: recipientUser?.email || 'unknown@example.com'
                                })
                                
                                // Store names for the link
                                if (!link.senderName) link.senderName = link.transactions[0].senderName
                                if (!link.receiverName) link.receiverName = link.transactions[0].receiverName

                                // Update last transaction
                                if (!link.lastTransaction || transaction.date > new Date(link.lastTransaction)) {
                                    link.lastTransaction = transaction.date.toISOString()
                                }

                                // Update node statistics
                                if (senderNode) {
                                    senderNode.transactionCount++
                                    senderNode.totalSent += transaction.amount
                                }
                                
                                if (receiverNode) {
                                    receiverNode.transactionCount++
                                    receiverNode.totalReceived += transaction.amount
                                }
                            }
                        }
                    }
                }
                // Skip to outer logic for EXPENSE transactions
                return
            }

            if (receiverId && receiverId !== senderId) {
                const linkKey = [senderId, receiverId].sort().join('-')
                
                if (!transactionMap.has(linkKey)) {
                    transactionMap.set(linkKey, {
                        source: senderId,
                        target: receiverId,
                        count: 0,
                        totalAmount: 0,
                        avgAmount: 0,
                        riskScores: [],
                        transactions: [],
                        frequency: 'low', // Will be calculated
                        isKnownPattern: false, // Will be calculated
                        lastTransaction: null,
                        senderName: null,
                        receiverName: null
                    })
                }

                const link = transactionMap.get(linkKey)
                link.count++
                link.totalAmount += transaction.amount
                link.riskScores.push(transaction.riskScore || 0)
                
                // Get sender and receiver names
                const senderNode = nodes.find(n => n.id === senderId)
                const receiverNode = nodes.find(n => n.id === receiverId)
                
                link.transactions.push({
                    id: transaction.id,
                    amount: transaction.amount,
                    type: transaction.type,
                    status: transaction.status,
                    description: transaction.description,
                    date: transaction.date.toISOString(),
                    riskScore: transaction.riskScore || 0,
                    senderName: transaction.User?.name || senderNode?.name || 'Unknown',
                    senderEmail: transaction.User?.email || senderNode?.email || 'unknown@example.com',
                    receiverName: receiverNode?.name || 'Unknown',
                    receiverEmail: receiverNode?.email || 'unknown@example.com'
                })
                
                // Store names for the link
                if (!link.senderName) link.senderName = link.transactions[0].senderName
                if (!link.receiverName) link.receiverName = link.transactions[0].receiverName

                // Update last transaction
                if (!link.lastTransaction || transaction.date > new Date(link.lastTransaction)) {
                    link.lastTransaction = transaction.date.toISOString()
                }

                // Update node statistics
                if (senderNode && transaction.type === 'TRANSFER') {
                    senderNode.transactionCount++
                    senderNode.totalSent += transaction.amount
                }
                
                if (receiverNode && (transaction.type === 'EXPENSE' as any || transaction.type === 'TRANSFER' as any)) {
                    receiverNode.transactionCount++
                    receiverNode.totalReceived += transaction.amount
                }
            }
        })

        // Enhance links with calculated metrics
        transactionMap.forEach(link => {
            link.avgAmount = link.totalAmount / link.count
            link.avgRiskScore = link.riskScores.reduce((sum, score) => sum + score, 0) / link.riskScores.length
            
            // Determine frequency based on transaction count and time span
            if (link.count >= 10) link.frequency = 'high'
            else if (link.count >= 5) link.frequency = 'medium'
            
            // Check if this is a known pattern between these users
            const senderPatterns = knownPatterns.get(link.source)
            const receiverPatterns = knownPatterns.get(link.target)
            
            if (senderPatterns?.knownRecipients.includes(link.target) || 
                receiverPatterns?.knownRecipients.includes(link.source)) {
                link.isKnownPattern = true
            }
        })

        // Convert Map to array and sort
        const linksArray = Array.from(transactionMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)

        // Filter for fraud detection attempts - focus on suspicious transactions
        const fraudAttempts = transactions.filter(t => (t.riskScore || 0) > 40) // Medium to high risk
        const highRiskFraudAttempts = transactions.filter(t => (t.riskScore || 0) > 70) // High risk
        
        return NextResponse.json({
            success: true,
            data: {
                nodes: nodes.sort((a, b) => b.highRiskTransactions - a.highRiskTransactions), // Prioritize high-risk users
                links: linksArray,
                summary: {
                    totalNodes: nodes.length,
                    totalLinks: linksArray.length,
                    totalTransactions: transactions.length,
                    fraudDetectionAttempts: fraudAttempts.length,
                    highRiskFraudAttempts: highRiskFraudAttempts.length,
                    avgRiskScore: transactions.reduce((sum, t) => sum + (t.riskScore || 0), 0) / transactions.length,
                    knownPatterns: Array.from(knownPatterns.values()).reduce((sum, patterns) => sum + patterns.knownRecipients.length, 0),
                    lastUpdated: new Date().toISOString()
                }
            }
        })

    } catch (error) {
        console.error('Network map API error:', error)
        return NextResponse.json({ error: 'Failed to fetch network map data' }, { status: 500 })
    }
}

// Get known transaction patterns for each user
async function getUserKnownPatterns(userIds: string[]) {
    const patterns = new Map()
    
    for (const userId of userIds) {
        // Get user's transaction history
        const userTransactions = await db.transaction.findMany({
            where: { userId },
            select: { amount: true, description: true, type: true, date: true },
            orderBy: { date: 'desc' },
            take: 50
        })

        // Extract known recipients from transfer descriptions
        const knownRecipients = []
        const knownAmounts = []
        let totalAmount = 0

        userTransactions.forEach(transaction => {
            if (transaction.type === 'TRANSFER') {
                const receiver = extractReceiverFromDescription(transaction.description, [])
                if (receiver) {
                    knownRecipients.push(receiver)
                }
            }
            
            knownAmounts.push(transaction.amount)
            totalAmount += transaction.amount
        })

        // Get most common amounts (round to nearest 1000 for grouping)
        const amountFrequency = new Map()
        knownAmounts.forEach(amount => {
            const roundedAmount = Math.round(amount / 1000) * 1000
            amountFrequency.set(roundedAmount, (amountFrequency.get(roundedAmount) || 0) + 1)
        })

        const commonAmounts = Array.from(amountFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([amount]) => amount)

        patterns.set(userId, {
            knownRecipients: [...new Set(knownRecipients)], // Remove duplicates
            knownAmounts: commonAmounts,
            avgAmount: totalAmount / userTransactions.length || 0
        })
    }

    return patterns
}

// Helper function to extract sender from INCOME transaction description
function extractSenderFromIncomeDescription(description: string): string | null {
    // Try patterns for sender extraction from income descriptions
    const patterns = [
        /^Received from (.+?):/,
        /^From (.+?):/,
        /from (.+?):/,
        /^(.+?) ->/, // Pattern: "John Doe -> $500"
        /^(.+?)\s*\(/, // Pattern: "John Doe (email@domain.com): $500"
    ]

    for (const pattern of patterns) {
        const match = description.match(pattern)
        if (match) {
            let senderName = match[1].trim()
            
            // Clean up the name
            senderName = senderName.replace(/^["']|["']$/g, '') // Remove quotes
            senderName = senderName.replace(/\s+/g, ' ') // Normalize spaces
            
            return senderName
        }
    }
    
    return null
}

// Helper function to extract receiver from transaction description
function extractReceiverFromDescription(description: string, users: any[]): string | null {
    // Try multiple patterns for receiver extraction
    const patterns = [
        /^Transfer to (.+?):/,
        /^Received from (.+?):/,
        /to (.+?):/,
        /from (.+?):/,
        /^(.+?) ->/, // Pattern: "John Doe -> $500"
        /-> (.+?):/, // Pattern: "-> John Doe: $500"
        /^(.+?)\s*\(/, // Pattern: "John Doe (email@domain.com): $500"
    ]

    for (const pattern of patterns) {
        const match = description.match(pattern)
        if (match) {
            let receiverName = match[1].trim()
            
            // Clean up the name - remove extra characters and normalize
            receiverName = receiverName.replace(/^['"]|['"]$/g, '') // Remove quotes
            receiverName = receiverName.replace(/\s+/g, ' ') // Normalize spaces
            
            // If users array is provided, try to find exact match
            if (users.length > 0) {
                const receiver = users.find(user => {
                    const userName = user.name.toLowerCase()
                    const receiverNameLower = receiverName.toLowerCase()
                    
                    // Exact match
                    if (userName === receiverNameLower) return true
                    
                    // Partial match (name contains or is contained in receiver name)
                    if (userName.includes(receiverNameLower) || receiverNameLower.includes(userName)) return true
                    
                    // Check if it's an email match
                    if (user.email.toLowerCase() === receiverNameLower) return true
                    
                    return false
                })
                
                if (receiver) return receiver.id
            }
            
            // Return the cleaned name as fallback (will be matched later)
            return receiverName
        }
    }
    
    return null
}
