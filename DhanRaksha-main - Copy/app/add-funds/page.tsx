"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"

export default function AddFundsPage() {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setMessage("Please enter a valid amount")
      setMessageType("error")
      return
    }

    if (!description.trim()) {
      setMessage("Please enter a description")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await api.addFunds({
        amount: amountNum,
        description: description.trim()
      })

      if (response.success) {
        setMessage(response.message)
        setMessageType("success")
        setAmount("")
        setDescription("")
      } else {
        setMessage(response.error || "Failed to add funds")
        setMessageType("error")
      }
    } catch (err: any) {
      setMessage(err.message || "Failed to add funds")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            Add Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-900">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="border-slate-300"
              />
              <p className="text-xs text-slate-600">
                Minimum: ₹0.01, Maximum: ₹10,000
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900">
                Description
              </Label>
              <Input
                id="description"
                type="text"
                placeholder="Salary deposit, Gift, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={100}
                className="border-slate-300"
              />
              <p className="text-xs text-slate-600">
                Max 100 characters
              </p>
            </div>

            {/* Message */}
            {message && (
              <Alert className={messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <AlertDescription className={messageType === "error" ? "text-red-800" : "text-green-800"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? "Adding funds..." : "Add Funds"}
            </Button>
          </form>

          {/* Quick Amount Buttons */}
          <div className="mt-6 space-y-2">
            <p className="text-sm text-slate-600">Quick amounts:</p>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50, 100, 250, 500].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(value.toString())}
                  className="text-sm"
                >
                  ₹{value}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
