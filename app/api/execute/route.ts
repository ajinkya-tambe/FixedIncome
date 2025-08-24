import { NextResponse } from "next/server"
import { ExecutionEngine } from "@/lib/execution-engine"

export async function POST() {
  ExecutionEngine.processOrders()
  return NextResponse.json({ message: "Orders processed" })
}
