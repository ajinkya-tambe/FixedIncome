export interface Bond {
  id: string
  ticker: string
  issuer: string
  couponRate: number
  maturityDate: string
  faceValue: number
  currentPrice: number
  bidPrice: number
  askPrice: number
  yieldToMaturity: number
  currentYield: number
  daysToMaturity: number
  modifiedDuration: number
  rating: string
  sector: string
  issueDate: string
  callDate?: string
  callPrice?: number
  lastUpdated: string
}

export interface Order {
  id: string
  bondId: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  disclosedQuantity?: number
  stopLoss?: number
  orderType: "MARKET" | "LIMIT" | "STOP" | "CONDITIONAL"
  condition?: string
  status: "PENDING" | "EXECUTED" | "CANCELLED" | "PARTIAL"
  timestamp: string
  executedQuantity: number
  executedPrice?: number
}

export interface Trade {
  id: string
  orderId: string
  bondId: string
  type: "BUY" | "SELL"
  quantity: number
  price: number
  timestamp: string
  status: "OPEN" | "CLOSED"
}

export interface Position {
  bondId: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  realizedPnL: number
  totalPnL: number
}

// Dummy bond data
export const bondsData: Bond[] = [
  {
    id: "US-GOVT-001",
    ticker: "UST-10Y",
    issuer: "US Treasury",
    couponRate: 4.25,
    maturityDate: "2034-05-15",
    faceValue: 1000,
    currentPrice: 985.5,
    bidPrice: 985.25,
    askPrice: 985.75,
    yieldToMaturity: 4.38,
    currentYield: 4.31,
    daysToMaturity: 3652,
    modifiedDuration: 8.42,
    rating: "AAA",
    sector: "Government",
    issueDate: "2024-05-15",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "CORP-001",
    ticker: "AAPL-2029",
    issuer: "Apple Inc.",
    couponRate: 3.85,
    maturityDate: "2029-08-20",
    faceValue: 1000,
    currentPrice: 1024.3,
    bidPrice: 1024.1,
    askPrice: 1024.5,
    yieldToMaturity: 3.52,
    currentYield: 3.76,
    daysToMaturity: 1826,
    modifiedDuration: 4.68,
    rating: "AA+",
    sector: "Technology",
    issueDate: "2022-08-20",
    callDate: "2027-08-20",
    callPrice: 1050,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "CORP-002",
    ticker: "JPM-2031",
    issuer: "JPMorgan Chase",
    couponRate: 4.75,
    maturityDate: "2031-12-15",
    faceValue: 1000,
    currentPrice: 1089.75,
    bidPrice: 1089.5,
    askPrice: 1090.0,
    yieldToMaturity: 3.89,
    currentYield: 4.36,
    daysToMaturity: 2556,
    modifiedDuration: 6.23,
    rating: "A+",
    sector: "Financial",
    issueDate: "2021-12-15",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "MUNI-001",
    ticker: "NYC-2035",
    issuer: "New York City",
    couponRate: 3.5,
    maturityDate: "2035-06-01",
    faceValue: 1000,
    currentPrice: 952.8,
    bidPrice: 952.6,
    askPrice: 953.0,
    yieldToMaturity: 3.89,
    currentYield: 3.67,
    daysToMaturity: 4018,
    modifiedDuration: 9.15,
    rating: "AA",
    sector: "Municipal",
    issueDate: "2023-06-01",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "CORP-003",
    ticker: "MSFT-2028",
    issuer: "Microsoft Corp.",
    couponRate: 2.95,
    maturityDate: "2028-03-17",
    faceValue: 1000,
    currentPrice: 967.25,
    bidPrice: 967.0,
    askPrice: 967.5,
    yieldToMaturity: 3.42,
    currentYield: 3.05,
    daysToMaturity: 1461,
    modifiedDuration: 3.89,
    rating: "AAA",
    sector: "Technology",
    issueDate: "2023-03-17",
    lastUpdated: new Date().toISOString(),
  },
]

// Dummy orders data
export const ordersData: Order[] = [
  {
    id: "ORD-001",
    bondId: "US-GOVT-001",
    type: "BUY",
    quantity: 100,
    price: 985.5,
    disclosedQuantity: 50,
    orderType: "LIMIT",
    status: "PENDING",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    executedQuantity: 0,
  },
  {
    id: "ORD-002",
    bondId: "AAPL-2029",
    type: "SELL",
    quantity: 50,
    price: 1024.3,
    stopLoss: 1020.0,
    orderType: "STOP",
    status: "EXECUTED",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    executedQuantity: 50,
    executedPrice: 1024.3,
  },
]

// Dummy trades data
export const tradesData: Trade[] = [
  {
    id: "TRD-001",
    orderId: "ORD-002",
    bondId: "AAPL-2029",
    type: "SELL",
    quantity: 50,
    price: 1024.3,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: "CLOSED",
  },
]

// Dummy positions data
export const positionsData: Position[] = [
  {
    bondId: "US-GOVT-001",
    quantity: 200,
    averagePrice: 982.75,
    currentPrice: 985.5,
    marketValue: 197100,
    unrealizedPnL: 550,
    realizedPnL: 0,
    totalPnL: 550,
  },
  {
    bondId: "JPM-2031",
    quantity: 100,
    averagePrice: 1085.0,
    currentPrice: 1089.75,
    marketValue: 108975,
    unrealizedPnL: 475,
    realizedPnL: 0,
    totalPnL: 475,
  },
]
