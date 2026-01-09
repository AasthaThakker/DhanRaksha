"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"
import { useState } from "react"

export default function VerifyPage() {
  const [verifyMethod, setVerifyMethod] = useState<"email" | "phone" | null>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = () => {
    setLoading(true)
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">SecureBank AI</span>
          </div>

          {/* Alert */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Step-Up Verification Required</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Our AI detected unusual activity. Please verify your identity to proceed.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Methods */}
          {!verifyMethod ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose verification method</h2>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 border-slate-300 hover:border-blue-400 bg-transparent"
                onClick={() => setVerifyMethod("email")}
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900">Email Verification</p>
                  <p className="text-sm text-slate-600">Send code to your@example.com</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 border-slate-300 hover:border-blue-400 bg-transparent"
                onClick={() => setVerifyMethod("phone")}
              >
                <div className="text-left">
                  <p className="font-medium text-slate-900">Phone Verification</p>
                  <p className="text-sm text-slate-600">Send code to +1 (555) 123-****</p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Enter verification code</h2>
              <p className="text-slate-600 text-sm">We've sent a 6-digit code to your {verifyMethod}</p>

              {/* Code Input */}
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-widest font-mono border-2 border-slate-300 rounded-lg p-4 focus:outline-none focus:border-blue-500"
              />

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={code.length !== 6 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setVerifyMethod(null)
                  setCode("")
                }}
              >
                Choose different method
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
