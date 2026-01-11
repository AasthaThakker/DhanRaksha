"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"
import { useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function TransferPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fromAccount: "checking",
    toRecipient: "",
    amount: "",
    category: "Other",
  })
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "processing" | "verified" | "error">("idle")
  const [aiResult, setAiResult] = useState({ message: "", status: "", riskScore: 0 })
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [transferring, setTransferring] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleVerify = async () => {
    if (!formData.toRecipient || !formData.amount) {
      alert("Please enter recipient and amount first")
      return
    }

    setVerificationStatus("processing")
    try {
      const res = await api.verifyTransfer({
        recipientEmail: formData.toRecipient,
        amount: parseFloat(formData.amount)
      })

      if (res.error) {
        alert(res.error)
        setVerificationStatus("idle")
      } else {
        setAiResult(res)
        setVerificationStatus("verified")
      }
    } catch (err) {
      console.error(err)
      setVerificationStatus("error")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationStatus !== "verified") {
      handleVerify()
    } else {
      setShowConfirmation(true)
    }
  }

  const handleFinalConfirm = async () => {
    try {
      setTransferring(true)
      const res = await api.transfer({
        recipientEmail: formData.toRecipient,
        amount: parseFloat(formData.amount),
        description: `WebApp Transfer - ${formData.category}`
      })

      if (res.error) {
        alert(res.error)
      } else {
        alert("Transfer sent successfully!")
        setShowConfirmation(false)
        router.push('/dashboard')
      }
    } catch (e: any) {
      alert("Transfer failed: " + e.message)
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Send Money</h2>
        <p className="text-slate-600 mt-1">Fast and secure transfers with AI verification</p>
      </div>

      {/* Transfer Form */}
      <Card className="p-8 mb-6 bg-white/80 backdrop-blur-xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Account */}
          <div>
            <Label htmlFor="fromAccount" className="text-slate-800 font-medium mb-3 block">
              From Account
            </Label>
            <select
              id="fromAccount"
              name="fromAccount"
              value={formData.fromAccount}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="checking">Checking Account</option>
              <option value="savings">Savings Account</option>
            </select>
          </div>

          {/* To Recipient */}
          <div>
            <Label htmlFor="toRecipient" className="text-slate-800 font-medium mb-3 block">
              Send To
            </Label>
            <Input
              id="toRecipient"
              name="toRecipient"
              placeholder="Enter recipient email (e.g. admin@banking.com)"
              value={formData.toRecipient}
              onChange={handleInputChange}
              required
              className="border-slate-300"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-slate-900 font-medium mb-3 block">
              Category
            </Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="Shopping">Shopping</option>
              <option value="Grocery">Grocery</option>
              <option value="Family">Family</option>
              <option value="Salary">Salary</option>
              <option value="Gift">Gift</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="text-slate-900 font-medium mb-3 block">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-600 text-lg">₹</span>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
                required
                className="pl-8 border-slate-300"
              />
            </div>
          </div>

          {/* AI Verification Status */}
          <div className={`p-4 rounded-lg border ${verificationStatus === 'verified'
              ? aiResult.riskScore > 50
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-start gap-3">
              <div className="pt-1">
                {verificationStatus === "idle" && <AlertCircle className="w-5 h-5 text-blue-600" />}
                {verificationStatus === "processing" && (
                  <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                )}
                {verificationStatus === "verified" && (
                  aiResult.riskScore > 50
                    ? <AlertCircle className="w-5 h-5 text-amber-600" />
                    : <Check className="w-5 h-5 text-green-600" />
                )}
                {verificationStatus === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {verificationStatus === "idle" && "Awaiting verification"}
                  {verificationStatus === "processing" && "Analyzing your behavior..."}
                  {verificationStatus === "verified" && (aiResult.status === 'SAFE' ? "Behavior matches known pattern" : aiResult.message)}
                  {verificationStatus === "error" && "Verification service error"}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {verificationStatus === "idle" && "Click verify to check your transfer with our AI"}
                  {verificationStatus === "processing" && "Our AI is analyzing your transfer pattern and risk level"}
                  {verificationStatus === "verified" && (
                    aiResult.status === 'SAFE'
                      ? "You can proceed with this transfer safely"
                      : `Risk Score: ${aiResult.riskScore}. This transfer is flagged as ${aiResult.status.toLowerCase()}.`
                  )}
                  {verificationStatus === "error" && "Please try again or contact support if the issue persists"}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            {(verificationStatus === "idle" || verificationStatus === "error") && (
              <Button type="button" onClick={handleVerify} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Verify with AI
              </Button>
            )}
            {verificationStatus === "processing" && (
              <Button disabled className="flex-1 bg-blue-400">
                Analyzing...
              </Button>
            )}
            {verificationStatus === "verified" && (
              <Button type="submit" className={`flex-1 ${aiResult.riskScore > 70 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                Review Transfer
              </Button>
            )}
            <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-blue-200 shadow-2xl shadow-blue-500/20">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className={`w-12 h-12 ${aiResult.riskScore > 50 ? 'bg-amber-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {aiResult.riskScore > 50 ? <AlertCircle className="w-6 h-6 text-amber-600" /> : <Check className="w-6 h-6 text-green-600" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Confirm Transfer</h3>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-600">Category</span>
                  <span className="font-semibold text-slate-800">{formData.category}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-600">Amount</span>
                  <span className="font-semibold text-slate-800">₹{formData.amount}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-600">To</span>
                  <span className="font-semibold text-slate-800 text-right">{formData.toRecipient}</span>
                </div>
                <div className={`flex justify-between p-3 rounded-lg border ${aiResult.riskScore > 50 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                  }`}>
                  <span className="text-slate-600">AI Risk Score</span>
                  <span className={`font-semibold ${aiResult.riskScore > 50 ? 'text-amber-600' : 'text-green-600'} flex items-center gap-1`}>
                    {aiResult.riskScore} ({aiResult.status})
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowConfirmation(false)} variant="outline" className="flex-1" disabled={transferring}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFinalConfirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={transferring}
                >
                  {transferring ? 'Sending...' : 'Confirm & Send'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
