"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  RefreshCw,
  AlertCircle,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Bond, Position } from "@/data/bonds";

interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  dayChange: number;
  dayChangePercent: number;
  weightedAvgYield: number;
  weightedAvgDuration: number;
  totalPositions: number;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  pnl: number;
}

export function NetPositionWindow() {
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState<
    "FIFO" | "LIFO" | "WAP"
  >("WAP");
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics>({
    totalValue: 0,
    totalPnL: 0,
    totalUnrealizedPnL: 0,
    totalRealizedPnL: 0,
    dayChange: 0,
    dayChangePercent: 0,
    weightedAvgYield: 0,
    weightedAvgDuration: 0,
    totalPositions: 0,
  });
  const [sectorAllocations, setSectorAllocations] = useState<
    SectorAllocation[]
  >([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/execution-engine").then(({ ExecutionEngine }) => {
        ExecutionEngine.setCalculationMethod(calculationMethod);
      });
    }
  }, [calculationMethod]);

  useEffect(() => {
    calculatePortfolioMetrics();
  }, [positions, bonds]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bondsData, positionsData] = await Promise.all([
        api.getBonds(),
        api.getPositions(),
      ]);
      setBonds(bondsData);
      setPositions(positionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioMetrics = () => {
    if (positions.length === 0 || bonds.length === 0) return;

    let totalValue = 0;
    let totalUnrealizedPnL = 0;
    let totalRealizedPnL = 0;
    let weightedYieldSum = 0;
    let weightedDurationSum = 0;
    const sectorMap = new Map<string, { value: number; pnl: number }>();

    positions.forEach((position) => {
      const bond = bonds.find(
        (b) => b.ticker === position.ticker || b.id === position.bondId
      );
      if (!bond) return;

      totalValue += position.marketValue;
      totalUnrealizedPnL += position.unrealizedPnL;
      totalRealizedPnL += position.realizedPnL;

      // Weighted averages
      weightedYieldSum += bond.yieldToMaturity * position.marketValue;
      weightedDurationSum += bond.modifiedDuration * position.marketValue;

      // Sector allocation
      const existing = sectorMap.get(bond.sector) || { value: 0, pnl: 0 };
      sectorMap.set(bond.sector, {
        value: existing.value + position.marketValue,
        pnl:
          existing.pnl +
          (position.totalPnL || position.unrealizedPnL + position.realizedPnL),
      });
    });

    const totalPnL = totalUnrealizedPnL + totalRealizedPnL;
    const dayChange = totalUnrealizedPnL * 0.1; // Simulated daily change
    const dayChangePercent =
      totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    setPortfolioMetrics({
      totalValue,
      totalPnL,
      totalUnrealizedPnL,
      totalRealizedPnL,
      dayChange,
      dayChangePercent,
      weightedAvgYield: totalValue > 0 ? weightedYieldSum / totalValue : 0,
      weightedAvgDuration:
        totalValue > 0 ? weightedDurationSum / totalValue : 0,
      totalPositions: positions.length,
    });

    // Calculate sector allocations
    const allocations: SectorAllocation[] = Array.from(sectorMap.entries()).map(
      ([sector, data]) => ({
        sector,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        pnl: data.pnl,
      })
    );

    setSectorAllocations(allocations.sort((a, b) => b.value - a.value));
  };

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${value < 0 ? "-" : ""}$${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${value < 0 ? "-" : ""}$${(absValue / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const getPnLColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-slate-400";
  };

  const getPnLIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">
                  Total Portfolio Value
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(portfolioMetrics.totalValue)}
                </div>
                <div
                  className={`text-sm flex items-center ${getPnLColor(
                    portfolioMetrics.dayChange
                  )}`}
                >
                  {getPnLIcon(portfolioMetrics.dayChange)}
                  <span className="ml-1">
                    {formatCurrency(portfolioMetrics.dayChange)} (
                    {formatPercentage(portfolioMetrics.dayChangePercent)})
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total P&L</div>
                <div
                  className={`text-2xl font-bold ${getPnLColor(
                    portfolioMetrics.totalPnL
                  )}`}
                >
                  {formatCurrency(portfolioMetrics.totalPnL)}
                </div>
                <div className="text-xs text-slate-500">
                  Realized: {formatCurrency(portfolioMetrics.totalRealizedPnL)}
                </div>
              </div>
              {portfolioMetrics.totalPnL > 0 ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Weighted Avg Yield</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatPercentage(portfolioMetrics.weightedAvgYield)}
                </div>
                <div className="text-xs text-slate-500">
                  Duration: {portfolioMetrics.weightedAvgDuration.toFixed(2)}
                </div>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Active Positions</div>
                <div className="text-2xl font-bold text-purple-400">
                  {portfolioMetrics.totalPositions}
                </div>
                <div className="text-xs text-slate-500">Instruments</div>
              </div>
              <PieChart className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-400">
              Net Position Analysis
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select
                value={calculationMethod}
                onValueChange={(value: any) => setCalculationMethod(value)}
              >
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="WAP">WAP</SelectItem>
                  <SelectItem value="FIFO">FIFO</SelectItem>
                  <SelectItem value="LIFO">LIFO</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="border-slate-600 hover:bg-slate-800 bg-transparent"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="positions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
              <TabsTrigger
                value="positions"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white"
              >
                Position Details
              </TabsTrigger>
              <TabsTrigger
                value="sectors"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white"
              >
                Sector Allocation
              </TabsTrigger>
              <TabsTrigger
                value="risk"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white"
              >
                Risk Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="mt-6">
              <div className="space-y-4">
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    No positions found
                  </div>
                ) : (
                  positions.map((position) => {
                    const bond = bonds.find(
                      (b) =>
                        b.ticker === position.ticker || b.id === position.bondId
                    );
                    if (!bond) return null;

                    const pnlPercentage =
                      position.averagePrice > 0
                        ? ((position.totalPnL ||
                            position.unrealizedPnL + position.realizedPnL) /
                            (position.averagePrice * position.quantity)) *
                          100
                        : 0;

                    return (
                      <Card
                        key={position.ticker || position.bondId}
                        className="bg-slate-800 border-slate-600"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-semibold text-white text-lg">
                                  {bond.ticker}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  {bond.issuer}
                                </div>
                              </div>
                              <Badge className="bg-blue-600 text-white">
                                {bond.sector}
                              </Badge>
                              <Badge className="bg-green-600 text-white">
                                {bond.rating}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${getPnLColor(
                                  position.totalPnL ||
                                    position.unrealizedPnL +
                                      position.realizedPnL
                                )}`}
                              >
                                {formatCurrency(
                                  position.totalPnL ||
                                    position.unrealizedPnL +
                                      position.realizedPnL
                                )}
                              </div>
                              <div
                                className={`text-sm ${getPnLColor(
                                  pnlPercentage
                                )}`}
                              >
                                {formatPercentage(pnlPercentage)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                            <div>
                              <span className="text-slate-400 text-sm">
                                Quantity:
                              </span>
                              <div className="text-white font-semibold">
                                {position.quantity.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">
                                Avg Price:
                              </span>
                              <div className="text-white font-semibold">
                                ${position.averagePrice.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">
                                Current Price:
                              </span>
                              <div className="text-white font-semibold">
                                $
                                {(
                                  position.currentPrice || bond.currentPrice
                                ).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">
                                Market Value:
                              </span>
                              <div className="text-white font-semibold">
                                {formatCurrency(position.marketValue)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">
                                Unrealized P&L:
                              </span>
                              <div
                                className={`font-semibold ${getPnLColor(
                                  position.unrealizedPnL
                                )}`}
                              >
                                {formatCurrency(position.unrealizedPnL)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 text-sm">
                                Realized P&L:
                              </span>
                              <div
                                className={`font-semibold ${getPnLColor(
                                  position.realizedPnL
                                )}`}
                              >
                                {formatCurrency(position.realizedPnL)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">YTM:</span>
                              <span className="text-blue-400 ml-2 font-semibold">
                                {formatPercentage(bond.yieldToMaturity)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Duration:</span>
                              <span className="text-purple-400 ml-2 font-semibold">
                                {bond.modifiedDuration.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">
                                Days to Maturity:
                              </span>
                              <span className="text-orange-400 ml-2 font-semibold">
                                {bond.daysToMaturity.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Weight:</span>
                              <span className="text-white ml-2 font-semibold">
                                {portfolioMetrics.totalValue > 0
                                  ? formatPercentage(
                                      (position.marketValue /
                                        portfolioMetrics.totalValue) *
                                        100
                                    )
                                  : "0.00%"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="sectors" className="mt-6">
              <div className="space-y-4">
                {sectorAllocations.map((allocation) => (
                  <Card
                    key={allocation.sector}
                    className="bg-slate-800 border-slate-600"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white">
                            {allocation.sector}
                          </div>
                          <Badge className="bg-blue-600 text-white">
                            {formatPercentage(allocation.percentage)}
                          </Badge>
                        </div>
                        <div
                          className={`font-semibold ${getPnLColor(
                            allocation.pnl
                          )}`}
                        >
                          {formatCurrency(allocation.pnl)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                        <span>
                          Market Value: {formatCurrency(allocation.value)}
                        </span>
                        <span>
                          {formatPercentage(allocation.percentage)} of portfolio
                        </span>
                      </div>
                      <Progress
                        value={allocation.percentage}
                        className="h-2 bg-slate-700"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-400">
                      Duration Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">
                          Portfolio Duration:
                        </span>
                        <span className="text-white font-semibold">
                          {portfolioMetrics.weightedAvgDuration.toFixed(2)}{" "}
                          years
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">
                          Interest Rate Risk:
                        </span>
                        <Badge
                          className={
                            portfolioMetrics.weightedAvgDuration > 7
                              ? "bg-red-600"
                              : portfolioMetrics.weightedAvgDuration > 4
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }
                        >
                          {portfolioMetrics.weightedAvgDuration > 7
                            ? "High"
                            : portfolioMetrics.weightedAvgDuration > 4
                            ? "Medium"
                            : "Low"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        1% rate change ≈{" "}
                        {(
                          portfolioMetrics.weightedAvgDuration *
                          portfolioMetrics.totalValue *
                          0.01
                        ).toFixed(0)}{" "}
                        impact
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-400">
                      Yield Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Portfolio Yield:</span>
                        <span className="text-yellow-400 font-semibold">
                          {formatPercentage(portfolioMetrics.weightedAvgYield)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Annual Income:</span>
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(
                            (portfolioMetrics.totalValue *
                              portfolioMetrics.weightedAvgYield) /
                              100
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        Based on current portfolio composition
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
