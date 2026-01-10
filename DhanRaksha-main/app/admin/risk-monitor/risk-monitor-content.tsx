"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, AlertTriangle } from "lucide-react"
import { useState } from "react"

const riskSessions = [
  {
    id: 1,
    sessionId: "sess_a1b2c3",
    user: "user@example.com",
    device: "Chrome on Windows",
    location: "Tokyo, Japan",
    riskScore: 92,
    anomalies: ["Unusual location", "High velocity transfer"],
    time: "5 minutes ago",
  },
  {
    id: 2,
    sessionId: "sess_d4e5f6",
    user: "john.doe@example.com",
    device: "Safari on iPhone",
    location: "Los Angeles, CA",
    riskScore: 65,
    anomalies: ["Multiple failed attempts", "New device"],
    time: "12 minutes ago",
  },
  {
    id: 3,
    sessionId: "sess_g7h8i9",
    user: "jane.smith@example.com",
    device: "Firefox on Linux",
    location: "London, UK",
    riskScore: 85,
    anomalies: ["Large transaction", "Unusual time"],
    time: "28 minutes ago",
  },
  {
    id: 4,
    sessionId: "sess_j0k1l2",
    user: "admin@example.com",
    device: "Chrome on Windows",
    location: "San Francisco, CA",
    riskScore: 12,
    anomalies: ["Normal pattern"],
    time: "1 hour ago",
  },
]

export default function RiskMonitorContent() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState("All")

  const filteredSessions = riskSessions.filter((session) => {
    const matchesSearch =
      session.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRisk =
      riskFilter === "All" ||
      (riskFilter === "High" && session.riskScore >= 70) ||
      (riskFilter === "Medium" && session.riskScore >= 40 && session.riskScore < 70) ||
      (riskFilter === "Low" && session.riskScore < 40)
    return matchesSearch && matchesRisk
  })

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-50"
    if (score >= 40) return "bg-amber-50"
    return "bg-green-50"
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-700"
    if (score >= 40) return "bg-amber-100 text-amber-700"
    return "bg-green-100 text-green-700"
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">AI Risk Monitor</h2>
        <p className="text-slate-600 mt-1">Real-time monitoring of suspicious sessions and anomalies</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by user, session ID, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="All">All Risk Levels</option>
            <option value="High">High Risk (70+)</option>
            <option value="Medium">Medium Risk (40-69)</option>
            <option value="Low">Low Risk (&lt;40)</option>
          </select>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card key={session.id} className={`overflow-hidden ${getRiskColor(session.riskScore)}`}>
              <button
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                className="w-full p-6 hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-slate-900">{session.user}</p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeColor(session.riskScore)}`}
                        >
                          {session.riskScore >= 70 ? "High Risk" : session.riskScore >= 40 ? "Medium Risk" : "Low Risk"}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span>{session.device}</span>
                        <span>{session.location}</span>
                        <span>{session.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{session.riskScore}</p>
                      <p className="text-xs text-slate-600">Risk Score</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-600 transition-transform ${expandedId === session.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedId === session.id && (
                <div className="border-t border-slate-200 p-6 bg-white">
                  <div className="space-y-6">
                    {/* Session Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Session Details</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-slate-600">Session ID:</span>
                            <br />
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">{session.sessionId}</code>
                          </p>
                          <p>
                            <span className="text-slate-600">Device:</span> {session.device}
                          </p>
                          <p>
                            <span className="text-slate-600">Location:</span> {session.location}
                          </p>
                        </div>
                      </div>

                      {/* Anomalies */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Detected Anomalies</h4>
                        <div className="space-y-2">
                          {session.anomalies.map((anomaly, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-700">{anomaly}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Behavior Signals */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">AI Analysis</h4>
                      <p className="text-sm text-slate-600 mb-4">
                        The AI detected abnormal behavior patterns compared to this user's historical activity. Risk
                        factors include location deviation and transaction velocity.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-100 rounded">
                          <p className="text-xs text-slate-600">Confidence Level</p>
                          <p className="text-lg font-semibold text-slate-900">{session.riskScore}%</p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded">
                          <p className="text-xs text-slate-600">Recommendation</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {session.riskScore >= 70 ? "Block & Verify" : "Allow with Caution"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">Allow Transaction</Button>
                      <Button variant="outline" className="flex-1 bg-white">
                        Block & Flag
                      </Button>
                      <Button variant="outline" className="flex-1 bg-white">
                        Request Verification
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-600">No sessions found matching your filters</p>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Monitor Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-600 text-sm mb-1">High Risk Sessions</p>
            <p className="text-2xl font-bold text-red-600">{riskSessions.filter((s) => s.riskScore >= 70).length}</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">Medium Risk Sessions</p>
            <p className="text-2xl font-bold text-amber-600">
              {riskSessions.filter((s) => s.riskScore >= 40 && s.riskScore < 70).length}
            </p>
          </div>
          <div>
            <p className="text-slate-600 text-sm mb-1">Low Risk Sessions</p>
            <p className="text-2xl font-bold text-green-600">{riskSessions.filter((s) => s.riskScore < 40).length}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
