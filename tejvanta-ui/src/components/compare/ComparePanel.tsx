import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { addCompareSymbol, updateCompareSymbol, removeCompareSymbol } from '../../state/chartSettingsSlice'
import { useAppSelector as useRootSelector } from '../../hooks/useAppDispatch'

const LINE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4', '#f97316']
const LINE_WIDTHS = [1, 2, 3, 4]

export function ComparePanel() {
  const dispatch = useAppDispatch()
  const compareSymbols = useAppSelector(s => s.chartSettings.compareSymbols)
  const instruments = useRootSelector(s => s.market.instruments)
  const [symbol, setSymbol] = useState('')
  const [color, setColor] = useState('#22c55e')

  const handleAdd = () => {
    if (!symbol.trim() || compareSymbols.some(s => s.symbol === symbol.trim())) return
    dispatch(addCompareSymbol({
      symbol: symbol.trim(), color, lineWidth: 2, lineStyle: 'solid',
      normalizeTo100: false, percentageMode: false, visible: true, data: [],
    }))
    setSymbol('')
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-white">Compare Symbols</h3>
      <div className="flex gap-1">
        <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Ticker" className="flex-1 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 outline-none focus:border-tej-500"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
        <button onClick={handleAdd} className="px-2 py-1 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium">+</button>
      </div>
      {compareSymbols.length === 0 && <p className="text-[10px] text-gray-600">No symbols added</p>}
      {compareSymbols.map(s => (
        <div key={s.symbol} className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded border border-gray-700">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          <span className="text-xs text-white flex-1">{s.symbol}</span>
          <input type="color" value={s.color} onChange={e => dispatch(updateCompareSymbol({ symbol: s.symbol, changes: { color: e.target.value } }))} className="w-5 h-5 rounded cursor-pointer" />
          <button onClick={() => dispatch(removeCompareSymbol(s.symbol))} className="text-[10px] text-gray-500 hover:text-red-400">✕</button>
        </div>
      ))}
    </div>
  )
}
