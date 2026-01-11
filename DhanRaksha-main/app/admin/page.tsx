"use client"

import { Card } from "@/components/ui/card"
import { Users, AlertTriangle, TrendingUp, CheckCircle, Loader2, Network } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import NetworkMap from "@/components/admin/network-map"

interface Metrics {
  totalUsers: number;
  totalTransactions: number;
  totalTransactionVolume: number;
  highRiskAlerts: number;
  accuracy: number;
  fraudBlocked: number;
}

interface FlaggedSession {
  id: string;
  user: string;
  email: string;
  risk: string;
  reason: string;
  time: string;
}

interface ChartData {
  date: string;
  attempts: number;
}

interface AccuracyData {
  week: string;
  accuracy: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [recentSessions, setRecentSessions] = useState<FlaggedSession[]>([])
  const [fraudData, setFraudData] = useState<ChartData[]>([])
  const [accuracyData, setAccuracyData] = useState<AccuracyData[]>([])
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/metrics')
        if (res.ok) {
          const data = await res.json()
          setMetrics(data.metrics)
          setRecentSessions(data.recentFlaggedSessions)
          setFraudData(data.fraudData || [])
          setAccuracyData(data.accuracyData || [])
        }
      } catch (error) {
        console.error("Failed to fetch admin metrics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  function formatTime(isoString: string) {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minutes ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    return date.toLocaleDateString()
  }

  const handleUnblockUser = async (userEmail: string) => {
    try {
      const confirmed = confirm(`Are you sure you want to unblock user: ${userEmail}?`)
      if (!confirmed) return
      
      const res = await fetch('/api/admin/unblock-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      
      if (res.ok) {
        setAlertMessage({
          type: 'success',
          message: `✅ User ${userEmail} has been unblocked successfully`
        })
        // Refresh metrics to update the list
        const fetchMetrics = async () => {
          try {
            const res = await fetch('/api/admin/metrics')
            if (res.ok) {
              const data = await res.json()
              setMetrics(data.metrics)
              setRecentSessions(data.recentFlaggedSessions)
              setFraudData(data.fraudData || [])
              setAccuracyData(data.accuracyData || [])
            }
          } catch (error) {
            console.error("Failed to fetch admin metrics:", error)
          } finally {
            setLoading(false)
          }
        }
        fetchMetrics()
      } else {
        throw new Error('Failed to unblock user')
      }
    } catch (error) {
      setAlertMessage({
        type: 'error',
        message: `❌ Failed to unblock user ${userEmail}`
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                alertMessage.type === 'success' 
                  ? 'text-green-800' 
                  : alertMessage.type === 'error' 
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {alertMessage.type === 'success' ? '✅ Success' : 
                 alertMessage.type === 'error' ? '❌ Error' : 'ℹ️ Info'}
              </h3>
              <button
                onClick={() => setAlertMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {alertMessage.message}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setAlertMessage(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Admin Overview</h2>
        <p className="text-slate-600 mt-1">Monitor system health and user security metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {metrics?.totalUsers.toLocaleString() ?? '0'}
              </h3>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600">Active participants</p>
        </Card> */}

        {/* <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Flagged Sessions</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {metrics?.highRiskAlerts ?? '0'}
              </h3>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-sm text-slate-600">Requires review</p>
        </Card> */}

        {/* <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Fraud Attempts Blocked</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {metrics?.fraudBlocked ?? '0'}
              </h3>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-slate-600">Based on behavior AI</p>
        </Card> */}

        {/* <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">AI Accuracy</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {metrics?.accuracy ?? '99.3'}%
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-slate-600">Last 30 days</p>
        </Card> */}
      </div>

      {/* Network Map */}
      <NetworkMap />

      {/* User Management - Flagged/Blocked Users */}
      {/* <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
          <p className="text-sm text-slate-600">Manage flagged and blocked users</p>
        </div>
        <div className="space-y-4">
          {recentSessions.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No flagged or blocked users found.</p>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{session.user}</p>
                        <p className="text-sm text-slate-600">Email: {session.email}</p>
                        <p className="text-sm text-slate-600">Reason: {session.reason}</p>
                        <p className="text-xs text-slate-600 mt-1">{formatTime(session.time)}</p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          session.risk === "High" 
                            ? "bg-red-50 text-red-700" 
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {session.risk} Risk
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnblockUser(session.user)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Unblock User
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card> */}

      {/* Charts */}
      <div className="space-y-6">
        {/* Fraud Detection Chart
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Fraud Detection Attempts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fraudData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Bar dataKey="attempts" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card> */}

        {/* AI Accuracy Trend - Full Width */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">AI Model Accuracy Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="times" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[97, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ fill: "#9333ea", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Flagged Sessions */}
      {/* <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Recently Flagged Sessions</h3>
          <Link href="/admin/risk-monitor" className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No recently flagged sessions.</p>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{session.user}</p>
                    <p className="text-sm text-slate-600">Reason: {session.reason}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${session.risk === "High" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}
                    >
                      {session.risk} Risk
                    </span>
                    <p className="text-xs text-slate-600 mt-1">{formatTime(session.time)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card> */}
    </div>
  )
}
