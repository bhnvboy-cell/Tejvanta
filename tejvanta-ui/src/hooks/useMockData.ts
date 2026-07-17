import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './useAppDispatch'
import { updateTick } from '../state/marketSlice'
import { getAllLatestTicks, advanceTicks, setVix as setMockVix } from '../services/mockDataEngine'
import { setEngineVix } from '../services/marketEngine'
import { ALL_SYMBOLS } from '../config/defaultWatchlist'

const SYMBOLS = ALL_SYMBOLS.map(s => s.symbol)

export function useMockData() {
  const dispatch = useAppDispatch()
  const vix = useAppSelector(s => s.settings.indiaVix)

  useEffect(() => {
    setMockVix(vix)
    setEngineVix(vix)
    const initial = getAllLatestTicks(SYMBOLS)
    for (const tick of initial) {
      dispatch(updateTick(tick))
    }

    const interval = setInterval(() => {
      setMockVix(vix)
      setEngineVix(vix)
      const ticks = advanceTicks(SYMBOLS, 6)
      for (const tick of ticks) {
        dispatch(updateTick(tick))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [dispatch, vix])
}
