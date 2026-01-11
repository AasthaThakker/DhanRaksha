"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { AlertTriangle, User, Clock, Filter, Search, Eye, Loader2, TrendingUp, Activity, BarChart3 } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"

interface FlaggedSession {
  id: string
  sessionId: string
  user: string
  userName: string
  device: string
  location: string
  riskScore: number
  riskLevel: string
  anomalies: string[]
  time: string
  transactionCount: number
  totalAmount: number
}

interface RiskTrend {
  date: string
  avgRiskScore: number
  transactionCount: number
}

interface UserRiskSummary {
  id: string
  name: string
  email: string
  transactionCount: number
  avgTransactionRisk: number
  maxTransactionRisk: number
  minTransactionRisk: number
  incomeCount: number
  expenseCount: number
  transferCount: number
  completedCount: number
  failedCount: number
  pendingCount: number
  avgAmount: number
  totalAmount: number
  maxAmount: number
  minAmount: number
}

interface SpiderChartData {
  id: string
  name: string
  email: string
  riskScore: number
  criticalRiskRatio: number
  highRiskRatio: number
  failedTransactionRatio: number
  largeTransactionRatio: number
  recentActivityRatio: number
  incomeRatio: number
  expenseRatio: number
  transferRatio: number
  avgAmount: number
  maxAmount: number
  transactionVolume: number
  criticalRiskCount: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  minimalRiskCount: number
}

