"use client"

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle, Shield, Clock, Users, TrendingUp, Eye, Ban, Activity } from "lucide-react"

interface FraudAttempt {
    id: string
    amount: number
    type: string
    status: string
    description: string
    date: string
    riskScore: number
    senderName: string
    senderEmail: string
    receiverName: string
    receiverEmail: string
    riskReasons?: string[]
}

interface FraudStats {
    totalAttempts: number
    highRiskAttempts: number
    blockedAttempts: number
    uniqueUsers: number
    avgRiskScore: number
    totalAmount: number
}

export default function FraudDetectionAttempts() {
    const [fraudAttempts, setFraudAttempts] = useState<FraudAttempt[]>([])
    const [stats, setStats] = useState<FraudStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedAttempt, setSelectedAttempt] = useState<FraudAttempt | null>(null)

    useEffect(() => {
        fetchFraudData()
    }, [])

    const fetchFraudData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/network-map')
            if (res.ok) {
                const networkData = await res.json()
                
                // Extract fraud attempts from network data
                const allTransactions: any[] = []
                networkData.data?.links?.forEach((link: any) => {
                    link.transactions?.forEach((transaction: any) => {
                        allTransactions.push({
                            ...transaction,
                            linkAvgRiskScore: link.avgRiskScore,
                            linkCount: link.count,
                            isKnownPattern: link.isKnownPattern
                        })
                    })
                })

                // Filter for high-risk transactions (potential fraud attempts)
                const fraudAttempts = allTransactions.filter((transaction: any) => {
                    return transaction.riskScore > 50 || // High individual risk
                           transaction.linkAvgRiskScore > 60 || // High link risk
                           transaction.amount > 50000 || // High value transactions
                           !transaction.isKnownPattern // Unknown patterns
                }).sort((a, b) => b.riskScore - a.riskScore)

                // Calculate statistics
                const fraudStats: FraudStats = {
                    totalAttempts: fraudAttempts.length,
                    highRiskAttempts: fraudAttempts.filter(t => t.riskScore > 70).length,
                    blockedAttempts: fraudAttempts.filter(t => t.status === 'BLOCKED' || t.status === 'FAILED').length,
                    uniqueUsers: new Set(fraudAttempts.map(t => t.senderEmail)).size,
                    avgRiskScore: fraudAttempts.reduce((sum, t) => sum + t.riskScore, 0) / fraudAttempts.length || 0,
                    totalAmount: fraudAttempts.reduce((sum, t) => sum + t.amount, 0)
                }

                setFraudAttempts(fraudAttempts)
                setStats(fraudStats)
            } else {
                console.error('Failed to fetch fraud detection data')
            }
        } catch (error) {
            console.error('Fraud detection fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const getRiskLevel = (score: number) => {
        if (score > 70) return { level: 'Critical', color: 'text-red-600 bg-red-50', icon: AlertTriangle }
        if (score > 50) return { level: 'High', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle }
        if (score > 30) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50', icon: Eye }
        return { level: 'Low', color: 'text-green-600 bg-green-50', icon: Shield }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'BLOCKED': return 'text-red-600 bg-red-50'
            case 'FAILED': return 'text-orange-600 bg-orange-50'
            case 'COMPLETED': return 'text-green-600 bg-green-50'
            case 'PENDING': return 'text-blue-600 bg-blue-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-slate-600">Loading fraud detection attempts...</span>
                    <span className="text-sm text-slate-500">Analyzing transaction patterns</span>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Fraud Detection Attempts</h1>
                <p className="text-slate-600">Monitor and analyze suspicious transaction activities</p>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total Attempts</p>
                                <p className="text-xl font-bold text-slate-900">{stats.totalAttempts}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">High Risk</p>
                                <p className="text-xl font-bold text-slate-900">{stats.highRiskAttempts}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Ban className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Blocked</p>
                                <p className="text-xl font-bold text-slate-900">{stats.blockedAttempts}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Unique Users</p>
                                <p className="text-xl font-bold text-slate-900">{stats.uniqueUsers}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Avg Risk Score</p>
                                <p className="text-xl font-bold text-slate-900">{stats.avgRiskScore.toFixed(1)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Activity className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total Amount</p>
                                <p className="text-xl font-bold text-slate-900">₹{stats.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Fraud Attempts Table */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Suspicious Transactions</h2>
                
                {fraudAttempts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>No suspicious transactions detected</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Risk Level</th>
                                    <th className="text-left py-3 px-4">Date & Time</th>
                                    <th className="text-left py-3 px-4">Sender</th>
                                    <th className="text-left py-3 px-4">Receiver</th>
                                    <th className="text-left py-3 px-4">Amount</th>
                                    <th className="text-left py-3 px-4">Risk Score</th>
                                    <th className="text-left py-3 px-4">Status</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fraudAttempts.map((attempt) => {
                                    const riskInfo = getRiskLevel(attempt.riskScore)
                                    const RiskIcon = riskInfo.icon
                                    
                                    return (
                                        <tr key={attempt.id} className="border-b hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${riskInfo.color}`}>
                                                    <RiskIcon className="w-3 h-3" />
                                                    {riskInfo.level}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    <span>{new Date(attempt.date).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{attempt.senderName}</p>
                                                    <p className="text-xs text-slate-500">{attempt.senderEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{attempt.receiverName}</p>
                                                    <p className="text-xs text-slate-500">{attempt.receiverEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-medium">₹{attempt.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        attempt.riskScore > 70 ? 'bg-red-500' :
                                                        attempt.riskScore > 50 ? 'bg-orange-500' :
                                                        attempt.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                    <span className="font-medium">{attempt.riskScore}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                                                    {attempt.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => setSelectedAttempt(attempt)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Selected Attempt Details */}
            {selectedAttempt && (
                <Card className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Transaction Details</h3>
                        <button
                            onClick={() => setSelectedAttempt(null)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Transaction ID</label>
                                <p className="text-slate-900">{selectedAttempt.id}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Date & Time</label>
                                <p className="text-slate-900">{new Date(selectedAttempt.date).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Amount</label>
                                <p className="text-lg font-bold text-slate-900">₹{selectedAttempt.amount.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Risk Score</label>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                        selectedAttempt.riskScore > 70 ? 'bg-red-500' :
                                        selectedAttempt.riskScore > 50 ? 'bg-orange-500' :
                                        selectedAttempt.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></div>
                                    <span className="font-medium">{selectedAttempt.riskScore}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevel(selectedAttempt.riskScore).color}`}>
                                        {getRiskLevel(selectedAttempt.riskScore).level}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Sender</label>
                                <div className="bg-slate-50 p-3 rounded">
                                    <p className="font-medium">{selectedAttempt.senderName}</p>
                                    <p className="text-sm text-slate-600">{selectedAttempt.senderEmail}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Receiver</label>
                                <div className="bg-slate-50 p-3 rounded">
                                    <p className="font-medium">{selectedAttempt.receiverName}</p>
                                    <p className="text-sm text-slate-600">{selectedAttempt.receiverEmail}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAttempt.status)}`}>
                                    {selectedAttempt.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <label className="text-sm font-medium text-slate-700">Description</label>
                        <p className="text-slate-900 bg-slate-50 p-3 rounded">{selectedAttempt.description}</p>
                    </div>
                </Card>
            )}
        </div>
    )
}
