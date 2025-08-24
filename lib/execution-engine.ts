import { ordersData, tradesData, bondsData, positionsData, type Order, type Trade } from "@/data/bonds"

// Individual purchase lot for FIFO/LIFO tracking
interface PurchaseLot {
  id: string
  quantity: number
  price: number
  timestamp: string
  remainingQuantity: number
}

// Enhanced position with lot tracking
interface EnhancedPosition {
  bondId: string
  ticker: string
  lots: PurchaseLot[]
  totalQuantity: number
  realizedPnL: number
}

// Store enhanced positions with lot tracking
const enhancedPositions: EnhancedPosition[] = []

export class ExecutionEngine {
  static calculationMethod: "FIFO" | "LIFO" | "WAP" = "WAP"

  static setCalculationMethod(method: "FIFO" | "LIFO" | "WAP") {
    this.calculationMethod = method
    console.log("[v0] Calculation method set to:", method)
  }

  static processOrders() {
    const pendingOrders = ordersData.filter((order) => order.status === "PENDING")

    pendingOrders.forEach((order) => {
      this.tryExecuteOrder(order)
    })
  }

  static tryExecuteOrder(order: Order) {
    console.log("[v0] Trying to execute order:", order.id, "Type:", order.orderType)

    const bond = bondsData.find((b) => b.id === order.bondId)
    if (!bond) {
      console.log("[v0] Bond not found for order:", order.bondId)
      return
    }

    if (order.type === "SELL") {
      const enhancedPosition = enhancedPositions.find((p) => p.bondId === order.bondId)
      if (!enhancedPosition || enhancedPosition.totalQuantity < order.quantity) {
        console.log(
          "[v0] Insufficient position for sell order:",
          order.id,
          "Available:",
          enhancedPosition?.totalQuantity || 0,
          "Required:",
          order.quantity,
        )
        // Mark order as cancelled due to insufficient position
        const orderIndex = ordersData.findIndex((o) => o.id === order.id)
        if (orderIndex !== -1) {
          ordersData[orderIndex] = {
            ...order,
            status: "CANCELLED",
            cancelReason: "Insufficient position",
          }
        }
        return
      }
    }

    let canExecute = false

    switch (order.orderType) {
      case "MARKET":
        canExecute = true
        console.log("[v0] Market order - executing immediately")
        break

      case "LIMIT":
        canExecute = order.type === "BUY" ? bond.askPrice <= order.price : bond.bidPrice >= order.price
        console.log(
          "[v0] Limit order check - canExecute:",
          canExecute,
          "Bond ask:",
          bond.askPrice,
          "Order price:",
          order.price,
        )
        break

      case "STOP":
        canExecute = order.type === "BUY" ? bond.askPrice >= order.price : bond.bidPrice <= order.price
        break

      case "CONDITIONAL":
        canExecute = this.evaluateConditionalOrder(order, bond)
        break

      default:
        canExecute = false
    }

    if (canExecute) {
      const executionPrice =
        order.orderType === "MARKET" ? (order.type === "BUY" ? bond.askPrice : bond.bidPrice) : order.price

      console.log("[v0] Executing order:", order.id, "at price:", executionPrice)
      this.executeOrder(order, executionPrice)
    } else {
      console.log("[v0] Order cannot be executed yet:", order.id)
    }
  }

  static evaluateConditionalOrder(order: Order, bond: any): boolean {
    if (order.type === "BUY" && bond.ytm > 4.0) return true
    if (order.type === "SELL" && bond.ytm < 3.0) return true
    return false
  }

  static executeOrder(order: Order, executionPrice: number) {
    const executedQuantity = order.quantity - order.executedQuantity

    const orderIndex = ordersData.findIndex((o) => o.id === order.id)
    if (orderIndex !== -1) {
      ordersData[orderIndex] = {
        ...order,
        status: "EXECUTED",
        executedQuantity: order.quantity,
        executedPrice: executionPrice,
        executedAt: new Date().toISOString(),
      }
      console.log("[v0] Order executed and updated:", ordersData[orderIndex])
    }

    const trade: Trade = {
      id: `TRD-${Date.now()}`,
      orderId: order.id,
      ticker: bondsData.find((b) => b.id === order.bondId)?.ticker || order.bondId,
      side: order.type,
      quantity: executedQuantity,
      price: executionPrice,
      value: executedQuantity * executionPrice,
      timestamp: new Date().toISOString(),
      status: "SETTLED",
    }
    tradesData.push(trade)
    console.log("[v0] Trade created:", trade)

    this.updatePositionWithLots(order.bondId, order.type, executedQuantity, executionPrice)
  }

  static updatePositionWithLots(bondId: string, side: "BUY" | "SELL", quantity: number, price: number) {
    let enhancedPosition = enhancedPositions.find((p) => p.bondId === bondId)

    if (!enhancedPosition && side === "BUY") {
      const bond = bondsData.find((b) => b.id === bondId)
      enhancedPosition = {
        bondId,
        ticker: bond?.ticker || bondId,
        lots: [],
        totalQuantity: 0,
        realizedPnL: 0,
      }
      enhancedPositions.push(enhancedPosition)
    }

    if (!enhancedPosition) return

    if (side === "BUY") {
      // Add new purchase lot
      const newLot: PurchaseLot = {
        id: `LOT-${Date.now()}`,
        quantity,
        price,
        timestamp: new Date().toISOString(),
        remainingQuantity: quantity,
      }
      enhancedPosition.lots.push(newLot)
      enhancedPosition.totalQuantity += quantity
      console.log("[v0] Added new purchase lot:", newLot)
    } else {
      // Handle sell using selected calculation method
      const realizedPnL = this.processSell(enhancedPosition, quantity, price)
      enhancedPosition.realizedPnL += realizedPnL
      console.log("[v0] Sell processed using", this.calculationMethod, "- Realized P&L:", realizedPnL)
    }

    // Update the regular position data for UI compatibility
    this.syncToRegularPosition(enhancedPosition)
  }

