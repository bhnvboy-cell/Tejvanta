import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ReplayCandle } from '../types/OptionsContract'
import type { Tick } from '../types/Instrument'

interface ReplaySliceState {
  candles: ReplayCandle[]
  currentPrice: number | null
  currentSymbol: string | null
  isActive: boolean
  entryPrice: number | null
  quantity: number | null
  side: 'BUY' | 'SELL' | null
  replayPnL: number | null
  lastRealizedPnL: number | null
  sessionPnL: number
  mode: 'LIVE' | 'REPLAY'
}

const initialState: ReplaySliceState = {
  candles: [],
  currentPrice: null,
  currentSymbol: null,
  isActive: false,
  entryPrice: null,
  quantity: null,
  side: null,
  replayPnL: null,
  lastRealizedPnL: null,
  sessionPnL: 0,
  mode: 'REPLAY',
}

function computePnL(state: ReplaySliceState) {
  if (state.entryPrice != null && state.quantity && state.side && state.currentPrice != null) {
    const diff = state.side === 'BUY'
      ? state.currentPrice - state.entryPrice
      : state.entryPrice - state.currentPrice
    state.replayPnL = diff * state.quantity
  } else {
    state.replayPnL = null
  }
}

const replaySlice = createSlice({
  name: 'replay',
  initialState,
  reducers: {
    candleCompleted(state, action: PayloadAction<ReplayCandle>) {
      state.candles.push(action.payload)
      state.currentPrice = action.payload.close
      computePnL(state)
    },
    clearCandles(state) {
      state.candles = []
      state.currentPrice = null
      state.currentSymbol = null
      state.isActive = false
      state.entryPrice = null
      state.quantity = null
      state.side = null
      state.replayPnL = null
      state.lastRealizedPnL = null
      state.sessionPnL = 0
    },
    updateCurrentPrice(state, action: PayloadAction<{ tick: Tick; symbol: string }>) {
      state.currentPrice = action.payload.tick.price
      state.currentSymbol = action.payload.symbol
      computePnL(state)
    },
    setActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload
    },
    setReplayMode(state, action: PayloadAction<'LIVE' | 'REPLAY'>) {
      state.mode = action.payload
    },
    setReplayTrade(state, action: PayloadAction<{ side: 'BUY' | 'SELL'; quantity: number; price: number }>) {
      state.side = action.payload.side
      state.quantity = action.payload.quantity
      state.entryPrice = action.payload.price
      computePnL(state)
    },
    squareOff(state) {
      if (state.entryPrice != null && state.quantity && state.side && state.currentPrice != null) {
        const diff = state.side === 'BUY'
          ? state.currentPrice - state.entryPrice
          : state.entryPrice - state.currentPrice
        const realized = diff * state.quantity
        state.lastRealizedPnL = realized
        state.sessionPnL += realized
      }
      state.entryPrice = null
      state.quantity = null
      state.side = null
      state.replayPnL = null
    },
    clearReplayTrade(state) {
      state.entryPrice = null
      state.quantity = null
      state.side = null
      state.replayPnL = null
    },
  },
})

export const { candleCompleted, clearCandles, updateCurrentPrice, setActive, setReplayMode, setReplayTrade, squareOff, clearReplayTrade } = replaySlice.actions
export default replaySlice.reducer
