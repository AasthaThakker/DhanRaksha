"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Shield } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { api } from "@/lib/api"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (!isPasswordValid) {
      alert("Please meet all password requirements")
      return
    }

    setLoading(true)

    try {
      const response = await api.register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
      })

      if (response.success) {
        window.location.href = "/dashboard"
      } else {
        alert(response.error || "Registration failed")
      }
    } catch (err: any) {
      console.error(err)
      
      // Handle validation errors from backend
      if (err.message && typeof err.message === 'string') {
        try {
          const errorData = JSON.parse(err.message)
          if (errorData.details) {
            const errorMessages = errorData.details.map((detail: any) => 
              `${detail.field}: ${detail.message}`
            ).join('\n')
            alert(errorMessages)
          } else {
            alert(errorData.error || "Registration failed")
          }
        } catch {
          alert(err.message || "Registration failed")
        }
      } else {
        alert(err.message || "Registration failed")
      }
    } finally {
      setLoading(false)
    }
  }


  const passwordRequirements = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[@$!%*?&]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean)

  const getPasswordStrengthColor = () => {
    const passedRequirements = Object.values(passwordRequirements).filter(Boolean).length
    if (passedRequirements === 0) return "bg-slate-300"
    if (passedRequirements <= 2) return "bg-red-500"
    if (passedRequirements <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    const passedRequirements = Object.values(passwordRequirements).filter(Boolean).length
    if (passedRequirements === 0) return "Enter password"
    if (passedRequirements <= 2) return "Weak"
    if (passedRequirements <= 4) return "Medium"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-800">DhanRaksha</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Create Account</h1>
          <p className="text-center text-slate-600 mb-8">Join DhanRaksha today</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-900">
                Full Name
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="border-slate-300"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-900">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="border-slate-300"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-slate-300"
              />
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-1 flex-1 rounded-full ${getPasswordStrengthColor()}`}></div>
                <span className="text-xs text-slate-600">{getPasswordStrengthText()}</span>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className={`text-xs ${passwordRequirements.minLength ? "text-green-600" : "text-red-600"}`}>
                    ✓ At least 8 characters
                  </div>
                  <div className={`text-xs ${passwordRequirements.hasUpperCase ? "text-green-600" : "text-red-600"}`}>
                    ✓ One uppercase letter
                  </div>
                  <div className={`text-xs ${passwordRequirements.hasLowerCase ? "text-green-600" : "text-red-600"}`}>
                    ✓ One lowercase letter
                  </div>
                  <div className={`text-xs ${passwordRequirements.hasNumber ? "text-green-600" : "text-red-600"}`}>
                    ✓ One number
                  </div>
                  <div className={`text-xs ${passwordRequirements.hasSpecialChar ? "text-green-600" : "text-red-600"}`}>
                    ✓ One special character (@$!%*?&)
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-900">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="border-slate-300"
              />
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1" required />
              <span className="text-sm text-slate-600">
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !isPasswordValid}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-slate-600 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

