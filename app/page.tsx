"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, TrendingUp, Zap, Eye } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">Rupya Bank</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900">
                How It Works
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900">
                Pricing
              </a>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                AI-Powered{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  Behavioral Verification
                </span>{" "}
                for Secure Banking
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Advanced fraud detection that learns your behavior pattern. Never compromise security for user
                experience again.
              </p>
              <div className="flex gap-4 pt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    View Demo <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-24 h-24 text-blue-600 mx-auto mb-4 opacity-80" />
                <p className="text-slate-600">Behavioral Analysis Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Secure Banking Reimagined</h2>
            <p className="text-lg text-slate-600">Features designed for modern financial security</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Zap className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-time Behavioral Analysis</h3>
              <p className="text-slate-600">
                Continuous monitoring of user behavior patterns to detect anomalies instantly.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Continuous Authentication</h3>
              <p className="text-slate-600">Seamless verification without interrupting the user experience.</p>
            </div>
            <div className="p-8 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Eye className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Fraud Detection Without Friction</h3>
              <p className="text-slate-600">Protect users from fraud while maintaining a frictionless experience.</p>
            </div>
            <div className="p-8 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Shield className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Admin Explainability</h3>
              <p className="text-slate-600">Transparent AI insights let admins understand every security decision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">How AI Verification Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Learn", desc: "AI learns your normal behavior" },
              { step: 2, title: "Monitor", desc: "Continuous real-time monitoring" },
              { step: 3, title: "Detect", desc: "Identifies anomalies instantly" },
              { step: 4, title: "Verify", desc: "Step-up auth when needed" },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white p-6 rounded-lg border border-slate-200 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 font-semibold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
                {item.step < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 border-t-2 border-r-2 border-blue-300 rotate-45"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Secure Your Banking Platform?</h2>
          {/* <p className="text-blue-50 text-lg mb-8">Start with a free demo or create your account in minutes.</p> */}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary">
                View Demo
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Rupya Bank</span>
            </div>
            <p className="text-sm">© 2026 SecureBank AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
