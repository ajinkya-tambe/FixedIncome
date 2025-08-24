import { NextResponse } from "next/server"
import { positionsData, bondsData } from "@/data/bonds"

export async function GET() {
  // Update positions with current market prices
  const updatedPositions = positionsData.map((position) => {
    const bond = bondsData.find((b) => b.id === position.bondId)
    if (bond) {
      const currentPrice = bond.currentPrice + (Math.random() - 0.5) * 1.0
      const marketValue = position.quantity * currentPrice
      const unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity

      return {
        ...position,
        currentPrice,
        marketValue,
        unrealizedPnL,
        totalPnL: unrealizedPnL + position.realizedPnL,
      }
    }
    return position
  })

  return NextResponse.json(updatedPositions)
}
