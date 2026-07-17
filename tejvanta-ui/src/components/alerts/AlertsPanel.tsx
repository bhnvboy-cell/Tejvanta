import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { addAlertCondition, removeAlertCondition, toggleAlertCondition, clearAlertHistory, setMuted } from '../../state/alertsSlice'
import type { AlertCondition } from '../../types/chartSettings'

const OPERATORS: AlertCondition['operator'][] = ['crosses', 'crosses-above', 'crosses-below', 'greater-than', 'less-than', 'equals']
const SOURCES: AlertCondition['source'][] = ['close', 'open', 'high', 'low', 'volume']

export function AlertsPanel() {
  const dispatch = useAppDispatch()
  const { conditions, history, muted } = useAppSelector(s => s.alerts)
  const [tab, setTab] = useState<'conditions' | 'history'>('conditions')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ type: AlertCondition['type']; operator: AlertCondition['operator']; value1: number; value2: number; source: AlertCondition['source']; message: string; sound: string; once: boolean }>({
    type: 'price', operator: 'greater-than', value1: 0, value2: 0, source: 'close', message: '', sound: 'beep', once: false,
  })

  const handleSubmit = () => {
    dispatch(addAlertCondition({
      symbol: '', type: form.type, operator: form.operator, value1: form.value1, value2: form.type === 'condition' ? form.value2 : undefined,
      source: form.type === 'price' ? form.source : undefined, message: form.message || `Price ${form.operator} ${form.value1}`,
      sound: form.sound, once: form.once, expiration: null, enabled: true,
    }))
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <button onClick={() => setTab('conditions')} className={`text-xs px-2 py-0.5 rounded ${tab === 'conditions' ? 'bg-tej-600 text-white' : 'text-gray-400'}`}>Conditions ({conditions.length})</button>
        <button onClick={() => setTab('history')} className={`text-xs px-2 py-0.5 rounded ${tab === 'history' ? 'bg-tej-600 text-white' : 'text-gray-400'}`}>History ({history.length})</button>
        <div className="flex-1" />
        <button onClick={() => dispatch(setMuted(!muted))} className={`text-xs px-2 py-0.5 rounded ${muted ? 'bg-red-600/30 text-red-400' : 'bg-gray-700 text-gray-400'}`}>{muted ? '🔇' : '🔔'}</button>
      </div>

      {tab === 'conditions' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button onClick={() => setShowForm(v => !v)} className="w-full px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium">{showForm ? 'Cancel' : '+ New Alert'}</button>

          {showForm && (
            <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AlertCondition['type'] }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600">
                <option value="price">Price Alert</option>
                <option value="indicator">Indicator Alert</option>
                <option value="condition">Condition Alert</option>
              </select>
              <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value as AlertCondition['operator'] }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600">
                {OPERATORS.map(op => <option key={op} value={op}>{op.replace(/-/g, ' ')}</option>)}
              </select>
              {form.type === 'price' && (
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as AlertCondition['source'] }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600">
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <input type="number" placeholder="Value 1" value={form.value1} onChange={e => setForm(f => ({ ...f, value1: parseFloat(e.target.value) }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />
              {form.type === 'condition' && <input type="number" placeholder="Value 2" value={form.value2} onChange={e => setForm(f => ({ ...f, value2: parseFloat(e.target.value) }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />}
              <input type="text" placeholder="Alert message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600" />
              <label className="flex items-center gap-2 text-[10px] text-gray-400"><input type="checkbox" checked={form.once} onChange={e => setForm(f => ({ ...f, once: e.target.checked }))} className="accent-tej-500" /> Fire once</label>
              <button onClick={handleSubmit} className="w-full px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium">Create Alert</button>
            </div>
          )}

          {conditions.length === 0 && <p className="text-[10px] text-gray-600 text-center py-4">No alert conditions set</p>}
          {conditions.map(c => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded border border-gray-700">
              <button onClick={() => dispatch(toggleAlertCondition(c.id))} className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${c.enabled ? 'bg-tej-600 border-tej-600' : 'border-gray-600'}`}>{c.enabled && <span className="text-white text-[8px]">✓</span>}</button>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white truncate">{c.message}</div>
                <div className="text-[8px] text-gray-500">{c.type} · {c.operator} · {c.value1}{c.value2 !== undefined ? `, ${c.value2}` : ''} · triggered {c.triggeredCount}x</div>
              </div>
              <button onClick={() => dispatch(removeAlertCondition(c.id))} className="text-[10px] text-gray-500 hover:text-red-400 px-1">✕</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => dispatch(clearAlertHistory())} className="text-[10px] text-gray-500 hover:text-white mb-1">Clear All</button>
          {history.length === 0 && <p className="text-[10px] text-gray-600 text-center py-4">No alert history</p>}
          {history.slice().reverse().map((h, i) => (
            <div key={i} className="text-[9px] text-gray-400 px-2 py-1 bg-gray-800/30 rounded">
              <span className="text-gray-500">{new Date(h.time).toLocaleTimeString()}</span> {h.message} @ {h.price.toFixed(2)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
