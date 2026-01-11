"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Monitor, Smartphone, Globe, Clock, Shield } from 'lucide-react'
import { api } from '@/lib/api'

interface TransactionWithMetadata {
  id: string
  name: string
  amount: string
  rawAmount: number
  type: string
  status: string
  date: string
  deviceMetadata?: {
    userAgent?: string
    browser?: string
    os?: string
    platform?: string
    deviceType?: string
    ip?: string
    country?: string
    timestamp: string
  }
}

export function BehaviorLogs() {
  const [transactions, setTransactions] = useState<TransactionWithMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBehaviorLogs()
  }, [])

  const fetchBehaviorLogs = async () => {
    try {
      setLoading(true)
      const data = await api.getTransactions(5)
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching behavior logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-blue-600" />
      case 'Tablet':
        return <Monitor className="w-4 h-4 text-purple-600" />
      default:
        return <Monitor className="w-4 h-4 text-slate-600" />
    }
  }

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Behaviour & Logs
          </h3>
          <div className="text-xs text-slate-500 bg-blue-50 px-2 py-1 rounded-full">
            Last 5 Transactions
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading behavior logs...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Monitor className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No transaction data available</p>
            <p className="text-sm text-slate-400 mt-2">Transaction metadata will appear here once you make transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="p-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
              >
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className={`text-sm font-bold ${
                        transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{transaction.name}</p>
                      <p className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Session Metadata Section */}
                {transaction.deviceMetadata && (
                  <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-slate-800">
                        Session Metadata (Non-Persistent)
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Device Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(transaction.deviceMetadata.deviceType)}
                          <span className="font-medium text-slate-700">
                            {transaction.deviceMetadata.deviceType || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium">Browser:</span> {transaction.deviceMetadata.browser || 'Unknown'}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium">Platform:</span> {transaction.deviceMetadata.platform || 'Unknown'}
                        </div>
                      </div>

                      {/* Network Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-blue-500" />
                          <span className="font-medium text-slate-700">Network</span>
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium">IP:</span> {transaction.deviceMetadata.ip || 'Unknown'}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium">Country:</span> {transaction.deviceMetadata.country || 'Unknown'}
                        </div>
                        <div className="text-slate-600">
                          <span className="font-medium">Time:</span> {new Date(transaction.deviceMetadata.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <div className="flex items-start gap-2">
                        <Shield className="w-3 h-3 text-green-600 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                          This metadata is collected <strong>ephemerally</strong> for behavioral analysis only. 
                          Used solely for real-time security monitoring and user awareness.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
