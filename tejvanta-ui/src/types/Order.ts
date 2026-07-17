export interface Order {
  id: number
  instrumentId: number
  symbol: string
  side: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SLM'
  price: number
  quantity: number
  stopLoss: number
  takeProfit: number
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED'
  filledQuantity: number
  avgFillPrice: number
  createdAt: string
  basketId?: string
}

export interface PlaceOrderRequest {
  instrumentId: number
  side: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT'
  price: number
  quantity: number
  stopLoss: number
  takeProfit: number
  basketId?: string
}

export interface Position {
  id: number
  instrumentId: number
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  unrealizedPnL: number
  realizedPnL: number
  pnlPercent: number
  totalPnL: number
}

export interface Trade {
  id: number
  orderId: number
  instrumentId: number
  symbol: string
  side: string
  price: number
  quantity: number
  tradeTime: string
}
