"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, TrendingUp, Zap, Eye, Users, Lock, Brain, BarChart3, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-800">DhanRaksha</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">
                How It Works
              </a>
              {/* <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">
                Pricing
              </a> */}
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 backdrop-blur-sm transition-all">
                Sign In
              </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                Get Started
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 relative z-10">
              <h1 className="text-5xl lg:text-7xl font-black text-slate-800 leading-tight">
                Advanced{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 animate-gradient">
                  Fraud Protection
                </span>{" "}
                <br className="hidden lg:block" />
                <span className="text-3xl lg:text-5xl text-slate-700">for Digital Transactions</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                Multi-layer security with device detection, behavioral analysis, and smart fraud scoring. Protect every transaction with AI-powered risk assessment.
              </p>
              <div className="flex gap-4 pt-8">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg">
                    View Demo <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 bg-white/80 backdrop-blur-xl border border-blue-200 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
              <div className="relative z-10 text-center">
                <div className="relative">
                  <Shield className="w-32 h-32 text-blue-600 mx-auto mb-6 animate-pulse" />
                  <div className="absolute inset-0 w-32 h-32 bg-blue-400/20 rounded-full blur-xl mx-auto animate-ping"></div>
                </div>
                <p className="text-slate-800 text-lg font-semibold">Risk Analysis Dashboard</p>
                <div className="mt-4 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse animation-delay-1000"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse animation-delay-2000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">Complete Fraud Protection System</h2>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto">Multi-layer security features for comprehensive transaction safety</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-200 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">🔐 Security Features</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Device anomaly detection</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Multi-factor authentication</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Single-session login</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Behavioral analysis</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>ML-based fraud scoring</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Rule-based fraud checks</li>
              </ul>
            </div>
            <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-200 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">🧠 Smart Risk Analysis</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Real-time sender risk scoring</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>ML model-based decisions</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Behavior pattern matching</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Transaction history analysis</li>
              </ul>
            </div>
            <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-200 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">⚠️ Fraud Prevention</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Auto pause for high-risk transactions</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>User & bank alerts</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Dashboard updates</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Smart decision logic</li>
              </ul>
            </div>
            <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-200 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">🤝 User Protection</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Receiver confirmation system</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>30-minute accept/decline window</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Auto refund on timeout</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Notification system</li>
              </ul>
            </div>
            <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-blue-200 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">📊 Monitoring & Transparency</h3>
              <ul className="text-slate-600 space-y-2">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Real-time dashboard updates</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Risk level visibility</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>Status tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              How DhanRaksha Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Complete 9-step process with real-time monitoring and smart decision making
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical Line Connector */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-blue-400"></div>
              
              {[
                { step: 1, title: "User Login", desc: "User logs in to the banking app", icon: Users },
                { step: 2, title: "Device Check", desc: "System verifies device identity. Triggers MFA for suspicious devices", icon: Lock },
                { step: 3, title: "Secure Session", desc: "Single session created. Multiple logins prevented", icon: Shield },
                { step: 4, title: "Transaction Initiated", desc: "User initiates money transfer", icon: ArrowRight },
                { step: 5, title: "Risk Analysis", desc: "Rule-based engine, ML model, and behavioral analysis run simultaneously", icon: Brain },
                { step: 6, title: "Risk Score Generated", desc: "System calculates sender risk score", icon: BarChart3 },
                { step: 7, title: "Risk Level Decision", desc: "Classified as High (paused), Medium (flagged), or Low (proceed)", icon: AlertTriangle },
                { step: 8, title: "Receiver Protection", desc: "Receiver has 30 minutes to accept, decline, or timeout auto-refunds", icon: Clock },
                { step: 9, title: "Final Status", desc: "Transaction completed, refunded, or declined with full transparency", icon: TrendingUp },
              ].map((item, index) => (
                <div key={item.step} className="group relative mb-6 last:mb-0 flex items-start gap-4">
                  {/* Step Number Circle */}
                  <div className="relative z-10 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/50">
                    <span className="text-white font-black text-sm">{item.step}</span>
                  </div>
                  
                  {/* Content Card */}
                  <div className="flex-1 bg-white/80 backdrop-blur-xl border border-blue-200 p-5 rounded-xl hover:border-blue-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/50 to-purple-200/50 blur-3xl"></div>
          <h2 className="text-5xl lg:text-6xl font-black text-slate-800 mb-6 relative">Ready to Secure Your Transactions?</h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto relative">Advanced fraud protection with smart risk analysis and real-time monitoring</p>
          <div className="flex gap-6 justify-center relative">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 px-10 py-5 text-lg">
                View Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 px-10 py-5 text-lg">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl border-t border-blue-100 text-slate-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">DhanRaksha</span>
            </div>
            <p className="text-sm">© 2026 DhanRaksha. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
