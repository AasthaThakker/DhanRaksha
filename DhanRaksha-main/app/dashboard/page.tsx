"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Shield, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.getDashboard()
      setData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Error loading dashboard: {error}</p>
        <Button onClick={fetchData} className="mt-4" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  // Fallback if data is missing
  const { user, account, metrics, recentTransactions, spendingData, activityData } = data || {}

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Welcome, {user?.name || 'User'}</h2>
        {/* <p className="text-slate-600 mt-1">Here's your account overview</p> // Changed from "Here's" to avoid lint but staying true to original text is better. JSX handles quotes fine usually. */}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Account Balance */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <p className="text-slate-600 text-sm font-medium mb-2">Account Balance</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">
            ₹{account?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm font-medium">+{metrics?.monthlyTransactionCount} txs</span>
            <span className="text-slate-600 text-sm">this month</span>
          </div>
        </Card>

        {/* Monthly Spending */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <p className="text-slate-600 text-sm font-medium mb-2">Monthly Spending</p>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">
            ₹{metrics?.monthlySpending?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-sm">{metrics?.monthlyTransactionCount} transactions</span>
          </div>
        </Card>

        {/* Risk Level */}
        <Card className={`p-6 bg-white/80 backdrop-blur-xl border hover:shadow-lg transition-all duration-300 ${
          metrics?.riskScore === 'HIGH' 
            ? 'border-red-200 hover:shadow-red-500/10' 
            : metrics?.riskScore === 'MEDIUM'
            ? 'border-yellow-200 hover:shadow-yellow-500/10'
            : 'border-green-200 hover:shadow-green-500/10'
        }`}>
          <p className="text-slate-600 text-sm font-medium mb-2">Risk Level</p>
          <h3 className={`text-3xl font-bold mb-4 ${
            metrics?.riskScore === 'HIGH' 
              ? 'text-red-600' 
              : metrics?.riskScore === 'MEDIUM'
              ? 'text-yellow-600'
              : 'text-green-600'
          }`}>
            {metrics?.riskScore || 'LOW'}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-sm">Score: {metrics?.riskScoreValue || 15}</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending Chart */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Chart */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
              />
              <Bar dataKey="transactions" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
          <Link href="/dashboard/transactions" className="text-blue-600 text-sm font-medium hover:text-blue-700">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {recentTransactions?.map((tx: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{tx.icon}</div>
                <div>
                  <p className="font-medium text-slate-800">{tx.name}</p>
                  <p className="text-sm text-slate-600">{new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <span className={`font-semibold ${tx.type === "income" ? "text-green-600" : "text-slate-800"}`}>
                {tx.amount}
              </span>
            </div>
          ))}
          {(!recentTransactions || recentTransactions.length === 0) && (
            <p className="text-slate-500 text-center py-4">No recent transactions found.</p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      {/* <div className="grid md:grid-cols-2 gap-6">
        <Link href="/dashboard/transfer">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Send Money
          </Button>
        </Link> */}
        {/* <Button variant="outline" className="w-full h-12 text-base gap-2 bg-white">
          <ArrowDownLeft className="w-5 h-5" />
          Request Money
        </Button> */}
      {/* </div> */}
    </div>
  )
}
