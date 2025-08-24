import { NextResponse } from "next/server"
import { tradesData } from "@/data/bonds"

export async function GET() {
  return NextResponse.json(tradesData)
}
