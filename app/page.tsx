"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardOverview } from "@/components/dashboard-overview"
import { MarketWatchScreen } from "@/components/market-watch-screen"
import { OrderExecutionWindow } from "@/components/order-execution-window"
import { TradeManagementWindow } from "@/components/trade-management-window"
import { NetPositionWindow } from "@/components/net-position-window"

export default function TradingDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">Fixed Income Markets - Order Execution System</h1>
          <p className="text-slate-400">Professional trading platform for broker-dealers</p>
        </div>

        {/* Main Trading Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-900 border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="market-watch"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Market Watch
            </TabsTrigger>
            <TabsTrigger
              value="order-execution"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Order Execution
            </TabsTrigger>
            <TabsTrigger
              value="trade-management"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Trade Management
            </TabsTrigger>
            <TabsTrigger
              value="net-position"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Net Position
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="market-watch" className="mt-6">
            <MarketWatchScreen />
          </TabsContent>

          <TabsContent value="order-execution" className="mt-6">
            <OrderExecutionWindow />
          </TabsContent>

          <TabsContent value="trade-management" className="mt-6">
            <TradeManagementWindow />
          </TabsContent>

          <TabsContent value="net-position" className="mt-6">
            <NetPositionWindow />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
