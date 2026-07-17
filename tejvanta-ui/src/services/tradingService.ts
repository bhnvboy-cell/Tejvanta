import { api } from './apiClient'
import type { Order, PlaceOrderRequest, Position } from '../types/Order'

export const tradingService = {
  placeOrder: (req: PlaceOrderRequest) =>
    api.post<Order>('/orders/place', req),

  cancelOrder: (orderId: number) =>
    api.post<void>('/orders/cancel', { orderId }),

  getOrders: (openOnly = false) =>
    api.get<Order[]>(`/orders?openOnly=${openOnly}`),

  getPositions: () => api.get<Position[]>('/positions'),

  closePosition: (symbol: string) =>
    api.post<void>('/positions/close', { symbol }),

  reversePosition: (symbol: string) =>
    api.post<void>('/positions/reverse', { symbol }),
}
