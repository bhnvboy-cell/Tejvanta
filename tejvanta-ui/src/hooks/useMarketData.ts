import { useAppSelector } from './useAppDispatch'
import type { Tick } from '../types/Instrument'

export function useMarketData(symbol?: string) {
  const ticks = useAppSelector(state => state.market.ticks)
  const instruments = useAppSelector(state => state.market.instruments)
  const selectedSymbol = useAppSelector(state => state.market.selectedSymbol)

  const tick: Tick | undefined = symbol ? ticks[symbol] : undefined

  return {
    ticks,
    tick,
    instruments,
    selectedSymbol,
  }
}
