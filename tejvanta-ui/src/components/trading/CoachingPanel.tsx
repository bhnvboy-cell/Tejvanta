import { useState, useEffect, useRef } from 'react'
import { evaluateAction, getCoachingStyle } from '../../services/coachingEngine'
import type { TraderAction, TraderState, CoachingFeedback } from '../../services/coachingEngine'

type LogEntry = CoachingFeedback & { time: string }

export function CoachingPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [muted, setMuted] = useState<string[]>([])
  const [traderState, setTraderState] = useState<TraderState>({
    currentPosition: null, dailyTrades: 0, dailyPnl: 0, consecutiveLosses: 0,
    equity: 400000, peakEquity: 400000, dailyLossLimit: 0.04, openOrders: 0, lastTradeTime: 0,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const simulateAction = () => {
    const action: TraderAction = {
      type: 'entry', time: Math.floor(Date.now() / 1000),
      symbol: 'RELIANCE', side: 'buy', price: 2850 + Math.random() * 50,
      quantity: Math.floor(Math.random() * 50 + 10),
      stopLoss: Math.random() > 0.3 ? 2800 : undefined,
      takeProfit: Math.random() > 0.3 ? 2950 : undefined,
    }
    const feedback = evaluateAction(action, traderState)
    const newLogs = feedback.map(f => ({ ...f, time: new Date().toLocaleTimeString() }))
    setLogs(prev => [...newLogs, ...prev].slice(0, 200))
    setTraderState(s => ({ ...s, dailyTrades: s.dailyTrades + 1, lastTradeTime: action.time }))
  }

  const simulateLoss = () => {
    setTraderState(s => ({
      ...s,
      dailyTrades: s.dailyTrades + 1,
      dailyPnl: s.dailyPnl - (10000 + Math.random() * 15000),
      consecutiveLosses: s.consecutiveLosses + 1,
      lastTradeTime: Math.floor(Date.now() / 1000),
    }))
    const action: TraderAction = {
      type: 'entry', time: Math.floor(Date.now() / 1000),
      symbol: 'RELIANCE', side: 'buy', price: 2850, quantity: 50,
      stopLoss: 2800, takeProfit: 2950,
    }
    const feedback = evaluateAction(action, {
      ...traderState,
      dailyPnl: traderState.dailyPnl - 12000,
      consecutiveLosses: traderState.consecutiveLosses + 1,
    })
    setLogs(prev => [...feedback.map(f => ({ ...f, time: new Date().toLocaleTimeString() })), ...prev].slice(0, 200))
  }

  const resetState = () => {
    setTraderState({
      currentPosition: null, dailyTrades: 0, dailyPnl: 0, consecutiveLosses: 0,
      equity: 400000, peakEquity: 400000, dailyLossLimit: 0.04, openOrders: 0, lastTradeTime: 0,
    })
  }

  const activeCount = logs.filter(l => !muted.includes(l.ruleId)).length
  const criticalCount = logs.filter(l => !muted.includes(l.ruleId) && l.severity === 'critical').length

  const summaryCards = [
    { label: 'Daily PnL', value: `₹${traderState.dailyPnl.toFixed(0)}`, color: traderState.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Trades', value: traderState.dailyTrades.toString(), color: 'text-white' },
    { label: 'Consec Loss', value: traderState.consecutiveLosses.toString(), color: traderState.consecutiveLosses >= 3 ? 'text-red-400' : 'text-white' },
    { label: 'Alerts', value: activeCount.toString(), color: criticalCount > 0 ? 'text-red-400' : 'text-yellow-400' },
  ]

  return (
    <div className="h-full flex flex-col text-xs bg-surface">
      <div className="flex items-center border-b border-gray-700 px-2 py-1.5 bg-surface-light">
        <span className="font-semibold text-gray-200">AI Coach</span>
        <span className="ml-2 px-1.5 py-0.5 bg-tej-600/20 text-tej-400 rounded text-[9px]">alpha</span>
        <div className="flex-1" />
        <button onClick={resetState} className="text-[9px] text-gray-500 hover:text-white mr-1">Reset</button>
        <button onClick={simulateAction} className="px-2 py-0.5 bg-tej-600 hover:bg-tej-500 rounded text-[9px] text-white font-medium">Test Entry</button>
        <button onClick={simulateLoss} className="px-2 py-0.5 bg-red-700 hover:bg-red-600 rounded text-[9px] text-white font-medium ml-1">Sim Loss</button>
      </div>

      <div className="grid grid-cols-4 gap-1 px-2 py-1.5 border-b border-gray-700">
        {summaryCards.map(c => (
          <div key={c.label} className="text-center">
            <div className={`font-mono text-[10px] font-bold ${c.color}`}>{c.value}</div>
            <div className="text-gray-500 text-[8px] truncate">{c.label}</div>
          </div>
        ))}
      </div>

      {criticalCount > 0 && (
        <div className="mx-2 mt-1 px-2 py-1 bg-red-600/20 border border-red-700 rounded text-red-300 text-[10px] flex items-center gap-1">
          ⚠ {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} — review before next trade
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {logs.length === 0 && (
          <div className="text-gray-500 text-center py-6">
            Coaching engine ready<br />
            <span className="text-[9px]">Simulate a trade to see alerts</span>
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className={`px-2 py-1 rounded border ${getCoachingStyle(log.severity)}`}>
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium">{log.message}</div>
                <div className="text-[9px] opacity-70 mt-0.5">{log.suggestion}</div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-[8px] opacity-50">{log.time}</span>
                <button
                  onClick={() => setMuted(prev => prev.includes(log.ruleId) ? prev : [...prev, log.ruleId])}
                  className="text-[8px] opacity-50 hover:opacity-100"
                >
                  mute
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
