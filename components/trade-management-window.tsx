"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Edit3,
  X,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
} from "lucide-react"
import { api } from "@/lib/api"
import type { Bond, Order, Trade } from "@/data/bonds"
import { useToast } from "@/hooks/use-toast"

export function TradeManagementWindow() {
  const [bonds, setBonds] = useState<Bond[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [amendDialogOpen, setAmendDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()

  // Amendment form state
  const [amendQuantity, setAmendQuantity] = useState("")
  const [amendPrice, setAmendPrice] = useState("")
  const [amendStopLoss, setAmendStopLoss] = useState("")

  useEffect(() => {
    fetchData()
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bondsData, ordersData, tradesData] = await Promise.all([api.getBonds(), api.getOrders(), api.getTrades()])
      setBonds(bondsData)
      setOrders(ordersData)
      setTrades(tradesData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      const cancelledOrder = await api.cancelOrder(orderId)
      setOrders(orders.map((order) => (order.id === orderId ? cancelledOrder : order)))
      toast({
        title: "Order Cancelled",
        description: "Order has been successfully cancelled",
      })
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAmendOrder = async () => {
    if (!selectedOrder) return

    try {
      const amendData: Partial<Order> = {}
      if (amendQuantity) amendData.quantity = Number.parseFloat(amendQuantity)
      if (amendPrice) amendData.price = Number.parseFloat(amendPrice)
      if (amendStopLoss) amendData.stopLoss = Number.parseFloat(amendStopLoss)

      const amendedOrder = await api.updateOrder(selectedOrder.id, amendData)
      setOrders(orders.map((order) => (order.id === selectedOrder.id ? amendedOrder : order)))

      toast({
        title: "Order Amended",
        description: "Order has been successfully updated",
      })

      setAmendDialogOpen(false)
      setSelectedOrder(null)
      setAmendQuantity("")
      setAmendPrice("")
      setAmendStopLoss("")
    } catch (error) {
      toast({
        title: "Amendment Failed",
        description: "Failed to amend order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openAmendDialog = (order: Order) => {
    setSelectedOrder(order)
    setAmendQuantity(order.quantity.toString())
    setAmendPrice(order.price.toString())
    setAmendStopLoss(order.stopLoss?.toString() || "")
    setAmendDialogOpen(true)
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "PARTIAL":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />
      default:
        return <Clock className="h-4 w-4 text-blue-400" />
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return "bg-green-600"
      case "CANCELLED":
        return "bg-red-600"
      case "PENDING":
        return "bg-yellow-600"
      case "PARTIAL":
        return "bg-orange-600"
      default:
        return "bg-blue-600"
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false
    if (typeFilter !== "all" && order.type !== typeFilter) return false
    return true
  })

  const activeOrders = orders.filter((order) => order.status === "PENDING" || order.status === "PARTIAL")
  const completedOrders = orders.filter((order) => order.status === "EXECUTED")
  const cancelledOrders = orders.filter((order) => order.status === "CANCELLED")

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Active Orders</div>
                <div className="text-2xl font-bold text-yellow-400">{activeOrders.length}</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Completed</div>
                <div className="text-2xl font-bold text-green-400">{completedOrders.length}</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Cancelled</div>
                <div className="text-2xl font-bold text-red-400">{cancelledOrders.length}</div>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Orders</div>
                <div className="text-2xl font-bold text-blue-400">{orders.length}</div>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-400">Trade Management</CardTitle>
            <div className="flex items-center gap-4">
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="EXECUTED">Executed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-24 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="border-slate-600 hover:bg-slate-800 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
              <TabsTrigger value="orders" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Order Management
              </TabsTrigger>
              <TabsTrigger value="trades" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Trade History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-6">
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No orders found matching your criteria</div>
                ) : (
                  filteredOrders.map((order) => {
                    const bond = bonds.find((b) => b.id === order.bondId)
                    const canAmend = order.status === "PENDING" || order.status === "PARTIAL"
                    const canCancel = order.status === "PENDING"

                    return (
                      <Card key={order.id} className="bg-slate-800 border-slate-600">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {getOrderStatusIcon(order.status)}
                              <Badge className={`${getOrderStatusColor(order.status)} text-white`}>
                                {order.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`${
                                  order.type === "BUY"
                                    ? "border-green-500 text-green-400"
                                    : "border-red-500 text-red-400"
                                }`}
                              >
                                {order.type === "BUY" ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {order.type}
                              </Badge>
                              <span className="text-slate-400 text-sm">#{order.id}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {canAmend && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAmendDialog(order)}
                                  className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Amend
                                </Button>
                              )}
                              {canCancel && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <span className="text-slate-400 text-sm">Bond:</span>
                              <div className="text-white font-semibold">{bond?.ticker || order.bondId}</div>
                              <div className="text-slate-400 text-xs">{bond?.issuer}</div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">Quantity:</span>
                              <div className="text-white font-semibold">{order.quantity.toLocaleString()}</div>
                              {order.executedQuantity > 0 && (
                                <div className="text-green-400 text-xs">
                                  Executed: {order.executedQuantity.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">Price:</span>
                              <div className="text-white font-semibold">${order.price.toFixed(2)}</div>
                              {order.executedPrice && (
                                <div className="text-green-400 text-xs">Exec: ${order.executedPrice.toFixed(2)}</div>
                              )}
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">Order Type:</span>
                              <div className="text-white font-semibold">{order.orderType}</div>
                              <div className="text-slate-400 text-xs">
                                {new Date(order.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Additional Order Details */}
                          <div className="flex flex-wrap gap-4 text-xs">
                            {order.disclosedQuantity && (
                              <div className="flex items-center text-yellow-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Disclosed: {order.disclosedQuantity}
                              </div>
                            )}
                            {order.stopLoss && (
                              <div className="flex items-center text-red-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Stop Loss: ${order.stopLoss.toFixed(2)}
                              </div>
                            )}
                            {order.condition && (
                              <div className="flex items-center text-blue-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Condition: {order.condition}
                              </div>
                            )}
                          </div>

                          {/* Order Value */}
                          <Separator className="my-3 bg-slate-600" />
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Total Order Value:</span>
                            <span className="text-white font-semibold text-lg">
                              ${(order.quantity * order.price).toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="trades" className="mt-6">
              <div className="space-y-4">
                {trades.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">No trades executed yet</div>
                ) : (
                  trades.map((trade) => {
                    const bond = bonds.find((b) => b.id === trade.bondId)
                    return (
                      <Card key={trade.id} className="bg-slate-800 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`${
                                  trade.type === "BUY"
                                    ? "border-green-500 text-green-400"
                                    : "border-red-500 text-red-400"
                                }`}
                              >
                                {trade.type}
                              </Badge>
                              <Badge
                                className={`${trade.status === "OPEN" ? "bg-blue-600" : "bg-gray-600"} text-white`}
                              >
                                {trade.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">{new Date(trade.timestamp).toLocaleString()}</span>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Bond:</span>
                              <div className="text-white">{bond?.ticker || trade.bondId}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Quantity:</span>
                              <div className="text-white">{trade.quantity.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Price:</span>
                              <div className="text-white">${trade.price.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Value:</span>
                              <div className="text-white">${(trade.quantity * trade.price).toLocaleString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Amendment Dialog */}
      <Dialog open={amendDialogOpen} onOpenChange={setAmendDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Amend Order #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Quantity</Label>
                  <Input
                    type="number"
                    value={amendQuantity}
                    onChange={(e) => setAmendQuantity(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amendPrice}
                    onChange={(e) => setAmendPrice(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              {selectedOrder.stopLoss !== undefined && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Stop Loss ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amendStopLoss}
                    onChange={(e) => setAmendStopLoss(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAmendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAmendOrder} className="bg-blue-600 hover:bg-blue-700">
                  Update Order
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
