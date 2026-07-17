import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Order, Position, PlaceOrderRequest } from '../types/Order'
import { tradingService } from '../services/tradingService'

interface TradingState {
  orders: Order[]
  positions: Position[]
  virtualBalance: number
  usedMargin: number
  loading: boolean
  error: string | null
}

const initialState: TradingState = {
  orders: [],
  positions: [],
  virtualBalance: 1000000,
  usedMargin: 0,
  loading: false,
  error: null,
}

export const placeOrder = createAsyncThunk('trading/placeOrder', async (req: PlaceOrderRequest) => {
  return tradingService.placeOrder(req)
})

export const cancelOrder = createAsyncThunk('trading/cancelOrder', async (orderId: number) => {
  await tradingService.cancelOrder(orderId)
  return orderId
})

export const fetchOrders = createAsyncThunk(
  'trading/fetchOrders',
  async (openOnly: boolean | undefined) => {
    return tradingService.getOrders(!!openOnly)
  }
)

export const fetchPositions = createAsyncThunk('trading/fetchPositions', async () => {
  return tradingService.getPositions()
})

export const closePosition = createAsyncThunk('trading/closePosition', async (symbol: string) => {
  await tradingService.closePosition(symbol)
  return symbol
})

export const reversePosition = createAsyncThunk('trading/reversePosition', async (symbol: string) => {
  await tradingService.reversePosition(symbol)
  return symbol
})

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    updateOrder(state, action: PayloadAction<Order>) {
      const idx = state.orders.findIndex(o => o.id === action.payload.id)
      if (idx >= 0) state.orders[idx] = action.payload
      else state.orders.unshift(action.payload)
    },
    updatePosition(state, action: PayloadAction<Position>) {
      const idx = state.positions.findIndex(p => p.instrumentId === action.payload.instrumentId)
      if (idx >= 0) state.positions[idx] = action.payload
      else state.positions.push(action.payload)
    },
    setBalance(state, action: PayloadAction<number>) {
      state.virtualBalance = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload)
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const order = state.orders.find(o => o.id === action.payload)
        if (order) order.status = 'CANCELLED'
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders = action.payload
        state.loading = false
      })
      .addCase(fetchOrders.pending, (state) => { state.loading = true })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch orders'
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload
        state.loading = false
      })
      .addCase(fetchPositions.pending, (state) => { state.loading = true })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch positions'
      })
      .addCase(closePosition.fulfilled, (state, action) => {
        state.positions = state.positions.filter(p => p.symbol !== action.payload)
      })
  },
})

export const { updateOrder, updatePosition, setBalance } = tradingSlice.actions
export default tradingSlice.reducer
