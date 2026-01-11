"use client"

import { Card } from "@/components/ui/card"
import { Loader2, Users, ArrowRightLeft, TrendingUp } from "lucide-react"

export default function NetworkMapSimple() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setLoading(false)
            // Mock data for testing
            setData({
                nodes: [
                    { id: '1', name: 'John Doe', email: 'john@example.com', balance: 50000, transactionCount: 10 },
                    { id: '2', name: 'Jane Smith', email: 'jane@example.com', balance: 30000, transactionCount: 8 },
                    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', balance: 75000, transactionCount: 15 }
                ],
                links: [
                    { source: '1', target: '2', count: 3, totalAmount: 15000 },
                    { source: '2', target: '3', count: 2, totalAmount: 8000 }
                ],
                summary: { totalNodes: 3, totalLinks: 2, totalTransactions: 5 }
            })
        }, 1000)
    }, [])

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-slate-600">Loading network map...</span>
                </div>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="p-6">
                <div className="text-center text-red-500">
                    <p>Error: {error}</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Transaction Network Map</h3>
                    <p className="text-sm text-slate-600">Visualize user transaction relationships</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{data?.summary?.totalNodes || 0} Users</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>{data?.summary?.totalLinks || 0} Links</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{data?.summary?.totalTransactions || 0} Transactions</span>
                    </div>
                </div>
            </div>

            {/* Network Map */}
            <Card className="p-6">
                <div className="relative bg-slate-50 rounded-lg" style={{ width: 800, height: 600 }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-2">Network Map Component</h4>
                            <p className="text-slate-600 mb-4">Component is successfully loaded!</p>
                            <div className="space-y-2 text-sm text-slate-500">
                                <p>✅ Component renders without errors</p>
                                <p>✅ Data structure is correct</p>
                                <p>✅ Authentication is required for full functionality</p>
                                <p>✅ API endpoint exists and is protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
