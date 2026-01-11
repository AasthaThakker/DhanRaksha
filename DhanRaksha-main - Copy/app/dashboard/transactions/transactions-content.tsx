"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Filter, Download, X } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import * as XLSX from 'xlsx'

export default function TransactionsContent() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [amountFilter, setAmountFilter] = useState({ min: "", max: "" })
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" })
  const [showMoreFilters, setShowMoreFilters] = useState(false)

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
    const matchesCategory = categoryFilter === "All" || tx.category === categoryFilter
    
    const txAmount = parseFloat(tx.amount.replace(/[^0-9.-]/g, ''))
    const matchesAmount = 
      (!amountFilter.min || txAmount >= parseFloat(amountFilter.min)) &&
      (!amountFilter.max || txAmount <= parseFloat(amountFilter.max))
    
    const txDate = new Date(tx.date)
    const matchesDate = 
      (!dateFilter.start || txDate >= new Date(dateFilter.start)) &&
      (!dateFilter.end || txDate <= new Date(dateFilter.end))
    
    return matchesSearch && matchesStatus && matchesCategory && matchesAmount && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase()
    if (s === "completed")
      return <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">Completed</span>
    if (s === "failed")
      return <span className="px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">Failed</span>
    if (s === "pending")
      return <span className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">Pending</span>
    return <span className="px-3 py-1 bg-gray-50 text-gray-700 text-sm font-medium rounded-full">{status}</span>
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions.map(tx => ({
      'Transaction Name': tx.name,
      'Category': tx.category,
      'Date': tx.dateStr,
      'Status': tx.status,
      'Amount': tx.amount,
      'Risk': tx.risk
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("All")
    setCategoryFilter("All")
    setAmountFilter({ min: "", max: "" })
    setDateFilter({ start: "", end: "" })
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
            <option value="All">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            className="gap-2 bg-white" 
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            <Filter className="w-4 h-4" />
            {showMoreFilters ? 'Less Filters' : 'More Filters'}
          </Button>
          <Button variant="outline" className="gap-2 bg-white" onClick={exportToExcel}>
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          {(searchQuery || statusFilter !== "All" || categoryFilter !== "All" || amountFilter.min || amountFilter.max || dateFilter.start || dateFilter.end) && (
            <Button variant="outline" className="gap-2 bg-white" onClick={clearFilters}>
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Additional Filters */}
        {showMoreFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Category</Label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Family">Family</option>
                  <option value="Salary">Salary</option>
                  <option value="Gift">Gift</option>
                  <option value="Other">Other</option>
                  <option value="Income">Income</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Amount Range Filter */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountFilter.min}
                    onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                    className="border-slate-300"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountFilter.max}
                    onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                    className="border-slate-300"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="border-slate-300"
                  />
                  <Input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Transaction</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date & Time</th>
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
                    <td className="px-6 py-4 text-slate-600">
                      <div>
                        <p>{transaction.dateStr}</p>
                        <p className="text-xs text-slate-500">{new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
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
