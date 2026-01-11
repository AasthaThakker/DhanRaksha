"use client"

import { useEffect, useRef, useState } from 'react'
import { Card } from "@/components/ui/card"
import { Loader2, Users, ArrowRightLeft, ArrowRight, Calendar, TrendingUp, AlertTriangle, Shield, Clock, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react"

interface Node {
    id: string
    name: string
    email: string
    balance: number
    currency: string
    joinDate: string
    transactionCount: number
    totalSent: number
    totalReceived: number
    avgRiskScore: number
    highRiskTransactions: number
    knownRecipients: string[]
    knownAmounts: number[]
    avgTransactionAmount: number
    lastTransactionDate: string | null
}

interface Link {
    source: string
    target: string
    count: number
    totalAmount: number
    avgAmount: number
    avgRiskScore: number
    riskScores: number[]
    transactions: Transaction[]
    frequency: 'low' | 'medium' | 'high'
    isKnownPattern: boolean
    lastTransaction: string | null
    senderName?: string
    receiverName?: string
}

interface Transaction {
    id: string
    amount: number
    type: string
    status: string
    description: string
    date: string
    senderName: string
    senderEmail: string
    receiverName: string
    receiverEmail: string
    riskScore: number
}

interface NetworkMapData {
    nodes: Node[]
    links: Link[]
    summary: {
        totalNodes: number
        totalLinks: number
        totalTransactions: number
        fraudDetectionAttempts: number
        highRiskFraudAttempts: number
        avgRiskScore: number
        knownPatterns: number
        lastUpdated: string
    }
}

export default function NetworkMap() {
    const [data, setData] = useState<NetworkMapData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null)
    const [selectedLink, setSelectedLink] = useState<Link | null>(null)
    const [isLegendMinimized, setIsLegendMinimized] = useState(false)
    const svgRef = useRef<SVGSVGElement>(null)
    
    // Zoom and pan state
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNetworkData()
    }, [])

    const fetchNetworkData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/network-map')
            if (res.ok) {
                const networkData = await res.json()
                setData(networkData.data)
            } else {
                console.error('Failed to fetch network map data')
            }
        } catch (error) {
            console.error('Network map fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Zoom and pan handlers
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 5))
    }

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 0.5))
    }

    const handleResetZoom = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button === 0) { // Left mouse button
            setIsDragging(true)
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
            e.preventDefault()
        }
    }

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)))
    }

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-slate-600">Loading fraud detection network...</span>
                    <span className="text-sm text-slate-500">Analyzing suspicious transaction patterns</span>
                </div>
            </Card>
        )
    }

    if (!data) {
        return (
            <Card className="p-6">
                <div className="text-center text-slate-500">
                    Failed to load network map data
                </div>
            </Card>
        )
    }

    // Calculate dimensions and positions
    const width = 800
    const height = 600
    const centerX = width / 2
    const centerY = height / 2

    // Position nodes in a circle layout
    const nodePositions = new Map<string, { x: number; y: number }>()
    if (data?.nodes) {
        data.nodes.forEach((node, index) => {
            const angle = (index / data.nodes.length) * 2 * Math.PI
            const radius = Math.min(width, height) * 0.3
            nodePositions.set(node.id, {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            })
        })
    }

    const getNodeColor = (node: Node) => {
        // High risk users (avg risk score > 70) - HIGHEST PRIORITY
        if (node.avgRiskScore > 70) return '#dc2626' // Red
        
        // Medium risk users (avg risk score > 40) - HIGH PRIORITY
        if (node.avgRiskScore > 40) return '#f59e0b' // Orange
        
        // Net senders vs receivers - ONLY FOR LOW RISK USERS
        if (node.totalSent > node.totalReceived) return '#3b82f6' // Blue for net senders
        if (node.totalReceived > node.totalSent) return '#22c55e' // Green for net receivers
        
        return '#6b7280' // Gray for balanced users
    }

    const getNodeSize = (node: Node) => {
        if (!data?.nodes || data.nodes.length === 0) return 8
        const maxTransactions = Math.max(...data.nodes.map(n => n.transactionCount))
        const minSize = 8
        const maxSize = 25
        return minSize + (node.transactionCount / maxTransactions) * (maxSize - minSize)
    }

    const getLinkColor = (link: Link) => {
        // High risk links (avg risk score > 70) - HIGHEST PRIORITY
        if (link.avgRiskScore > 70) return '#dc2626' // Red
        
        // Medium risk links (avg risk score > 40) - HIGH PRIORITY  
        if (link.avgRiskScore > 40) return '#f59e0b' // Orange
        
        // Known patterns - ONLY FOR LOW RISK LINKS
        if (link.isKnownPattern) return '#22c55e' // Green for known patterns
        
        return '#94a3b8' // Gray for normal
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Fraud Detection Network Map</h3>
                    <p className="text-sm text-slate-600">Visualize fraud detection attempts and suspicious patterns</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{data.summary.totalNodes} Users</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>{data.summary.totalLinks} Links</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{data.summary.totalTransactions.toLocaleString()} Total Transactions</span>
                    </div>
                    {data.summary.fraudDetectionAttempts > 0 && (
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-500">{data.summary.fraudDetectionAttempts} Fraud Attempts</span>
                        </div>
                    )}
                    {data.summary.highRiskFraudAttempts > 0 && (
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-red-500">{data.summary.highRiskFraudAttempts} High Risk</span>
                        </div>
                    )}
                    {data.summary.knownPatterns > 0 && (
                        <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-green-500">{data.summary.knownPatterns} Patterns</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs text-slate-500">All Time</span>
                    </div>
                </div>
            </div>

            {/* Network Map */}
            <Card className="p-6">
                <div className="relative bg-slate-50 rounded-lg overflow-hidden" style={{ width, height }} ref={containerRef}>
                    {/* Zoom Controls */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-slate-100 rounded transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-slate-100 rounded transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="p-2 hover:bg-slate-100 rounded transition-colors"
                            title="Reset Zoom"
                        >
                            <RotateCcw className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="text-xs text-slate-500 text-center font-medium">
                            {Math.round(zoom * 100)}%
                        </div>
                    </div>

                    {/* Pan Instructions */}
                    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Move className="w-3 h-3" />
                            <span>Drag to pan • Scroll to zoom</span>
                        </div>
                    </div>

                    <svg
                        ref={svgRef}
                        width={width}
                        height={height}
                        className="absolute inset-0 cursor-move"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                            {/* Draw links */}
                        {data?.links?.map((link, index) => {
                            const sourcePos = nodePositions.get(link.source)
                            const targetPos = nodePositions.get(link.target)
                            
                            if (!sourcePos || !targetPos) return null

                            const isHighlighted = selectedLink?.source === link.source && selectedLink?.target === link.target ||
                                              hoveredNode?.id === link.source || hoveredNode?.id === link.target
                            const linkColor = getLinkColor(link)
                            const strokeWidth = Math.max(1, Math.min(8, Math.log(link.count + 1) * 2))

                            return (
                                <g key={index}>
                                    {/* Transaction line with animation for high-value transactions */}
                                    <line
                                        x1={sourcePos.x}
                                        y1={sourcePos.y}
                                        x2={targetPos.x}
                                        y2={targetPos.y}
                                        stroke={isHighlighted ? '#1e40af' : linkColor}
                                        strokeWidth={strokeWidth}
                                        strokeOpacity={isHighlighted ? 1 : 0.8}
                                        strokeDasharray={link.isKnownPattern ? '5,5' : link.avgAmount > 50000 ? '10,5' : 'none'}
                                        className="cursor-pointer transition-all duration-200"
                                        onMouseEnter={() => setSelectedLink(link)}
                                        onMouseLeave={() => setSelectedLink(null)}
                                    />
                                    
                                    {/* Direction arrow for transfers */}
                                    {link.transactions.some(t => t.type === 'TRANSFER') && (
                                        <g>
                                            <defs>
                                                <marker
                                                    id={`arrowhead-${index}`}
                                                    markerWidth="10"
                                                    markerHeight="7"
                                                    refX="9"
                                                    refY="3.5"
                                                    orient="auto"
                                                >
                                                    <polygon
                                                        points="0 0, 10 3.5, 0 7"
                                                        fill={linkColor}
                                                    />
                                                </marker>
                                            </defs>
                                            <line
                                                x1={sourcePos.x}
                                                y1={sourcePos.y}
                                                x2={targetPos.x}
                                                y2={targetPos.y}
                                                stroke={linkColor}
                                                strokeWidth="1"
                                                markerEnd={`url(#arrowhead-${index})`}
                                                strokeOpacity="0.5"
                                            />
                                        </g>
                                    )}
                                    
                                    {/* Transaction count badge */}
                                    {link.count > 1 && (
                                        <circle
                                            cx={(sourcePos.x + targetPos.x) / 2}
                                            cy={(sourcePos.y + targetPos.y) / 2}
                                            r={Math.min(12, 6 + Math.log(link.count))}
                                            fill="white"
                                            stroke={linkColor}
                                            strokeWidth="2"
                                            className="pointer-events-none"
                                        />
                                    )}
                                    
                                    {/* Transaction count text */}
                                    {link.count > 1 && (
                                        <text
                                            x={(sourcePos.x + targetPos.x) / 2}
                                            y={(sourcePos.y + targetPos.y) / 2}
                                            fill={linkColor}
                                            fontSize="10"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none"
                                        >
                                            {link.count}
                                        </text>
                                    )}
                                    
                                    {/* Known pattern indicator */}
                                    {link.isKnownPattern && (
                                        <>
                                            <circle
                                                cx={(sourcePos.x + targetPos.x) / 2 + 15}
                                                cy={(sourcePos.y + targetPos.y) / 2 - 15}
                                                r="8"
                                                fill="#22c55e"
                                                fillOpacity="0.9"
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-none"
                                            />
                                            <text
                                                x={(sourcePos.x + targetPos.x) / 2 + 15}
                                                y={(sourcePos.y + targetPos.y) / 2 - 15}
                                                fill="white"
                                                fontSize="10"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                ✓
                                            </text>
                                        </>
                                    )}
                                    
                                    {/* High risk indicator on links */}
                                    {link.avgRiskScore > 70 && (
                                        <>
                                            <circle
                                                cx={(sourcePos.x + targetPos.x) / 2 - 15}
                                                cy={(sourcePos.y + targetPos.y) / 2 - 15}
                                                r="8"
                                                fill="#dc2626"
                                                fillOpacity="0.9"
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-none animate-pulse"
                                            />
                                            <text
                                                x={(sourcePos.x + targetPos.x) / 2 - 15}
                                                y={(sourcePos.y + targetPos.y) / 2 - 15}
                                                fill="white"
                                                fontSize="10"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                ⚠
                                            </text>
                                        </>
                                    )}
                                    
                                    {/* Medium risk indicator on links */}
                                    {link.avgRiskScore > 40 && link.avgRiskScore <= 70 && (
                                        <>
                                            <circle
                                                cx={(sourcePos.x + targetPos.x) / 2 - 15}
                                                cy={(sourcePos.y + targetPos.y) / 2 - 15}
                                                r="6"
                                                fill="#f59e0b"
                                                fillOpacity="0.9"
                                                stroke="white"
                                                strokeWidth="1"
                                                className="pointer-events-none"
                                            />
                                            <text
                                                x={(sourcePos.x + targetPos.x) / 2 - 15}
                                                y={(sourcePos.x + targetPos.y) / 2 - 15}
                                                fill="white"
                                                fontSize="8"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                !
                                            </text>
                                        </>
                                    )}
                                </g>
                            )
                        })}

                        {/* Draw nodes */}
                        {data?.nodes?.map((node) => {
                            const pos = nodePositions.get(node.id)
                            if (!pos) return null

                            const isHighlighted = selectedNode?.id === node.id || hoveredNode?.id === node.id
                            const nodeColor = getNodeColor(node)
                            const nodeSize = getNodeSize(node)

                            return (
                                <g key={node.id}>
                                    {/* Node glow effect for high activity users */}
                                    {node.transactionCount > 10 && (
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={nodeSize + 4}
                                            fill={nodeColor}
                                            fillOpacity="0.2"
                                            className="animate-pulse"
                                        />
                                    )}
                                    
                                    {/* Node circle */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={nodeSize}
                                        fill={nodeColor}
                                        stroke={isHighlighted ? '#1e40af' : '#fff'}
                                        strokeWidth={isHighlighted ? 3 : 2}
                                        className="cursor-pointer transition-all duration-200 hover:opacity-80"
                                        onMouseEnter={() => setHoveredNode(node)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                        onClick={() => setSelectedNode(node)}
                                    />
                                    
                                    {/* Node initials */}
                                    <text
                                        x={pos.x}
                                        y={pos.y}
                                        fill="white"
                                        fontSize={Math.max(8, nodeSize / 2)}
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="pointer-events-none select-none"
                                    >
                                        {node.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </text>
                                    
                                    {/* High risk indicator with pulsing effect */}
                                    {node.avgRiskScore > 70 && (
                                        <>
                                            {/* Outer pulsing ring */}
                                            <circle
                                                cx={pos.x}
                                                cy={pos.y}
                                                r={nodeSize + 10}
                                                fill="none"
                                                stroke="#dc2626"
                                                strokeWidth="3"
                                                strokeOpacity="0.8"
                                                className="pointer-events-none animate-pulse"
                                            />
                                            {/* Warning badge background */}
                                            <circle
                                                cx={pos.x + nodeSize - 2}
                                                cy={pos.y - nodeSize + 2}
                                                r="8"
                                                fill="#dc2626"
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-none animate-pulse"
                                            />
                                            {/* Warning icon */}
                                            <text
                                                x={pos.x + nodeSize - 2}
                                                y={pos.y - nodeSize + 2}
                                                fill="white"
                                                fontSize="12"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                !
                                            </text>
                                            {/* Risk score label */}
                                            <rect
                                                x={pos.x - 25}
                                                y={pos.y + nodeSize + 8}
                                                width="50"
                                                height="16"
                                                fill="#dc2626"
                                                rx="2"
                                                className="pointer-events-none"
                                            />
                                            <text
                                                x={pos.x}
                                                y={pos.y + nodeSize + 18}
                                                fill="white"
                                                fontSize="9"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                HIGH RISK
                                            </text>
                                        </>
                                    )}
                                    
                                    {/* Medium risk indicator */}
                                    {node.avgRiskScore > 40 && node.avgRiskScore <= 70 && (
                                        <>
                                            <circle
                                                cx={pos.x + nodeSize - 2}
                                                cy={pos.y - nodeSize + 2}
                                                r="6"
                                                fill="#f59e0b"
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-none"
                                            />
                                            <text
                                                x={pos.x + nodeSize - 2}
                                                y={pos.y - nodeSize + 2}
                                                fill="white"
                                                fontSize="10"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                !
                                            </text>
                                        </>
                                    )}
                                    
                                    {/* Recent activity indicator */}
                                    {node.lastTransactionDate && 
                                     (Date.now() - new Date(node.lastTransactionDate).getTime()) < 24 * 60 * 60 * 1000 && (
                                        <>
                                            <circle
                                                cx={pos.x - nodeSize + 2}
                                                cy={pos.y - nodeSize + 2}
                                                r="6"
                                                fill="#22c55e"
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-none animate-pulse"
                                            />
                                            <text
                                                x={pos.x - nodeSize + 2}
                                                y={pos.y - nodeSize + 2}
                                                fill="white"
                                                fontSize="8"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="pointer-events-none select-none"
                                            >
                                                •
                                            </text>
                                        </>
                                    )}
                                </g>
                            )
                        })}
                        </g>
                    </svg>

                    {/* Enhanced Legend with Minimize Option */}
                    <div className={`absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 transition-all duration-300 ${isLegendMinimized ? 'p-2' : 'p-4 max-w-xs'}`}>
                        {/* Legend Header with Minimize Toggle */}
                        <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-semibold text-slate-900 ${isLegendMinimized ? 'text-sm' : 'text-sm'}`}>
                                {isLegendMinimized ? '📊 Legend' : 'Legend'}
                            </h4>
                            <button
                                onClick={() => setIsLegendMinimized(!isLegendMinimized)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                                title={isLegendMinimized ? 'Expand Legend' : 'Minimize Legend'}
                            >
                                {isLegendMinimized ? '↗' : '↘'}
                            </button>
                        </div>
                        
                        {!isLegendMinimized && (
                            <>
                                {/* Node Types */}
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-slate-700 mb-2">User Risk Levels</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                                <div className="absolute inset-0 w-5 h-5 rounded-full border-2 border-red-600 animate-pulse opacity-60 -mt-1 -ml-1"></div>
                                            </div>
                                            <span>High Risk Fraud (avg risk {'>'} 70)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-600 border border-white"></div>
                                            </div>
                                            <span>Suspicious Activity (avg risk {'>'} 40)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span>Net Sender (sent {'>'} received)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>Net Receiver (received {'>'} sent)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                                            <span>Normal Activity</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Link Types */}
                                <div className="mb-3">
                                    <p className="text-xs font-medium text-slate-700 mb-2">Suspicious Transaction Links</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t-2 border-green-500 border-dashed"></div>
                                            <span>Known Safe Pattern</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t-2 border-gray-400"></div>
                                            <span>Normal Transaction</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t-2 border-red-500"></div>
                                            <span>High Fraud Risk (avg risk {'>'} 70)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t-2 border-orange-500"></div>
                                            <span>Suspicious (avg risk {'>'} 40)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t-2 border-blue-300"></div>
                                            <span>High Value ({'>'} ₹50,000)</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Indicators */}
                                <div>
                                    <p className="text-xs font-medium text-slate-700 mb-2">Fraud Detection Indicators</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-500 font-bold">✓</span>
                                            <span>Known Safe Pattern</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-bold">⚠</span>
                                            <span>High Fraud Risk Alert</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                            <span>Recent Activity (24h)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">!</div>
                                            </div>
                                            <span>High Fraud Risk Badge</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">!</div>
                                            </div>
                                            <span>Suspicious Activity Alert</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-blue-500 flex items-center justify-center text-xs font-bold">2</div>
                                            <span>Transaction Count</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 border-t border-gray-400" style={{borderTopWidth: '2px'}}></div>
                                            <span>Direction Arrow</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>

            {/* Transaction Details Panel */}
            {(selectedNode || selectedLink) && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {selectedNode ? 'User Fraud Analysis' : 'Suspicious Transaction Details'}
                        </h3>
                        <button
                            onClick={() => {
                                setSelectedNode(null)
                                setSelectedLink(null)
                            }}
                            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {selectedNode && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-600">Name</p>
                                    <p className="font-medium text-slate-900">{selectedNode.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="font-medium text-slate-900">{selectedNode.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Balance</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedNode.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Transactions</p>
                                    <p className="font-medium text-slate-900">{selectedNode.transactionCount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Total Sent</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedNode.totalSent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Total Received</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedNode.totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Avg Risk Score</p>
                                    <p className={`font-medium ${
                                        selectedNode.avgRiskScore > 70 ? 'text-red-600' :
                                        selectedNode.avgRiskScore > 40 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                        {selectedNode.avgRiskScore.toFixed(1)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">High Risk Fraud Attempts</p>
                                    <p className="font-medium text-slate-900">{selectedNode.highRiskTransactions}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Avg Transaction</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedNode.avgTransactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Join Date</p>
                                    <p className="font-medium text-slate-900">
                                        {new Date(selectedNode.joinDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Known Patterns */}
                            {(selectedNode.knownRecipients.length > 0 || selectedNode.knownAmounts.length > 0) && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Transaction Pattern Analysis</h4>
                                    {selectedNode.knownRecipients.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-xs text-slate-600 mb-1">Frequent Recipients ({selectedNode.knownRecipients.length})</p>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedNode.knownRecipients.slice(0, 3).map((recipient, i) => (
                                                    <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                                        {recipient}
                                                    </span>
                                                ))}
                                                {selectedNode.knownRecipients.length > 3 && (
                                                    <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded">
                                                        +{selectedNode.knownRecipients.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedNode.knownAmounts.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-600 mb-1">Common Transaction Amounts</p>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedNode.knownAmounts.map((amount, i) => (
                                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                                        ₹{amount.toLocaleString()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Last Transaction */}
                            {selectedNode.lastTransactionDate && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Last transaction: {new Date(selectedNode.lastTransactionDate).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {selectedLink && (
                        <div className="space-y-3">
                            <div className="mb-4">
                                <p className="text-sm text-slate-600 mb-1">Suspicious Transaction Link</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <span>From:</span>
                                    <span className="font-medium">{selectedLink.senderName || selectedLink.transactions[0]?.senderName}</span>
                                    <span className="text-slate-400">({selectedLink.transactions[0]?.senderEmail})</span>
                                    <ArrowRight className="w-4 h-4" />
                                    <span className="font-medium">{selectedLink.receiverName || data.nodes.find(n => n.id === selectedLink.target)?.name}</span>
                                    <span className="text-slate-400">({selectedLink.transactions[0]?.receiverEmail})</span>
                                </div>
                            </div>

                            {/* Link Statistics */}
                            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-slate-600">Transaction Count</p>
                                    <p className="font-medium text-slate-900">{selectedLink.count}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Total Amount</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedLink.totalAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Average Amount</p>
                                    <p className="font-medium text-slate-900">
                                        ₹{selectedLink.avgAmount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Avg Risk Score</p>
                                    <p className={`font-medium ${
                                        selectedLink.avgRiskScore > 70 ? 'text-red-600' :
                                        selectedLink.avgRiskScore > 40 ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                        {selectedLink.avgRiskScore.toFixed(1)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Frequency</p>
                                    <p className={`font-medium ${
                                        selectedLink.frequency === 'high' ? 'text-red-600' :
                                        selectedLink.frequency === 'medium' ? 'text-orange-600' : 'text-green-600'
                                    }`}>
                                        {selectedLink.frequency}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600">Pattern</p>
                                    <p className={`font-medium ${
                                        selectedLink.isKnownPattern ? 'text-green-600' : 'text-slate-600'
                                    }`}>
                                        {selectedLink.isKnownPattern ? 'Known' : 'New'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                                    Suspicious Transactions ({selectedLink.count})
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {selectedLink.transactions.slice(0, 10).map((transaction, index) => (
                                        <div key={transaction.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-sm font-medium ${
                                                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {transaction.type === 'INCOME' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-700">{transaction.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                    transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {transaction.status}
                                                </span>
                                                {transaction.riskScore > 0 && (
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                        transaction.riskScore > 70 ? 'bg-red-100 text-red-700' :
                                                        transaction.riskScore > 40 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        Risk: {transaction.riskScore}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Last Transaction */}
                            {selectedLink.lastTransaction && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Last transaction: {new Date(selectedLink.lastTransaction).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}
