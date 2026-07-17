import { useState, useEffect } from 'react'
import { replayService } from '../../services/replayService'
import { signalRService } from '../../services/signalRService'
import { useAppSelector } from '../../hooks/useAppDispatch'
import type { ReplayState } from '../../types/OptionsContract'

export function ReplayController() {
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const instruments = useAppSelector(s => s.market.instruments)
  const instrument = instruments.find(i => i.symbol === selectedSymbol)

  const replayPnL = useAppSelector(s => s.replay.replayPnL)
  const entryPrice = useAppSelector(s => s.replay.entryPrice)
  const side = useAppSelector(s => s.replay.side)
  const quantity = useAppSelector(s => s.replay.quantity)
  const lastRealizedPnL = useAppSelector(s => s.replay.lastRealizedPnL)
  const sessionPnL = useAppSelector(s => s.replay.sessionPnL)

  const [state, setState] = useState<ReplayState | null>(null)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    const unsub = signalRService.onReplayState((s: ReplayState) => {
      if (instrument && s.instrumentId === instrument.id) {
        setState(s)
      }
    })
    return () => unsub()
  }, [instrument])

  const handleStart = async () => {
    if (!instrument) return
    try {
      const from = new Date(fromDate)
      from.setHours(9, 15, 0, 0)
      const to = new Date(toDate)
      to.setHours(15, 30, 0, 0)
      await replayService.start(instrument.id, from.toISOString(), to.toISOString(), speed)
    } catch (err) {
      console.error('Replay start failed:', err)
    }
  }

  const handleStop = async () => {
    if (!instrument) return
    await replayService.stop(instrument.id)
    setState(null)
  }

  const handlePauseResume = async () => {
    if (!instrument || !state) return
    if (state.isPlaying) {
      await replayService.pause(instrument.id)
    } else {
      await replayService.resume(instrument.id)
    }
  }

  return (
    <div className="bg-surface-light rounded-lg border border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Market Replay - {selectedSymbol}</h3>

      {!state?.isPlaying && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Speed</label>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
              <option value={8}>8x</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {!state?.isPlaying ? (
          <button
            onClick={handleStart}
            disabled={!instrument}
            className="flex-1 py-2 bg-tej-600 hover:bg-tej-500 disabled:opacity-50 rounded text-sm font-medium transition"
          >
            {state ? 'Resume' : 'Start'} Replay
          </button>
        ) : (
          <button onClick={handlePauseResume} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium">
            Pause
          </button>
        )}
        <button
          onClick={handleStop}
          disabled={!state}
          className="px-4 py-2 bg-red-600/50 hover:bg-red-600 disabled:opacity-50 rounded text-sm"
        >
          Stop
        </button>
      </div>

      {state && (
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Progress</span>
            <span className="text-white">{state.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-tej-500 h-1.5 rounded-full transition-all"
              style={{ width: `${state.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span>Current Time</span>
            <span className="text-white font-mono">
              {new Date(state.currentTime).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Ticks</span>
            <span className="text-white font-mono">{state.tickCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Speed</span>
            <span className="text-white font-mono">{state.speed}x</span>
          </div>
          {(entryPrice != null && quantity != null && side) && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span>Trade</span>
                <span className={`font-mono font-semibold ${side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {side} {quantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entry</span>
                <span className="text-white font-mono">₹{entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>PnL</span>
                <span className={`font-mono font-semibold ${replayPnL != null && replayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {replayPnL != null ? `₹${replayPnL.toFixed(2)}` : '--'}
                </span>
              </div>
            </div>
          )}
          {(!entryPrice || !side) && lastRealizedPnL != null && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span>Last Trade PnL</span>
                <span className={`font-mono font-semibold ${lastRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{lastRealizedPnL.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {sessionPnL !== 0 && (
            <div className="flex justify-between">
              <span>Session PnL</span>
              <span className={`font-mono font-semibold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{sessionPnL.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
