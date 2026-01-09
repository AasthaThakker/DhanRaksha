"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export default function TransactionsContent() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  useEffect(() => {
    const loadTx = async () => {
      try {
        const res = await api.getTransactions(100)
        // Enrich data to match UI expectations
        const enriched = res.transactions.map((tx: any) => ({
          ...tx,
          category: tx.type === 'income' ? 'Income' : 'General', // specific categories not in DB yet
          risk: 'Low', // Mock risk per tx
          dateStr: new Date(tx.date).toLocaleDateString()
        }))
        setTransactions(enriched)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadTx()
  }, [])

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "All" || tx.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === "completed")
      return <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">Completed</span>
    if (s === "flagged")
      return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">Flagged</span>
    if (s === "blocked")
      return <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">Blocked</span>
    return <span className="px-3 py-1 bg-gray-50 text-gray-700 text-sm font-medium rounded-full">{status}</span>
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Transactions</h2>
        <p className="text-slate-600 mt-1">View and manage all your transactions</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-300"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FLAGGED">Flagged</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" className="gap-2 bg-white">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Transaction</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center">Loading transactions...</td></tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{transaction.name}</p>
                        <p className="text-sm text-slate-600">Risk: {transaction.risk}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{transaction.category}</td>
                    <td className="px-6 py-4 text-slate-600">{transaction.dateStr}</td>
                    <td className="px-6 py-4">{getStatusBadge(transaction.status)}</td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${transaction.amount.startsWith("+") ? "text-green-600" : "text-slate-900"
                        }`}
                    >
                      {transaction.amount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
