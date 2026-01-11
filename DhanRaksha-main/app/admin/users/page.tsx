"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Users, UserPlus, Edit, Trash2, Search, Filter, Loader2, Mail, Calendar, TrendingUp, Wallet } from "lucide-react"

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

export default function UserAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    initialDeposit: 0,
    role: "USER",
    balance: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          initialDeposit: formData.initialDeposit
        })
      })

      if (res.ok) {
        setShowCreateModal(false)
        setFormData({ name: "", email: "", password: "", initialDeposit: 0, role: "USER", balance: 0 })
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      alert('Failed to create user')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          balance: formData.balance
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        setSelectedUser(null)
        setFormData({ name: "", email: "", password: "", initialDeposit: 0, role: "USER", balance: 0 })
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error("Failed to update user:", error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert('Failed to delete user')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      initialDeposit: 0,
      role: user.role,
      balance: user.balance
    })
    setShowEditModal(true)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)
  const avgBalance = users.length > 0 ? totalBalance / users.length : 0
  const totalTransactions = users.reduce((sum, user) => sum + user.transactionCount, 0)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">User Analytics</h2>
          <p className="text-slate-600 mt-1">Manage and monitor all users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {users.length}
              </h3>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600">Registered users</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Balance</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                ₹{totalBalance.toLocaleString()}
              </h3>
            </div>
            <Wallet className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-slate-600">Across all accounts</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Avg Balance</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                ₹{avgBalance.toFixed(0)}
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-slate-600">Per user</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Transactions</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {totalTransactions}
              </h3>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-sm text-slate-600">All time</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">All Users</h3>
        {filteredUsers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            {users.length === 0 ? "No users found." : "No users match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Balance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Transactions</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-900">
                        ₹{user.balance.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">{user.currency}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-slate-900">{user.transactionCount}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Deposit</label>
                <input
                  type="number"
                  min="0"
                  value={formData.initialDeposit}
                  onChange={(e) => setFormData({ ...formData, initialDeposit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Balance</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
