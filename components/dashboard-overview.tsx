"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  Zap,
} from "lucide-react"
import { api } from "@/lib/api"
import type { Bond, Order, Position } from "@/data/bonds"

interface DashboardMetrics {
  totalPortfolioValue: number
  totalPnL: number
  dayChange: number
  dayChangePercent: number
  activeOrders: number
  executedToday: number
  topPerformer: { ticker: string; pnl: number } | null
  worstPerformer: { ticker: string; pnl: number } | null
  marketStatus: "OPEN" | "CLOSED" | "PRE_MARKET"
}

interface MarketAlert {
  id: string
  type: "PRICE" | "YIELD" | "EXECUTION" | "RISK"
  severity: "LOW" | "MEDIUM" | "HIGH"
  message: string
  timestamp: string
  bondTicker?: string
}

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPortfolioValue: 0,
    totalPnL: 0,
    dayChange: 0,
    dayChangePercent: 0,
    activeOrders: 0,
    executedToday: 0,
    topPerformer: null,
    worstPerformer: null,
    marketStatus: "OPEN",
  })
  const [alerts, setAlerts] = useState<MarketAlert[]>([])
  const [topBonds, setTopBonds] = useState<Bond[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    // Real-time updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [bonds, orders, positions] = await Promise.all([api.getBonds(), api.getOrders(), api.getPositions()])

      // Calculate metrics
      const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0)
      const totalPnL = positions.reduce((sum, pos) => sum + pos.totalPnL, 0)
      const dayChange = totalPnL * 0.1 // Simulated daily change
      const activeOrders = orders.filter((o) => o.status === "PENDING").length
      const executedToday = orders.filter(
        (o) => o.status === "EXECUTED" && new Date(o.timestamp).toDateString() === new Date().toDateString(),
      ).length

      // Find top/worst performers
      const performers = positions
        .map((pos) => {
          const bond = bonds.find((b) => b.id === pos.bondId)
          return { ticker: bond?.ticker || pos.bondId, pnl: pos.totalPnL }
        })
        .sort((a, b) => b.pnl - a.pnl)

      setMetrics({
        totalPortfolioValue: totalValue,
        totalPnL,
        dayChange,
        dayChangePercent: totalValue > 0 ? (dayChange / totalValue) * 100 : 0,
        activeOrders,
        executedToday,
        topPerformer: performers[0] || null,
        worstPerformer: performers[performers.length - 1] || null,
        marketStatus: "OPEN",
      })

      // Set top bonds and recent orders
      setTopBonds(bonds.slice(0, 5))
      setRecentOrders(orders.slice(0, 3))

      // Generate sample alerts
      generateAlerts(bonds, orders, positions)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      setLoading(false)
    }
  }

  const generateAlerts = (bonds: Bond[], orders: Order[], positions: Position[]) => {
    const newAlerts: MarketAlert[] = []

    // Price movement alerts
    bonds.forEach((bond) => {
      const priceChange = (Math.random() - 0.5) * 2
      if (Math.abs(priceChange) > 1) {
        newAlerts.push({
          id: `price-${bond.id}`,
          type: "PRICE",
          severity: Math.abs(priceChange) > 1.5 ? "HIGH" : "MEDIUM",
          message: `${bond.ticker} moved ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`,
          timestamp: new Date().toISOString(),
          bondTicker: bond.ticker,
        })
      }
    })

    // Order execution alerts
    orders
      .filter((o) => o.status === "EXECUTED")
      .slice(0, 2)
      .forEach((order) => {
        const bond = bonds.find((b) => b.id === order.bondId)
        newAlerts.push({
          id: `exec-${order.id}`,
          type: "EXECUTION",
          severity: "LOW",
          message: `${order.type} order executed: ${order.quantity} ${bond?.ticker}`,
          timestamp: order.timestamp,
          bondTicker: bond?.ticker,
        })
      })

    // Risk alerts
    positions.forEach((pos) => {
      if (pos.totalPnL < -5000) {
        const bond = bonds.find((b) => b.id === pos.bondId)
        newAlerts.push({
          id: `risk-${pos.bondId}`,
          type: "RISK",
          severity: "HIGH",
          message: `Large loss in ${bond?.ticker}: ${(pos.totalPnL).toFixed(0)}`,
          timestamp: new Date().toISOString(),
          bondTicker: bond?.ticker,
        })
      }
    })

    setAlerts(newAlerts.slice(0, 5))
  }

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `${value < 0 ? "-" : ""}$${(absValue / 1000000).toFixed(1)}M`
    }
    if (absValue >= 1000) {
      return `${value < 0 ? "-" : ""}$${(absValue / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "PRICE":
        return <TrendingUp className="h-4 w-4" />
      case "EXECUTION":
        return <CheckCircle className="h-4 w-4" />
      case "RISK":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "border-red-500 bg-red-500/10"
      case "MEDIUM":
        return "border-yellow-500 bg-yellow-500/10"
      default:
        return "border-blue-500 bg-blue-500/10"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Market Status Bar */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold">MARKET OPEN</span>
              </div>
              <div className="text-slate-400 text-sm">Last Update: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">
                Active Orders: <span className="text-yellow-400">{metrics.activeOrders}</span>
              </span>
              <span className="text-slate-400">
                Executed Today: <span className="text-green-400">{metrics.executedToday}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Portfolio Value</div>
                    <div className="text-3xl font-bold text-white">{formatCurrency(metrics.totalPortfolioValue)}</div>
                    <div
                      className={`text-sm flex items-center ${metrics.dayChange >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {metrics.dayChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {formatCurrency(metrics.dayChange)} ({metrics.dayChangePercent.toFixed(2)}%)
                    </div>
                  </div>
                  <DollarSign className="h-12 w-12 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Total P&L</div>
                    <div className={`text-3xl font-bold ${metrics.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(metrics.totalPnL)}
                    </div>
                    <div className="text-sm text-slate-400">{metrics.totalPnL >= 0 ? "Profit" : "Loss"}</div>
                  </div>
                  <Activity className="h-12 w-12 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Performance Leaders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.topPerformer && (
                  <div className="bg-slate-800 p-4 rounded border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Top Performer</div>
                        <div className="text-white font-semibold">{metrics.topPerformer.ticker}</div>
                      </div>
                      <div className="text-green-400 font-bold">{formatCurrency(metrics.topPerformer.pnl)}</div>
                    </div>
                  </div>
                )}
                {metrics.worstPerformer && (
                  <div className="bg-slate-800 p-4 rounded border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400">Needs Attention</div>
                        <div className="text-white font-semibold">{metrics.worstPerformer.ticker}</div>
                      </div>
                      <div className="text-red-400 font-bold">{formatCurrency(metrics.worstPerformer.pnl)}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const bond = topBonds.find((b) => b.id === order.bondId)
                  return (
                    <div key={order.id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                      <div className="flex items-center gap-3">
                        {order.status === "EXECUTED" ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : order.status === "CANCELLED" ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-400" />
                        )}
                        <div>
                          <div className="text-white font-medium">
                            {order.type} {order.quantity} {bond?.ticker}
                          </div>
                          <div className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <Badge
                        className={
                          order.status === "EXECUTED"
                            ? "bg-green-600"
                            : order.status === "CANCELLED"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Market Data */}
        <div className="space-y-6">
          {/* Market Alerts */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-400">Market Alerts</CardTitle>
                <Bell className="h-5 w-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">No active alerts</div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded border ${getAlertColor(alert.severity)}`}>
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="text-white text-sm">{alert.message}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Bonds */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Market Movers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBonds.map((bond) => {
                  const priceChange = (Math.random() - 0.5) * 2
                  return (
                    <div key={bond.id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                      <div>
                        <div className="text-white font-medium">{bond.ticker}</div>
                        <div className="text-xs text-slate-400">{bond.issuer}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">${bond.currentPrice.toFixed(2)}</div>
                        <div className={`text-xs ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {priceChange >= 0 ? "+" : ""}
                          {priceChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-blue-400">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Buy
                </Button>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Sell
                </Button>
                <Button variant="outline" className="w-full border-slate-600 hover:bg-slate-800 bg-transparent">
                  View All Positions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
