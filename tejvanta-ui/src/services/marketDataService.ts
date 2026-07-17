import { api } from './apiClient'
import type { Instrument, Candle, Tick } from '../types/Instrument'

export const marketDataService = {
  getInstruments: () => api.get<Instrument[]>('/instruments'),

  searchInstruments: (q: string) =>
    api.get<Instrument[]>(`/instruments/search?q=${encodeURIComponent(q)}`),

  getOhlc: (symbol: string, from?: string, to?: string, timeframe = '1D') => {
    const params = new URLSearchParams({ symbol, timeframe })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return api.get<Candle[]>(`/market/ohlc?${params}`)
  },

  getLatestTick: (symbol: string) =>
    api.get<Tick>(`/market/ticks/latest?symbol=${encodeURIComponent(symbol)}`),
}
