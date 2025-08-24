"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Search, TrendingUp, TrendingDown } from "lucide-react"
import { api } from "@/lib/api"
import type { Bond } from "@/data/bonds"

export function MarketWatchScreen() {
  const [bonds, setBonds] = useState<Bond[]>([])
  const [filteredBonds, setFilteredBonds] = useState<Bond[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchBonds = async () => {
    try {
      setLoading(true)
      const data = await api.getBonds()
      setBonds(data)
      setFilteredBonds(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to fetch bonds:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBonds()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBonds, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = bonds

    if (searchTerm) {
      filtered = filtered.filter(
        (bond) =>
          bond.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bond.issuer.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter((bond) => bond.sector === sectorFilter)
    }

    if (ratingFilter !== "all") {
      filtered = filtered.filter((bond) => bond.rating === ratingFilter)
    }

    setFilteredBonds(filtered)
  }, [bonds, searchTerm, sectorFilter, ratingFilter])

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const getRatingColor = (rating: string) => {
    if (rating.startsWith("AAA") || rating.startsWith("AA")) return "bg-green-600"
    if (rating.startsWith("A")) return "bg-blue-600"
    if (rating.startsWith("BBB")) return "bg-yellow-600"
    return "bg-red-600"
  }

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "Government":
        return "bg-blue-500"
      case "Technology":
        return "bg-purple-500"
      case "Financial":
        return "bg-green-500"
      case "Municipal":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const uniqueSectors = [...new Set(bonds.map((bond) => bond.sector))]
  const uniqueRatings = [...new Set(bonds.map((bond) => bond.rating))]

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-blue-400">Market Watch - Fixed Income Securities</CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchBonds}
                disabled={loading}
                className="border-slate-600 hover:bg-slate-800 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by ticker or issuer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white"
              />
            </div>

            {/* Sector Filter */}
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Sectors</SelectItem>
                {uniqueSectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Ratings</SelectItem>
                {uniqueRatings.map((rating) => (
                  <SelectItem key={rating} value={rating}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Market Data Table */}
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="text-left p-4 text-sm font-semibold text-slate-300">Instrument</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">Bid/Ask</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">Current Price</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">YTM</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">Current Yield</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">Duration</th>
                  <th className="text-right p-4 text-sm font-semibold text-slate-300">Days to Maturity</th>
                  <th className="text-center p-4 text-sm font-semibold text-slate-300">Characteristics</th>
                  <th className="text-center p-4 text-sm font-semibold text-slate-300">Key Dates</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map((bond, index) => (
                  <tr
                    key={bond.id}
                    className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${
                      index % 2 === 0 ? "bg-slate-900" : "bg-slate-850"
                    }`}
                  >
                    {/* Instrument Info */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-white">{bond.ticker}</div>
                        <div className="text-sm text-slate-400">{bond.issuer}</div>
                        <div className="flex gap-2">
                          <Badge className={`${getSectorColor(bond.sector)} text-white text-xs`}>{bond.sector}</Badge>
                          <Badge className={`${getRatingColor(bond.rating)} text-white text-xs`}>{bond.rating}</Badge>
                        </div>
                      </div>
                    </td>

                    {/* Bid/Ask */}
                    <td className="p-4 text-right">
                      <div className="space-y-1">
                        <div className="text-green-400 text-sm">
                          <TrendingUp className="inline h-3 w-3 mr-1" />
                          {formatCurrency(bond.bidPrice)}
                        </div>
                        <div className="text-red-400 text-sm">
                          <TrendingDown className="inline h-3 w-3 mr-1" />
                          {formatCurrency(bond.askPrice)}
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="p-4 text-right">
                      <div className="text-white font-semibold">{formatCurrency(bond.currentPrice)}</div>
                      <div className="text-xs text-slate-400">Face: {formatCurrency(bond.faceValue)}</div>
                    </td>

                    {/* YTM */}
                    <td className="p-4 text-right">
                      <div className="text-blue-400 font-semibold">{formatPercentage(bond.yieldToMaturity)}</div>
                    </td>

                    {/* Current Yield */}
                    <td className="p-4 text-right">
                      <div className="text-yellow-400 font-semibold">{formatPercentage(bond.currentYield)}</div>
                      <div className="text-xs text-slate-400">Coupon: {formatPercentage(bond.couponRate)}</div>
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-right">
                      <div className="text-purple-400 font-semibold">{bond.modifiedDuration.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">Modified</div>
                    </td>

                    {/* Days to Maturity */}
                    <td className="p-4 text-right">
                      <div className="text-orange-400 font-semibold">{bond.daysToMaturity.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">days</div>
                    </td>

                    {/* Characteristics */}
                    <td className="p-4 text-center">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-300">Coupon: {formatPercentage(bond.couponRate)}</div>
                        {bond.callDate && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                            Callable
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Key Dates */}
                    <td className="p-4 text-center">
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-500">Issue:</span> {formatDate(bond.issueDate)}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-slate-500">Maturity:</span> {formatDate(bond.maturityDate)}
                        </div>
                        {bond.callDate && (
                          <div className="text-yellow-400">
                            <span className="text-slate-500">Call:</span> {formatDate(bond.callDate)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBonds.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400">No bonds found matching your criteria</div>
          )}

          {loading && (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading market data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Total Instruments</div>
            <div className="text-2xl font-bold text-white">{filteredBonds.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Avg YTM</div>
            <div className="text-2xl font-bold text-blue-400">
              {filteredBonds.length > 0
                ? formatPercentage(
                    filteredBonds.reduce((sum, bond) => sum + bond.yieldToMaturity, 0) / filteredBonds.length,
                  )
                : "0.00%"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Avg Duration</div>
            <div className="text-2xl font-bold text-purple-400">
              {filteredBonds.length > 0
                ? (filteredBonds.reduce((sum, bond) => sum + bond.modifiedDuration, 0) / filteredBonds.length).toFixed(
                    2,
                  )
                : "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Market Value</div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(filteredBonds.reduce((sum, bond) => sum + bond.currentPrice, 0))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
