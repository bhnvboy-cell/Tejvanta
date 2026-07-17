import { useState, useEffect, useCallback } from 'react'
import { loadRiskConfig, loadDailyState, loadDrawdownState, saveRiskConfig, saveDailyState, calculatePositionSize, getAdaptiveRiskPerTrade, checkTradeAllowed } from '../../services/riskEngine'
import type { RiskConfig, DailyRiskState, DrawdownState, PositionSizeResult } from '../../services/riskEngine'

export function RiskDashboard() {
  const [config, setConfig] = useState<RiskConfig>(loadRiskConfig)
  const [daily, setDaily] = useState<DailyRiskState>(loadDailyState)
  const [entryPrice, setEntryPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [posSize, setPosSize] = useState<PositionSizeResult | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  const equity = daily.currentEquity
  const ddState = loadDrawdownState(equity)

  const handleConfigChange = useCallback((key: keyof RiskConfig, value: number) => {
    const updated = { ...config, [key]: value }
    setConfig(updated)
    saveRiskConfig(updated)
  }, [config])

  const handleCalcSize = () => {
    const entry = parseFloat(entryPrice)
    const stop = parseFloat(stopPrice)
    if (!entry || !stop) return
    const result = calculatePositionSize(equity, entry, stop, config.defaultRiskPerTrade)
    setPosSize(result)
  }

  const remainingPct = config.dailyLossLimit * 100 - Math.abs(daily.pnlPercent)
  const tradeCheck = checkTradeAllowed(daily, config)
  const ddPct = ddState.maxDrawdown * 100

  return (
    <div className="bg-surface-light rounded-lg border border-gray-700 text-xs">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-300">Risk Dashboard</h3>
        <button onClick={() => setShowConfig(v => !v)} className="text-gray-500 hover:text-white text-[10px]">
          {showConfig ? 'Hide Config' : 'Config'}
        </button>
      </div>

      {showConfig && (
        <div className="px-3 py-2 border-b border-gray-700 space-y-2">
          <ConfigSlider label="Daily Loss Limit" value={config.dailyLossLimit * 100} min={1} max={10} step={0.5} unit="%" onChange={v => handleConfigChange('dailyLossLimit', v / 100)} />
          <ConfigSlider label="Max Drawdown" value={config.maxDrawdownLimit * 100} min={5} max={30} step={1} unit="%" onChange={v => handleConfigChange('maxDrawdownLimit', v / 100)} />
          <ConfigSlider label="Risk Per Trade" value={config.defaultRiskPerTrade * 100} min={0.25} max={3} step={0.25} unit="%" onChange={v => handleConfigChange('defaultRiskPerTrade', v / 100)} />
          <ConfigSlider label="Max Consecutive Losses" value={config.maxConsecutiveLosses} min={1} max={10} step={1} unit="" onChange={v => handleConfigChange('maxConsecutiveLosses', v)} />
          <ConfigSlider label="Min R:R Ratio" value={config.minRR} min={0.5} max={5} step={0.5} unit="" onChange={v => handleConfigChange('minRR', v)} />
        </div>
      )}

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Daily PnL" value={`${daily.pnl >= 0 ? '+' : ''}${daily.pnl.toFixed(0)}`} color={daily.pnl >= 0 ? 'text-green-400' : 'text-red-400'} />
          <StatBox label="Daily %" value={`${daily.pnlPercent >= 0 ? '+' : ''}${daily.pnlPercent.toFixed(2)}%`} color={daily.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'} />
          <StatBox label="Drawdown (Max)" value={`${(ddState.maxDrawdown * 100).toFixed(1)}%`} color={ddPct < 5 ? 'text-green-400' : ddPct < 10 ? 'text-yellow-400' : 'text-red-400'} />
          <StatBox label={`Remaining (${config.dailyLossLimit * 100}% limit)`} value={`${remainingPct.toFixed(1)}%`} color={remainingPct > 5 ? 'text-green-400' : remainingPct > 0 ? 'text-yellow-400' : 'text-red-400'} />
          <StatBox label="Trades Today" value={daily.trades.toString()} color="text-gray-300" />
          <StatBox label={`${daily.wins}W / ${daily.losses}L`} value={daily.trades > 0 ? `${(daily.wins / daily.trades * 100).toFixed(0)}%` : '---'} color="text-gray-300" />
        </div>

        {!tradeCheck.allowed && (
          <div className="px-2 py-1.5 bg-red-600/20 border border-red-700 rounded text-red-300 text-[10px] text-center">
            {tradeCheck.reason}
          </div>
        )}

        <div>
          <div className="text-gray-500 text-[10px] mb-1.5 font-medium">Position Sizer</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number" placeholder="Entry Price" value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white w-full"
            />
            <input
              type="number" placeholder="Stop Price" value={stopPrice}
              onChange={e => setStopPrice(e.target.value)}
              className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white w-full"
            />
          </div>
          <button onClick={handleCalcSize} className="w-full py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs font-medium text-white transition">
            Calculate Size
          </button>
          {posSize && (
            <div className="mt-2 p-2 bg-gray-800 rounded space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-gray-500">Risk Capital</span><span className="text-white font-mono">₹{posSize.riskCapital.toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Stop Distance</span><span className="text-white font-mono">{posSize.stopDistance.toFixed(2)} ({posSize.stopDistancePercent.toFixed(3)}%)</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="text-white font-mono">{posSize.quantity}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Margin Required</span><span className="text-white font-mono">₹{posSize.marginRequired.toFixed(0)}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className={`font-mono text-sm font-bold mt-0.5 ${color}`}>{value}</div>
    </div>
  )
}

function ConfigSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-[10px] w-28 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-tej-500 h-1"
      />
      <span className="text-white font-mono text-[10px] w-10 text-right">{value}{unit}</span>
    </div>
  )
}
