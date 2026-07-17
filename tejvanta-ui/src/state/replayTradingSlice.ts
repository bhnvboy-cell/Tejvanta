import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Order, Position } from '../types/Order'
import { api } from '../services/apiClient'

interface ReplayOrderRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
}

interface ReplayTradingState {
  replayOrders: Order[]
  replayPositions: Position[]
  loading: boolean
  error: string | null
}

const initialState: ReplayTradingState = {
  replayOrders: [],
  replayPositions: [],
  loading: false,
  error: null,
}

export const placeReplayOrder = createAsyncThunk(
  'replayTrading/placeOrder',
  async (req: ReplayOrderRequest, { getState }) => {
    const state = getState() as { market: { instruments: { id: number; symbol: string }[] } }
    const instrument = state.market.instruments.find(i => i.symbol === req.symbol)
    if (!instrument) throw new Error(`Instrument not found: ${req.symbol}`)
    return api.post<Order>('/orders/place', {
      instrumentId: instrument.id,
      side: req.side,
      orderType: 'MARKET',
      quantity: req.quantity,
      price: req.price,
      stopLoss: 0,
      takeProfit: 0,
      mode: 'REPLAY',
    })
  }
)

export const loadReplayPositions = createAsyncThunk(
  'replayTrading/loadPositions',
  async () => {
    return api.get<Position[]>('/positions')
  }
)

const replayTradingSlice = createSlice({
  name: 'replayTrading',
  initialState,
  reducers: {
    addReplayOrder(state, action: PayloadAction<Order>) {
      state.replayOrders.unshift(action.payload)
    },
    clearReplayData(state) {
      state.replayOrders = []
      state.replayPositions = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeReplayOrder.fulfilled, (state, action) => {
        state.replayOrders.unshift(action.payload)
        state.loading = false
      })
      .addCase(placeReplayOrder.pending, (state) => { state.loading = true })
      .addCase(placeReplayOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Order failed'
      })
      .addCase(loadReplayPositions.fulfilled, (state, action) => {
        state.replayPositions = action.payload
        state.loading = false
      })
      .addCase(loadReplayPositions.pending, (state) => { state.loading = true })
      .addCase(loadReplayPositions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load positions'
      })
  },
})

export const { addReplayOrder, clearReplayData } = replayTradingSlice.actions
export default replayTradingSlice.reducer
