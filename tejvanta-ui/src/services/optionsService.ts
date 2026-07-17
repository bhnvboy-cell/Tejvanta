import { api } from './apiClient'
import type { OptionsChainResponse } from '../types/OptionsContract'

export const optionsService = {
  getChain: (symbol: string, expiry?: string) => {
    const params = new URLSearchParams({ symbol })
    if (expiry) params.set('expiry', expiry)
    return api.get<OptionsChainResponse>(`/options/chain?${params}`)
  },

  getExpiries: (symbol: string) =>
    api.get<string[]>(`/options/expiries?symbol=${encodeURIComponent(symbol)}`),
}