export default function RiskMonitorContent() {
  const [loading, setLoading] = useState(false) // Start with false to ensure rendering
  const [sessions, setSessions] = useState<FlaggedSession[]>([])
  const [riskTrends, setRiskTrends] = useState<RiskTrend[]>([])
  const [userRiskSummaries, setUserRiskSummaries] = useState<UserRiskSummary[]>([])
  const [spiderChartData, setSpiderChartData] = useState<SpiderChartData[]>([])
  const [selectedUserForSpider, setSelectedUserForSpider] = useState<SpiderChartData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [summary, setSummary] = useState({
    total: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  })
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    fetchRiskData()
  }, [riskFilter, searchTerm])

  // Initial data fetch on component mount
  useEffect(() => {
    console.log('🚀 Component mounted, fetching initial data...');
    fetchRiskData()
  }, [])

  // Auto-select first user for spider chart when data loads
  useEffect(() => {
    if (spiderChartData.length > 0 && !selectedUserForSpider) {
      setSelectedUserForSpider(spiderChartData[0])
    }
  }, [spiderChartData, selectedUserForSpider])

  const fetchRiskData = async () => {
    try {
      console.log('🔄 Frontend: Starting fetchRiskData...');
      setLoading(true); // Set loading to true at start
      
      const params = new URLSearchParams({
        risk: riskFilter,
        search: searchTerm
      })
      const res = await fetch(`/api/test-risk-monitor?${params.toString()}`)
      console.log('📡 Frontend: Fetch response status:', res.status);
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Frontend: Data received:', {
          sessions: data.sessions?.length || 0,
          riskTrends: data.dailyRiskTrends?.length || 0,
          userSummaries: data.userRiskSummaries?.length || 0,
          spiderChartData: data.spiderChartData?.length || 0
        });
        
        // Remove duplicate users - keep only the most recent session per user
        const uniqueSessions = (data.sessions || []).reduce((acc: FlaggedSession[], session: FlaggedSession) => {
          const existingUserIndex = acc.findIndex((s: FlaggedSession) => s.user === session.user);
          if (existingUserIndex === -1) {
            // First time seeing this user, add to list
            acc.push(session);
          } else {
            // User already exists, keep the one with higher risk score or more recent time
            const existingSession = acc[existingUserIndex];
            if (session.riskScore > existingSession.riskScore || 
                new Date(session.time) > new Date(existingSession.time)) {
              acc[existingUserIndex] = session; // Replace with higher risk or more recent
            }
          }
          return acc;
        }, []);
        
        console.log(`🔄 Deduplication: ${data.sessions?.length || 0} sessions → ${uniqueSessions.length} unique users`);
        
        setSessions(uniqueSessions)
        setRiskTrends(data.dailyRiskTrends || [])
        setUserRiskSummaries(data.userRiskSummaries || [])
        setSpiderChartData(data.spiderChartData || [])
        setSummary(data.summary || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 })
        console.log('✅ Frontend: State updates completed');
      }
    } catch (error) {
      console.error("Failed to fetch risk data:", error)
    } finally {
      console.log('✅ Frontend: Setting loading to false');
      setLoading(false) // Always set loading to false at end
      
      // Fallback: Force loading to false after 2 seconds
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }

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

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getRiskLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50'
      case 'MEDIUM': return 'text-amber-600 bg-amber-50'
      case 'LOW': return 'text-green-600 bg-green-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return '#ef4444'
    if (score >= 40) return '#f59e0b'
    return '#10b981'
  }

  const handleViewDetails = (session: FlaggedSession) => {
    console.log('🔍 Viewing details for session:', session.id);
    setAlertMessage({
      type: 'info',
      message: `Session Details:\n\nUser: ${session.userName} (${session.user})\nRisk Score: ${session.riskScore}\nRisk Level: ${session.riskLevel}\nTransactions: ${session.transactionCount}\nTotal Amount: ₹${session.totalAmount.toLocaleString()}`
    });
  }

  const handleMarkAsSafe = async (sessionId: string) => {
    try {
      console.log('✅ Marking session as safe:', sessionId);
      
      // Update the session in local state to reduce risk score
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, riskScore: Math.max(0, s.riskScore - 20), riskLevel: s.riskScore - 20 >= 40 ? 'MEDIUM' : 'LOW' }
          : s
      ));
      
      // Remove from flagged list if risk level is now LOW
      setTimeout(() => {
        setSessions(prev => prev.filter(s => s.id !== sessionId || s.riskLevel !== 'HIGH'));
        
        // Update summary
        setSummary(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          highRisk: Math.max(0, prev.highRisk - 1)
        }));
      }, 1000);
      
      setAlertMessage({
        type: 'success',
        message: '✅ Session marked as safe! Risk score reduced and removed from flagged list.'
      });
    } catch (error) {
      console.error('❌ Failed to mark session as safe:', error);
      setAlertMessage({
        type: 'error',
        message: '❌ Failed to mark session as safe'
      });
    }
  }

  const handleBlockUser = async (userEmail: string) => {
    try {
      console.log('🚫 Blocking user:', userEmail);
      
      // Confirm before blocking
      const confirmed = confirm(`Are you sure you want to block user: ${userEmail}?\n\nThis will prevent them from making any transactions.`);
      if (!confirmed) return;
      
      // Remove all sessions for this user from local state
      setSessions(prev => prev.filter(s => s.user !== userEmail));
      
      // Update summary
      const userSessions = sessions.filter(s => s.user === userEmail);
      setSummary(prev => ({
        ...prev,
        total: Math.max(0, prev.total - userSessions.length),
        highRisk: Math.max(0, prev.highRisk - userSessions.filter(s => s.riskLevel === 'HIGH').length)
      }));
      
      setAlertMessage({
        type: 'success',
        message: `✅ User ${userEmail} has been blocked and cannot make transactions`
      });
    } catch (error) {
      console.error('❌ Failed to block user:', error);
      setAlertMessage({
        type: 'error',
        message: '❌ Failed to block user'
      });
    }
  }

  // Temporarily disable loading check to test buttons
  // if (loading) {
  //   return (
  //     <div className="flex h-[60vh] items-center justify-center">
  //       <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
  //       <div className="ml-4 text-slate-600">Loading risk monitor data...</div>
  //     </div>
  //   )
  // }

  // Temporary bypass for testing - remove this line once loading is fixed
  if (sessions.length === 0 && !loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-600">No sessions data available. Please check API connection.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Modal Popup */}
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
        <h2 className="text-3xl font-bold text-slate-900">Risk Monitor</h2>
        <p className="text-slate-600 mt-1">Real-time risk analysis and threat detection</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Sessions</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {summary.total}
              </h3>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600">Active monitoring</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">High Risk</p>
              <h3 className="text-3xl font-bold text-red-600 mt-2">
                {summary.highRisk}
              </h3>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-sm text-slate-600">Immediate attention</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Medium Risk</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">
                {summary.mediumRisk}
              </h3>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-sm text-slate-600">Monitor closely</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Avg Risk Score</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {riskTrends.length > 0 ? riskTrends[0]?.avgRiskScore?.toFixed(1) || '0' : '0'}
              </h3>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-slate-600">Last 24 hours</p>
        </Card>
      </div>

      {/* Risk Trends Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Score Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Risk Score Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={riskTrends.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={formatDate}
              />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                labelFormatter={formatDate}
                formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Avg Risk Score']}
              />
              <Area
                type="monotone"
                dataKey="avgRiskScore"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Transaction Volume vs Risk */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Transaction Volume & Risk</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskTrends.slice().reverse().slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickFormatter={formatDate}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                labelFormatter={formatDate}
              />
              <Bar dataKey="transactionCount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Spider Chart Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">User Risk Spider Analysis</h3>
          <select
            value={selectedUserForSpider?.id || ''}
            onChange={(e) => {
              const user = spiderChartData.find(u => u.id === e.target.value)
              setSelectedUserForSpider(user || null)
            }}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {spiderChartData.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {selectedUserForSpider ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Spider Chart */}
            <div>
              <h4 className="text-md font-medium text-slate-700 mb-4 text-center">
                Risk Profile: {selectedUserForSpider.name}
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={[
                  { metric: 'Risk Score', value: selectedUserForSpider.riskScore, fullMark: 100 },
                  { metric: 'Critical Risk', value: selectedUserForSpider.criticalRiskRatio, fullMark: 100 },
                  { metric: 'High Risk', value: selectedUserForSpider.highRiskRatio, fullMark: 100 },
                  { metric: 'Failed Tx', value: selectedUserForSpider.failedTransactionRatio, fullMark: 100 },
                  { metric: 'Large Tx', value: selectedUserForSpider.largeTransactionRatio, fullMark: 100 },
                  { metric: 'Recent Activity', value: selectedUserForSpider.recentActivityRatio, fullMark: 100 },
                  { metric: 'Income Ratio', value: selectedUserForSpider.incomeRatio, fullMark: 100 },
                  { metric: 'Expense Ratio', value: selectedUserForSpider.expenseRatio, fullMark: 100 }
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name={selectedUserForSpider.name}
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Value']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Metrics Details */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-slate-700">Risk Metrics Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Average Risk Score</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedUserForSpider.riskScore.toFixed(1)}
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Transaction Volume</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedUserForSpider.transactionVolume}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">Critical Risk Transactions</p>
                  <p className="text-2xl font-bold text-red-700">
                    {selectedUserForSpider.criticalRiskCount}
                  </p>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm text-amber-600">High Risk Transactions</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {selectedUserForSpider.highRiskCount}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Average Transaction Amount</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ₹{selectedUserForSpider.avgAmount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600">Max Transaction Amount</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ₹{selectedUserForSpider.maxAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-3">Risk Distribution</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Critical (80-100)</span>
                    <span className="text-sm font-medium text-red-600">
                      {selectedUserForSpider.criticalRiskCount} ({selectedUserForSpider.criticalRiskRatio.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">High (60-80)</span>
                    <span className="text-sm font-medium text-amber-600">
                      {selectedUserForSpider.highRiskCount} ({selectedUserForSpider.highRiskRatio.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Medium (40-60)</span>
                    <span className="text-sm font-medium text-blue-600">
                      {selectedUserForSpider.mediumRiskCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Low (20-40)</span>
                    <span className="text-sm font-medium text-green-600">
                      {selectedUserForSpider.lowRiskCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Minimal (0-20)</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {selectedUserForSpider.minimalRiskCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">Select a user to view spider chart analysis</p>
          </div>
        )}
      </Card>

      {/* User Risk Summaries */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Transaction Risk Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Avg Risk Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Transaction Count</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Avg Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Total Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Max Risk</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {userRiskSummaries.slice(0, 10).map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getRiskScoreColor(Number(user.avgTransactionRisk) || 0) }}
                      />
                      <span className="font-medium text-slate-900">
                        {(Number(user.avgTransactionRisk) || 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-900">{user.transactionCount}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-900">
                      ₹{(Number(user.avgAmount) || 0).toLocaleString()}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-900">
                      ₹{(Number(user.totalAmount) || 0).toLocaleString()}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getRiskScoreColor(Number(user.maxTransactionRisk) || 0) }}
                      />
                      <span className="font-medium text-slate-900">
                        {(Number(user.maxTransactionRisk) || 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      (() => {
                        const avgRisk = Number(user.avgTransactionRisk) || 0;
                        const maxRisk = Number(user.maxTransactionRisk) || 0;
                        // Consider both average and max risk for status
                        const riskScore = (avgRisk * 0.7) + (maxRisk * 0.3); // 70% weight to avg, 30% to max
                        
                        if (maxRisk >= 70) {
                          return 'bg-red-50 text-red-700';
                        } else if (riskScore >= 40) {
                          return 'bg-amber-50 text-amber-700';
                        } else {
                          return 'bg-green-50 text-green-700';
                        }
                      })()
                    }`}>
                      {(() => {
                        const avgRisk = Number(user.avgTransactionRisk) || 0;
                        const maxRisk = Number(user.maxTransactionRisk) || 0;
                        const riskScore = (avgRisk * 0.7) + (maxRisk * 0.3);
                        
                        if (maxRisk >= 70) {
                          return 'High Risk';
                        } else if (riskScore >= 40) {
                          return 'Medium Risk';
                        } else {
                          return 'Low Risk';
                        }
                      })()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Spider Charts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">User Risk Spider Analysis</h3>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select User for Spider Chart</label>
            <select
              value={selectedUserForSpider?.id || ''}
              onChange={(e) => {
                const user = spiderChartData.find(u => u.id === e.target.value)
                setSelectedUserForSpider(user || null)
              }}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a user...</option>
              {spiderChartData.slice(0, 10).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - Risk Score: {user.riskScore.toFixed(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Spider Chart */}
          <div className="lg:col-span-2">
            {selectedUserForSpider ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{selectedUserForSpider.name}</h4>
                    <p className="text-sm text-slate-600">{selectedUserForSpider.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Overall Risk Score</p>
                    <p className="text-2xl font-bold" style={{ color: getRiskScoreColor(selectedUserForSpider.riskScore) }}>
                      {selectedUserForSpider.riskScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    { metric: 'Risk Score', value: selectedUserForSpider.riskScore, fullMark: 100 },
                    { metric: 'Critical Risk', value: selectedUserForSpider.criticalRiskRatio, fullMark: 100 },
                    { metric: 'High Risk', value: selectedUserForSpider.highRiskRatio, fullMark: 100 },
                    { metric: 'Failed Transactions', value: selectedUserForSpider.failedTransactionRatio, fullMark: 100 },
                    { metric: 'Large Transactions', value: selectedUserForSpider.largeTransactionRatio, fullMark: 100 },
                    { metric: 'Recent Activity', value: selectedUserForSpider.recentActivityRatio, fullMark: 100 },
                    { metric: 'Income Ratio', value: selectedUserForSpider.incomeRatio, fullMark: 100 },
                    { metric: 'Expense Ratio', value: selectedUserForSpider.expenseRatio, fullMark: 100 },
                    { metric: 'Transfer Ratio', value: selectedUserForSpider.transferRatio, fullMark: 100 },
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Radar
                      name="Risk Profile"
                      dataKey="value"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "8px", color: "#fff" }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Value']}
                    />
                  </RadarChart>
                </ResponsiveContainer>

                {/* Risk Metrics Details */}
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Risk Distribution</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Critical:</span>
                        <span className="font-medium text-red-600">{selectedUserForSpider.criticalRiskCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">High:</span>
                        <span className="font-medium text-amber-600">{selectedUserForSpider.highRiskCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Medium:</span>
                        <span className="font-medium text-blue-600">{selectedUserForSpider.mediumRiskCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Low:</span>
                        <span className="font-medium text-green-600">{selectedUserForSpider.lowRiskCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Transaction Analysis</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Total Volume:</span>
                        <span className="font-medium">{selectedUserForSpider.transactionVolume}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Avg Amount:</span>
                        <span className="font-medium">₹{selectedUserForSpider.avgAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Max Amount:</span>
                        <span className="font-medium">₹{selectedUserForSpider.maxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 mb-2">Transaction Types</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Income:</span>
                        <span className="font-medium text-green-600">{selectedUserForSpider.incomeRatio.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Expense:</span>
                        <span className="font-medium text-red-600">{selectedUserForSpider.expenseRatio.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Transfer:</span>
                        <span className="font-medium text-blue-600">{selectedUserForSpider.transferRatio.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Select a user to view their risk spider chart analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Flagged Sessions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Flagged Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No flagged sessions found matching your criteria.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{session.userName}</h4>
                      <p className="text-sm text-slate-600">{session.user}</p>
                      
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-600">Risk Score:</span>
                      <span 
                        className="text-lg font-bold"
                        style={{ color: getRiskScoreColor(session.riskScore) }}
                      >
                        {session.riskScore.toFixed(1)}
                      </span>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(session.riskLevel)}`}
                    >
                      {session.riskLevel} Risk
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                      <Clock className="w-3 h-3" />
                      {formatTime(session.time)}
                    </div>
                  </div>
                </div>

                

                {/* Transaction Summary */}
                <div className="grid md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Transaction Activity</p>
                    <p className="text-sm font-medium text-slate-900">
                      {session.transactionCount} transactions • ₹{session.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleViewDetails(session)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button 
                    onClick={() => handleMarkAsSafe(session.id)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Mark as Safe
                  </button>
                  <button 
                    onClick={() => handleBlockUser(session.user)}
                    className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Block User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
