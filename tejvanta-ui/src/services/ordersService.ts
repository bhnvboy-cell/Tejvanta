import { api } from './apiClient'
import type { Order, PlaceOrderRequest } from '../types/Order'

export const ordersService = {
  placeOrder: (req: PlaceOrderRequest) =>
    api.post<Order>('/orders/place', req),

  cancelOrder: (orderId: number) =>
    api.post<void>('/orders/cancel', { orderId }),

  getOrders: (openOnly = false) =>
    api.get<Order[]>(`/orders?openOnly=${openOnly}`),
}
