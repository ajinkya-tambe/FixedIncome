import { NextResponse } from "next/server"
import { ordersData, type Order } from "@/data/bonds"
import { ExecutionEngine } from "@/lib/execution-engine"

export async function GET() {
  return NextResponse.json(ordersData)
}

export async function POST(request: Request) {
  const orderData = await request.json()

  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    ...orderData,
    status: "PENDING",
    timestamp: new Date().toISOString(),
    executedQuantity: 0,
  }

  ordersData.push(newOrder)

  if (newOrder.orderType === "MARKET") {
    console.log("[v0] Executing market order immediately:", newOrder.id)
    setTimeout(() => {
      ExecutionEngine.tryExecuteOrder(newOrder)
    }, 100) // Very short delay for market orders
  } else {
    console.log("[v0] Scheduling execution for non-market order:", newOrder.id)
    setTimeout(() => {
      ExecutionEngine.tryExecuteOrder(newOrder)
    }, 1000)
  }

  return NextResponse.json(newOrder)
}

export async function PUT(request: Request) {
  const { id, ...updateData } = await request.json()

  const orderIndex = ordersData.findIndex((order) => order.id === id)
  if (orderIndex !== -1) {
    ordersData[orderIndex] = { ...ordersData[orderIndex], ...updateData }
    return NextResponse.json(ordersData[orderIndex])
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  const orderIndex = ordersData.findIndex((order) => order.id === id)
  if (orderIndex !== -1) {
    const cancelledOrder = { ...ordersData[orderIndex], status: "CANCELLED" as const }
    ordersData[orderIndex] = cancelledOrder
    return NextResponse.json(cancelledOrder)
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 })
}
