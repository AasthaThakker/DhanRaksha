"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Smartphone, MapPin, Clock, AlertTriangle, Check, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface SessionMetadata {
  sessionId: string
  deviceInfo: {
    userAgent: string
    browser: string
    os: string
    platform: string
    deviceType: string
  }
  networkInfo: {
    ip: string
    country: string
    city?: string
    region?: string
    isp?: string
    timezone?: string
  }
  timestamp: string
  lastActivity: string
  isActive: boolean
}

interface SecurityData {
  receiveAnomalyProtection: boolean
  sessions: SessionMetadata[]
  alerts: {
    id: string
    title: string
    description: string
    time: string
    severity: string
  }[]
}

export default function SecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [anomalyProtectionEnabled, setAnomalyProtectionEnabled] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch security data and session metadata (login sessions only)
        const [securityRes, sessionRes] = await Promise.all([
          api.getSecurityData(),
          fetch('/api/session/metadata', { credentials: 'include' })
        ])
        
        const sessionData = await sessionRes.json()
        
        // Merge the data - use session metadata for sessions
        setData({
          ...securityRes,
          sessions: sessionData.sessions || []
        })
        setAnomalyProtectionEnabled(securityRes.receiveAnomalyProtection)
      } catch (e) {
        console.error("Failed to load security data", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAnomalyProtectionToggle = async () => {
    setUpdating(true)
    try {
      const newValue = !anomalyProtectionEnabled
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiveAnomalyProtection: newValue
        })
      })
      
      if (response.ok) {
        setAnomalyProtectionEnabled(newValue)
        if (data) {
          setData({ ...data, receiveAnomalyProtection: newValue })
        }
      } else {
        console.error('Failed to update anomaly protection setting')
      }
    } catch (error) {
      console.error('Error updating anomaly protection:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading security data...</div>

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Security & Privacy</h2>
        <p className="text-slate-600 mt-1">Manage your account security and behavior monitoring</p>
      </div>

      {/* Security Status Overview */}
      <Card className="p-8 mb-6 border-l-4 border-l-green-500">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Account Status: Secure</h3>
            <p className="text-slate-600">Your account is well protected with active AI monitoring</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Security Settings</h3>

        <div className="space-y-4">
          {/* 2FA Setting */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-4">
              <Smartphone className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                <p className="text-sm text-slate-600">Add extra security to your account</p>
              </div>
            </div>
            <Button
              onClick={() => setTwoFAEnabled(!twoFAEnabled)}
              className={twoFAEnabled ? "bg-green-600 hover:bg-green-700" : "bg-slate-300 hover:bg-slate-400"}
            >
              {twoFAEnabled ? "Enabled" : "Enable"}
            </Button>
          </div>

          {/* Anomaly Protection */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Anomaly Protection</p>
                <p className="text-sm text-slate-600">Block unusually large incoming transfers based on your receiving patterns</p>
              </div>
            </div>
            <Button
              onClick={handleAnomalyProtectionToggle}
              disabled={updating}
              className={anomalyProtectionEnabled ? "bg-green-600 hover:bg-green-700" : "bg-slate-300 hover:bg-slate-400"}
            >
              {updating ? "Updating..." : anomalyProtectionEnabled ? "Enabled" : "Enable"}
            </Button>
          </div>

          {/* Behavior Monitoring */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">AI Behavior Monitoring</p>
                <p className="text-sm text-slate-600">Continuous authentication and fraud detection</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm">Active</span>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Password</p>
              <p className="text-sm text-slate-600">Last changed 2 months ago</p>
            </div>
            <Button variant="outline" className="bg-white">
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Session Activity */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Session & Behavior Log</h3>
          <div className="text-xs text-slate-500 bg-blue-50 px-2 py-1 rounded-full">
            Session Metadata (Non-Persistent)
          </div>
        </div>

        <div className="space-y-3">
          {data?.sessions.map((session: SessionMetadata) => (
            <div key={session.sessionId} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-slate-900">Session ID: {session.sessionId}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Device Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Smartphone className="w-4 h-4" />
                        <span className="font-medium">Device:</span> {session.deviceInfo.deviceType}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Browser:</span> {session.deviceInfo.browser}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">OS:</span> {session.deviceInfo.os}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">IP:</span> {session.networkInfo.ip}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">Location:</span> 
                        {session.networkInfo.city && session.networkInfo.city !== 'Unknown' 
                          ? `${session.networkInfo.city}, ${session.networkInfo.region && session.networkInfo.region !== 'Unknown' ? session.networkInfo.region + ', ' : ''}${session.networkInfo.country}`
                          : session.networkInfo.country
                        }
                      </div>
                      {(session.networkInfo.isp && session.networkInfo.isp !== 'Unknown') && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-medium">ISP:</span> {session.networkInfo.isp}
                        </div>
                      )}
                      {(session.networkInfo.timezone && session.networkInfo.timezone !== 'Unknown') && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="font-medium">Timezone:</span> {session.networkInfo.timezone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Last Activity:</span> {new Date(session.lastActivity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Privacy Notice */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <Shield className="w-3 h-3 text-blue-600 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This session metadata is collected <strong>ephemerally</strong> from request headers only. 
                        It is <strong>not stored</strong> in our database and is automatically purged from memory. 
                        Used solely for real-time security monitoring and user awareness.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!data?.sessions || data.sessions.length === 0) && (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 mb-2">No recent session data found.</p>
              <p className="text-sm text-slate-400">Session metadata will appear here once you make transactions or access your account</p>
            </div>
          )}
        </div>
      </Card>

      {/* AI Risk Alerts */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">AI Risk Alerts</h3>

        {data?.alerts.map(alert => (
          <div key={alert.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">{alert.title}</p>
                <p className="text-sm text-amber-800 mt-1">
                  {alert.description}
                </p>
                <p className="text-xs text-amber-700 mt-2">{new Date(alert.time).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}

        {(!data?.alerts || data.alerts.length === 0) && (
          <p className="text-slate-600 mb-4">No active risk alerts. Your account is secure.</p>
        )}

        <p className="text-sm text-slate-600 pt-4 border-t border-slate-100">
          AI is continuously monitoring your account for suspicious activity. All threats are automatically blocked and
          you'll be notified immediately.
        </p>
      </Card>
    </div>
  )
}
