import { useEffect, useRef, useState, useCallback } from 'react'
import { ReplayController } from '../components/replay/ReplayController'
import { ReplayChart } from '../components/replay/ReplayChart'
import { ReplayTradingPanel } from '../components/replay/ReplayTradingPanel'
import type { ReplayChartHandle } from '../components/replay/ReplayChart'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { signalRService } from '../services/signalRService'
import { candleCompleted, updateCurrentPrice, setActive } from '../state/replaySlice'
import type { Tick } from '../types/Instrument'
import type { ReplayCandle } from '../types/OptionsContract'

export function ReplayPage() {
  const dispatch = useAppDispatch()
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const instruments = useAppSelector(s => s.market.instruments)
  const chartRef = useRef<ReplayChartHandle>(null)
  const instrument = instruments.find(i => i.symbol === selectedSymbol)
  const [sma20On, setSma20On] = useState(true)
  const [sma50On, setSma50On] = useState(true)

  const handleToggleSma20 = useCallback(() => {
    setSma20On(v => !v)
    chartRef.current?.toggleSma20()
  }, [])

  const handleToggleSma50 = useCallback(() => {
    setSma50On(v => !v)
    chartRef.current?.toggleSma50()
  }, [])

  useEffect(() => {
    if (!instrument) return
    signalRService.subscribeReplay(instrument.id)
    return () => { signalRService.unsubscribeReplay(instrument.id) }
  }, [instrument])

  useEffect(() => {
    const unsubTick = signalRService.onReplayTick((tick: Tick) => {
      chartRef.current?.applyTick(tick)
      if (selectedSymbol) {
        dispatch(updateCurrentPrice({ tick, symbol: selectedSymbol }))
      }
    })
    return () => { unsubTick() }
  }, [dispatch, selectedSymbol])

  useEffect(() => {
    const unsubCandle = signalRService.onReplayCandleCompleted((candle: ReplayCandle) => {
      dispatch(candleCompleted(candle))
    })
    return () => { unsubCandle() }
  }, [dispatch])

  useEffect(() => {
    const unsubState = signalRService.onReplayState((state) => {
      if (instrument && state.instrumentId === instrument.id) {
        if (state.isPlaying) {
          chartRef.current?.clearData()
          dispatch(setActive(true))
        } else {
          dispatch(setActive(false))
        }
      }
    })
    return () => { unsubState() }
  }, [instrument, dispatch])

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex items-center gap-3 px-3 py-1 bg-surface-light border-b border-gray-700 text-xs shrink-0">
          <span className="text-tej-400 font-semibold">Replay: {selectedSymbol}</span>
          <span className="text-gray-600">|</span>
          <button
            onClick={handleToggleSma20}
            className={`px-2 py-0.5 rounded font-medium transition ${sma20On ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SMA20
          </button>
          <button
            onClick={handleToggleSma50}
            className={`px-2 py-0.5 rounded font-medium transition ${sma50On ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            SMA50
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ReplayChart ref={chartRef} />
        </div>
        <ReplayTradingPanel />
      </div>
      <div className="w-80 border-l border-gray-700 bg-surface-light flex-shrink-0 p-4 overflow-y-auto">
        <ReplayController />
      </div>
    </div>
  )
}
