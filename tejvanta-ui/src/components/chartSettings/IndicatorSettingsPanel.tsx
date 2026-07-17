import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { addIndicator, updateIndicator, removeIndicator, toggleIndicator } from '../../state/chartSettingsSlice'
import type { IndicatorConfig } from '../../types/chartSettings'

const BUILTIN_INDICATORS = [
  { name: 'SMA', params: { length: 20 }, color: '#f59e0b', type: 'builtin' as const },
  { name: 'SMA', params: { length: 50 }, color: '#3b82f6', type: 'builtin' as const },
  { name: 'EMA', params: { length: 20 }, color: '#a855f7', type: 'builtin' as const },
  { name: 'RSI', params: { length: 14 }, color: '#ec4899', type: 'builtin' as const },
  { name: 'Bollinger Bands', params: { length: 20, multiplier: 2 }, color: '#f97316', type: 'builtin' as const },
  { name: 'ATR', params: { length: 14 }, color: '#06b6d4', type: 'builtin' as const },
  { name: 'Supertrend', params: { length: 10, multiplier: 3 }, color: '#22c55e', type: 'builtin' as const },
  { name: 'Volume', params: {}, color: '#6366f1', type: 'builtin' as const },
]

const LINE_STYLES: IndicatorConfig['style']['style'][] = ['line', 'dashed', 'dotted']

export function IndicatorSettingsPanel() {
  const dispatch = useAppDispatch()
  const indicators = useAppSelector(s => s.chartSettings.indicators)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const handleAdd = (base: typeof BUILTIN_INDICATORS[number]) => {
    const params: Record<string, number | string | boolean> = {}
    for (const [k, v] of Object.entries(base.params)) { if (v !== undefined) params[k] = v }
    dispatch(addIndicator({
      id: `${base.name}_${Date.now()}`,
      name: base.name,
      type: base.type,
      enabled: true,
      params,
      style: { color: base.color, width: 1.5, style: 'line', visible: true },
      outputIndex: 0,
      pane: base.name === 'RSI' ? 'separate' : 'main',
    }))
    setAddOpen(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white">Indicators</h3>
        <button onClick={() => setAddOpen(v => !v)} className="px-2 py-0.5 bg-tej-600 hover:bg-tej-500 rounded text-[10px] text-white font-medium">{addOpen ? 'Cancel' : '+ Add'}</button>
      </div>

      {addOpen && (
        <div className="bg-gray-800 rounded border border-gray-700 p-2 space-y-1">
          {BUILTIN_INDICATORS.map((b, i) => (
            <button key={i} onClick={() => handleAdd(b)} className="w-full text-left px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-300 hover:text-white transition flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
              {b.name} ({Object.values(b.params).join(', ')})
            </button>
          ))}
        </div>
      )}

      {indicators.length === 0 && !addOpen && <p className="text-[10px] text-gray-600">No indicators added. Click "+ Add" to add one.</p>}

      {indicators.map(ind => (
        <div key={ind.id} className="bg-gray-800/50 rounded border border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <button onClick={() => dispatch(toggleIndicator(ind.id))} className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${ind.enabled ? 'bg-tej-600 border-tej-600' : 'border-gray-600'}`}>{ind.enabled && <span className="text-white text-[8px]">✓</span>}</button>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ind.style.color }} />
            <span className="text-xs text-white flex-1">{ind.name}</span>
            <button onClick={() => setEditingId(editingId === ind.id ? null : ind.id)} className="text-[10px] text-gray-500 hover:text-white px-1">⚙</button>
            <button onClick={() => dispatch(removeIndicator(ind.id))} className="text-[10px] text-gray-500 hover:text-red-400 px-1">✕</button>
          </div>
          {editingId === ind.id && (
            <div className="px-3 pb-2 space-y-2 border-t border-gray-700 pt-2">
              {Object.entries(ind.params).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-16 capitalize">{key}</span>
                  <input type="number" value={val as number} onChange={e => dispatch(updateIndicator({ id: ind.id, changes: { params: { ...ind.params, [key]: parseFloat(e.target.value) } } }))} className="flex-1 bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded border border-gray-600" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-16">Color</span>
                <input type="color" value={ind.style.color} onChange={e => dispatch(updateIndicator({ id: ind.id, changes: { style: { ...ind.style, color: e.target.value } } }))} className="w-6 h-6 rounded cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-16">Width</span>
                <input type="range" min={0.5} max={4} step={0.5} value={ind.style.width} onChange={e => dispatch(updateIndicator({ id: ind.id, changes: { style: { ...ind.style, width: parseFloat(e.target.value) } } }))} className="flex-1" />
                <span className="text-[10px] text-gray-500 font-mono w-4 text-right">{ind.style.width}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-16">Style</span>
                <select value={ind.style.style} onChange={e => dispatch(updateIndicator({ id: ind.id, changes: { style: { ...ind.style, style: e.target.value as any } } }))} className="bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                  {LINE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-16">Pane</span>
                <select value={ind.pane} onChange={e => dispatch(updateIndicator({ id: ind.id, changes: { pane: e.target.value as 'main' | 'separate' } }))} className="bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded border border-gray-600">
                  <option value="main">Main Chart</option>
                  <option value="separate">Separate Pane</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
