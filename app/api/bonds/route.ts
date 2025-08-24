import { NextResponse } from "next/server"
import { bondsData } from "@/data/bonds"

export async function GET() {
  const updatedBonds = bondsData.map((bond) => {
    // Create more significant price movements (±2-5 points)
    const priceChange = (Math.random() - 0.5) * (bond.sector === "Government" ? 2.0 : 4.0)
    const volatilityFactor = bond.modifiedDuration * 0.1 // Higher duration = more volatility

    // Add trending behavior - 60% chance to continue previous direction
    const trend = Math.random() > 0.4 ? Math.random() - 0.5 : Math.random() - 0.3
    const finalPriceChange = priceChange + trend * volatilityFactor

    const newCurrentPrice = Math.max(bond.currentPrice + finalPriceChange, bond.faceValue * 0.7)

    // More realistic bid-ask spread (0.25-0.75 points)
    const spread = bond.sector === "Government" ? 0.25 : 0.5
    const newBidPrice = newCurrentPrice - spread / 2
    const newAskPrice = newCurrentPrice + spread / 2

    // Recalculate yield based on new price
    const newYTM =
      bond.couponRate + ((bond.faceValue - newCurrentPrice) / newCurrentPrice) * (365 / bond.daysToMaturity) * 100
    const newCurrentYield = (bond.couponRate * bond.faceValue) / newCurrentPrice

    return {
      ...bond,
      currentPrice: Math.round(newCurrentPrice * 100) / 100,
      bidPrice: Math.round(newBidPrice * 100) / 100,
      askPrice: Math.round(newAskPrice * 100) / 100,
      yieldToMaturity: Math.round(newYTM * 100) / 100,
      currentYield: Math.round(newCurrentYield * 100) / 100,
      lastUpdated: new Date().toISOString(),
    }
  })

  return NextResponse.json(updatedBonds)
}