  static processSell(enhancedPosition: EnhancedPosition, sellQuantity: number, sellPrice: number): number {
    let remainingToSell = sellQuantity
    let totalRealizedPnL = 0
    let totalCostBasis = 0

    if (this.calculationMethod === "WAP") {
      // Weighted Average Price method
      const totalValue = enhancedPosition.lots.reduce((sum, lot) => sum + lot.remainingQuantity * lot.price, 0)
      const avgPrice = enhancedPosition.totalQuantity > 0 ? totalValue / enhancedPosition.totalQuantity : 0
      totalCostBasis = sellQuantity * avgPrice
      totalRealizedPnL = sellPrice * sellQuantity - totalCostBasis

      // Reduce quantities proportionally
      const sellRatio = sellQuantity / enhancedPosition.totalQuantity
      enhancedPosition.lots.forEach((lot) => {
        const reduceBy = lot.remainingQuantity * sellRatio
        lot.remainingQuantity -= reduceBy
      })
    } else {
      // FIFO or LIFO method
      const sortedLots = [...enhancedPosition.lots].sort((a, b) => {
        if (this.calculationMethod === "FIFO") {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        } else {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        }
      })

      for (const lot of sortedLots) {
        if (remainingToSell <= 0 || lot.remainingQuantity <= 0) continue

        const quantityFromThisLot = Math.min(remainingToSell, lot.remainingQuantity)
        const costBasis = quantityFromThisLot * lot.price
        const proceeds = quantityFromThisLot * sellPrice
        const lotPnL = proceeds - costBasis

        totalRealizedPnL += lotPnL
        totalCostBasis += costBasis
        lot.remainingQuantity -= quantityFromThisLot
        remainingToSell -= quantityFromThisLot

        console.log(
          `[v0] ${this.calculationMethod} - Sold ${quantityFromThisLot} from lot at $${lot.price}, P&L: $${lotPnL.toFixed(2)}`,
        )
      }
    }

    // Remove empty lots and update total quantity
    enhancedPosition.lots = enhancedPosition.lots.filter((lot) => lot.remainingQuantity > 0)
    enhancedPosition.totalQuantity -= sellQuantity

    // Remove position if fully sold
    if (enhancedPosition.totalQuantity <= 0) {
      const index = enhancedPositions.findIndex((p) => p.bondId === enhancedPosition.bondId)
      if (index !== -1) {
        enhancedPositions.splice(index, 1)
        console.log("[v0] Enhanced position fully sold and removed for bondId:", enhancedPosition.bondId)
      }
    }

    return totalRealizedPnL
  }

  static syncToRegularPosition(enhancedPosition: EnhancedPosition) {
    const bond = bondsData.find((b) => b.id === enhancedPosition.bondId)
    const currentMarketPrice = bond ? bond.currentPrice : 0

    let position = positionsData.find((p) => p.bondId === enhancedPosition.bondId)

    if (enhancedPosition.totalQuantity <= 0) {
      // Remove position if fully sold
      const positionIndex = positionsData.findIndex((p) => p.bondId === enhancedPosition.bondId)
      if (positionIndex !== -1) {
        positionsData.splice(positionIndex, 1)
      }
      return
    }

    // Calculate weighted average price from remaining lots
    const totalValue = enhancedPosition.lots.reduce((sum, lot) => sum + lot.remainingQuantity * lot.price, 0)
    const averagePrice = enhancedPosition.totalQuantity > 0 ? totalValue / enhancedPosition.totalQuantity : 0
    const marketValue = enhancedPosition.totalQuantity * currentMarketPrice
    const unrealizedPnL = enhancedPosition.totalQuantity * (currentMarketPrice - averagePrice)

    if (!position) {
      position = {
        id: `POS-${Date.now()}`,
        bondId: enhancedPosition.bondId,
        ticker: enhancedPosition.ticker,
        quantity: enhancedPosition.totalQuantity,
        averagePrice,
        marketValue,
        unrealizedPnL,
        realizedPnL: enhancedPosition.realizedPnL,
        currentPrice: currentMarketPrice,
        totalPnL: unrealizedPnL + enhancedPosition.realizedPnL,
      }
      positionsData.push(position)
    } else {
      const positionIndex = positionsData.findIndex((p) => p.bondId === enhancedPosition.bondId)
      if (positionIndex !== -1) {
        positionsData[positionIndex] = {
          ...position,
          quantity: enhancedPosition.totalQuantity,
          averagePrice,
          marketValue,
          unrealizedPnL,
          realizedPnL: enhancedPosition.realizedPnL,
          currentPrice: currentMarketPrice,
          totalPnL: unrealizedPnL + enhancedPosition.realizedPnL,
        }
      }
    }

    console.log(
      "[v0] Position synced:",
      positionsData.find((p) => p.bondId === enhancedPosition.bondId),
    )
  }

  static updatePosition(bondId: string, side: "BUY" | "SELL", quantity: number, price: number) {
    this.updatePositionWithLots(bondId, side, quantity, price)
  }
}
