"use client"

import { Card } from "@/components/ui/card"
import { Users, AlertTriangle, TrendingUp, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Admin Overview</h2>
        <p className="text-slate-600 mt-1">Monitor system health and user security metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
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
        </Card>

        <Card className="p-6">
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
        </Card>

        <Card className="p-6">
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
        </Card>

        <Card className="p-6">
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
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fraud Detection Chart */}
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
        </Card>

        {/* AI Accuracy Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">AI Model Accuracy Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#94a3b8" />
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
      <Card className="p-6">
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
      </Card>
    </div>
  )
}
