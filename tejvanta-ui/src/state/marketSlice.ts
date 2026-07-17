import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Instrument, Tick, Candle } from '../types/Instrument'
import { marketDataService } from '../services/marketDataService'
import { ALL_SYMBOLS } from '../config/defaultWatchlist'

interface MarketState {
  instruments: Instrument[]
  selectedSymbol: string | null
  ticks: Record<string, Tick>
  livePrices: Record<string, number>
  candles: Candle[]
  loading: boolean
  error: string | null
  mode: 'LIVE' | 'REPLAY'
}

const FALLBACK_INSTRUMENTS: Instrument[] = ALL_SYMBOLS.map((s, i) => ({
  id: i + 1, symbol: s.symbol, name: s.name, exchange: s.exchange,
  tickSize: 0.05, lotSize: 1, segment: 'CASH', series: 'EQ',
}))

const initialState: MarketState = {
  instruments: FALLBACK_INSTRUMENTS,
  selectedSymbol: null,
  ticks: {},
  livePrices: {},
  candles: [],
  loading: false,
  error: null,
  mode: 'LIVE',
}

export const fetchInstruments = createAsyncThunk('market/fetchInstruments', async () => {
  return marketDataService.getInstruments()
})

export const searchInstruments = createAsyncThunk(
  'market/search',
  async (query: string) => marketDataService.searchInstruments(query)
)

export const fetchOhlc = createAsyncThunk(
  'market/fetchOhlc',
  async ({ symbol, from, to, timeframe }: { symbol: string; from?: string; to?: string; timeframe?: string }) => {
    return marketDataService.getOhlc(symbol, from, to, timeframe)
  }
)

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    selectSymbol(state, action: PayloadAction<string>) {
      state.selectedSymbol = action.payload
    },
    updateTick(state, action: PayloadAction<Tick>) {
      const tick = action.payload
      const found = tick.symbol
        ? state.instruments.find(i => i.symbol === tick.symbol)
        : state.instruments.find(i => i.id === tick.instrumentId)
      if (found) {
        state.ticks[found.symbol] = tick
        state.livePrices[found.symbol] = tick.price
      }
    },
    setMode(state, action: PayloadAction<'LIVE' | 'REPLAY'>) {
      state.mode = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstruments.fulfilled, (state, action) => {
        state.instruments = action.payload
        state.loading = false
      })
      .addCase(fetchInstruments.pending, (state) => { state.loading = true })
      .addCase(fetchInstruments.rejected, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(fetchOhlc.fulfilled, (state, action) => {
        state.candles = action.payload
        state.loading = false
      })
      .addCase(fetchOhlc.pending, (state) => { state.loading = true })
      .addCase(searchInstruments.fulfilled, (state) => { state.loading = false })
  },
})

export const { selectSymbol, updateTick, setMode } = marketSlice.actions
export default marketSlice.reducer
