import { useAppDispatch, useAppSelector } from './useAppDispatch'
import { placeOrder, cancelOrder, fetchOrders, fetchPositions, closePosition, reversePosition } from '../state/tradingSlice'
import type { PlaceOrderRequest } from '../types/Order'

export function usePaperTrading() {
  const dispatch = useAppDispatch()
  const { orders, positions, virtualBalance, usedMargin, loading, error } =
    useAppSelector(state => state.trading)

  return {
    orders,
    positions,
    virtualBalance,
    usedMargin,
    loading,
    error,
    placeOrder: (req: PlaceOrderRequest) => dispatch(placeOrder(req)),
    cancelOrder: (id: number) => dispatch(cancelOrder(id)),
    refreshOrders: (openOnly?: boolean) => dispatch(fetchOrders(openOnly)),
    refreshPositions: () => dispatch(fetchPositions()),
    closePosition: (symbol: string) => dispatch(closePosition(symbol)),
    reversePosition: (symbol: string) => dispatch(reversePosition(symbol)),
  }
}
