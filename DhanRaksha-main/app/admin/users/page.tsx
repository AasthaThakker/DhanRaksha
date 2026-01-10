"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
  balance: number
  currency: string
  accountCreated: string | null
  transactionCount: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers()
      if (response.success) {
        setUsers(response.users)
      } else {
        setError(response.error || "Failed to fetch users")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">All Users</h1>
          <p className="text-slate-600 mt-2">Total users: {users.length}</p>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-slate-900">{user.name}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-600">
                        <span className="font-medium">Email:</span> {user.email}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Balance:</span> ${user.balance.toFixed(2)} {user.currency}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Transactions:</span> {user.transactionCount}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium">Created:</span> {formatDate(user.createdAt)}
                      </p>
                      {user.accountCreated && (
                        <p className="text-slate-600">
                          <span className="font-medium">Account Created:</span> {formatDate(user.accountCreated)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-600">No users found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
