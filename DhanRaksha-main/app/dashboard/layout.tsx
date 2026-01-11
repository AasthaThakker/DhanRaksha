"use client"

import type React from "react"
import { useState } from "react"
import { Bell, LogOut, Menu, Settings, User, ChevronDown, Home, Send, List, Lock, X } from "lucide-react"
import Link from "next/link"
import { NotificationIcon } from "@/components/notification-icon"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = "/login"
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if API call fails
      window.location.href = "/login"
    }
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/transfer", label: "Send Money", icon: Send },
    { href: "/dashboard/transactions", label: "Transactions", icon: List },
    { href: "/dashboard/security", label: "Security", icon: Lock },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"
          } bg-white/80 backdrop-blur-xl border-r border-blue-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b border-blue-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-bold text-slate-800">DhanRaksha</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
              >
                <Icon className="w-5 h-5 group-hover:text-blue-600" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-blue-100">
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Behavior Monitoring</p>
            <p className="text-sm font-semibold text-slate-800 mb-2">Active & Secure</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-600">AI verification active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-blue-100 px-6 h-16 flex items-center justify-between shadow-lg shadow-blue-500/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <NotificationIcon />

            {/* Profile Menu */}
            <div className="relative">
              {/* <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  JD
                </div>
                <span className="text-sm font-medium text-slate-900">Profile</span>
                <ChevronDown className="w-4 h-4 text-slate-600" />
              </button> */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 transition-colors border-t border-blue-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-lg border border-blue-200 shadow-lg shadow-blue-500/20 overflow-hidden z-50">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-50 transition-colors border-t border-blue-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
