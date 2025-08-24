import type { Bond, Order, Trade, Position } from "@/data/bonds"

const API_BASE = "/api"

export const api = {
  // Bonds API
  getBonds: async (): Promise<Bond[]> => {
    const response = await fetch(`${API_BASE}/bonds`)
    return response.json()
  },

  // Orders API
  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE}/orders`)
    return response.json()
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    console.log("[v0] API: Creating order with data:", orderData)

    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })

    console.log("[v0] API: Order creation response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] API: Order creation failed:", errorText)
      throw new Error(`Failed to create order: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log("[v0] API: Order creation result:", result)

    return result
  },

  updateOrder: async (id: string, updateData: Partial<Order>): Promise<Order> => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updateData }),
    })
    return response.json()
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const response = await fetch(`${API_BASE}/orders?id=${id}`, {
      method: "DELETE",
    })
    return response.json()
  },

  // Trades API
  getTrades: async (): Promise<Trade[]> => {
    const response = await fetch(`${API_BASE}/trades`)
    return response.json()
  },

  // Positions API
  getPositions: async (): Promise<Position[]> => {
    const response = await fetch(`${API_BASE}/positions`)
    return response.json()
  },
}
