import { useState, useMemo } from 'react'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { runBacktest, generateBacktestReport } from '../../services/backtestingEngine'
import type { BacktestResult, BacktestStrategy } from '../../services/backtestingEngine'

export function StrategyTesterPanel() {
  const candles = useAppSelector(s => s.market.candles)
  const [slPct, setSlPct] = useState(2)
  const [tpPct, setTpPct] = useState(4)
  const [initialCapital, setInitialCapital] = useState(100000)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [showReport, setShowReport] = useState(false)

  const strategy: BacktestStrategy = useMemo(() => ({
    id: 'sma-crossover', name: 'SMA Crossover',
    entryRule: (c, i, data) => {
      if (i < 21) return null
      const sma20 = data.slice(i - 20, i).reduce((s, x) => s + x.close, 0) / 20
      const sma50 = data.slice(Math.max(0, i - 50), i).reduce((s, x) => s + x.close, 0) / Math.min(50, i)
      if (i > 0) {
        const prev20 = data.slice(i - 21, i - 1).reduce((s, x) => s + x.close, 0) / 20
        const prev50 = data.slice(Math.max(0, i - 51), i - 1).reduce((s, x) => s + x.close, 0) / Math.min(50, i - 1)
        if (sma20 > sma50 && prev20 <= prev50) return 'buy'
        if (sma20 < sma50 && prev20 >= prev50) return 'sell'
      }
      return null
    },
    exitRule: () => null,
    stopLoss: slPct, takeProfit: tpPct,
    useTrailingSL: false, trailingSLActivation: 0, trailingSLDistance: 0,
  }), [slPct, tpPct])

  const handleRun = () => {
    const data = candles as any[]
    if (data.length < 50) return
    const r = runBacktest(data, strategy, initialCapital)
    setResult(r)
    setShowReport(true)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-white">Strategy Tester</h3>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500">SL %</label>
          <input type="number" value={slPct} onChange={e => setSlPct(parseFloat(e.target.value))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">TP %</label>
          <input type="number" value={tpPct} onChange={e => setTpPct(parseFloat(e.target.value))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500">Initial Capital</label>
          <input type="number" value={initialCapital} onChange={e => setInitialCapital(parseFloat(e.target.value))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />
        </div>
      </div>

      <button onClick={handleRun} disabled={(candles as any[]).length < 50} className="w-full px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium disabled:opacity-40">Run Backtest (SMA Crossover)</button>

      {showReport && result && (
        <div className="bg-gray-800/50 border border-gray-700 rounded p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <Stat label="Net Profit" value={`${result.netProfit.toFixed(0)}`} color={result.netProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="Win Rate" value={`${(result.winRate * 100).toFixed(1)}%`} color={result.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="Profit Factor" value={result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)} color={result.profitFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400'} />
            <Stat label="Avg R" value={result.avgR.toFixed(2)} color={result.avgR >= 1 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="Max DD" value={`${result.maxDrawdown.toFixed(1)}%`} color={result.maxDrawdown < 15 ? 'text-green-400' : 'text-red-400'} />
            <Stat label="Sharpe" value={result.sharpeRatio.toFixed(2)} color={result.sharpeRatio >= 1 ? 'text-green-400' : 'text-yellow-400'} />
            <Stat label="Trades" value={result.totalTrades.toString()} color="text-white" />
            <Stat label="Expectancy" value={result.expectancy.toFixed(2)} color={result.expectancy > 0 ? 'text-green-400' : 'text-red-400'} />
          </div>
          <div className="text-[10px] text-gray-500">{result.winningTrades}W / {result.losingTrades}L</div>

          {result.equityCurve.length > 1 && (
            <div className="bg-white rounded h-16 flex items-end gap-px px-0.5 overflow-hidden">
              {result.equityCurve.map((p, i) => {
                const vals = result.equityCurve.map(x => x.equity)
                const mn = Math.min(...vals), mx = Math.max(...vals)
                const h = mx > mn ? (p.equity - mn) / (mx - mn) * 14 : 4
                return <div key={i} className="flex-1 bg-tej-500 rounded-t" style={{ height: `${Math.max(2, h)}px` }} title={`${new Date(p.time * 1000).toLocaleDateString()}: ${p.equity.toFixed(0)}`} />
              })}
            </div>
          )}

          <button onClick={() => { const r = generateBacktestReport(result); navigator.clipboard.writeText(r) }} className="text-[10px] text-gray-500 hover:text-white">Copy Report</button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="bg-gray-800 rounded px-2 py-1"><div className={`text-xs font-bold font-mono ${color}`}>{value}</div><div className="text-[8px] text-gray-500">{label}</div></div>
}
