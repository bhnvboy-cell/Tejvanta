import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { updateAdvanced, resetAdvanced } from '../../state/chartSettingsSlice'
import type { TimezoneId, Precision, CrosshairStyle } from '../../types/chartSettings'

const TIMEZONES: { id: TimezoneId; label: string }[] = [
  { id: 'America/New_York', label: 'New York (EST)' },
  { id: 'America/Chicago', label: 'Chicago (CST)' },
  { id: 'America/Denver', label: 'Denver (MST)' },
  { id: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { id: 'Europe/London', label: 'London (GMT)' },
  { id: 'Europe/Berlin', label: 'Berlin (CET)' },
  { id: 'Europe/Moscow', label: 'Moscow (MSK)' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { id: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { id: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { id: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { id: 'Pacific/Auckland', label: 'Auckland (NZST)' },
  { id: 'UTC', label: 'UTC' },
]

const PRECISIONS: Precision[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]

type Tab = 'symbol' | 'status-line' | 'scales' | 'appearance' | 'trading' | 'events' | 'alerts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'symbol', label: 'Symbol' },
  { id: 'status-line', label: 'Status Line' },
  { id: 'scales', label: 'Scales' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'trading', label: 'Trading' },
  { id: 'events', label: 'Events' },
  { id: 'alerts', label: 'Alerts' },
]

interface Props { onClose: () => void; symbol: string }

export function ChartSettingsModal({ onClose, symbol }: Props) {
  const dispatch = useAppDispatch()
  const s = useAppSelector(s => s.chartSettings.advanced)
  const [tab, setTab] = useState<Tab>('symbol')

  const update = (changes: Partial<typeof s>) => dispatch(updateAdvanced(changes))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[720px] max-h-[80vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="w-44 bg-gray-800/50 border-r border-gray-700 p-2 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition ${tab === t.id ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>{t.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'symbol' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Symbol Settings</h3>
              <LabelRow label="Ticker">
                <span className="text-white font-mono text-xs">{symbol}</span>
              </LabelRow>
              <LabelRow label="Precision">
                <select value={s.precision} onChange={e => update({ precision: parseInt(e.target.value) as Precision })} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">{PRECISIONS.map(p => <option key={p} value={p}>{p}</option>)}</select>
              </LabelRow>
              <LabelRow label="Dividend Adjustment">
                <input type="checkbox" checked={s.dividendAdjustment} onChange={e => update({ dividendAdjustment: e.target.checked })} className="accent-tej-500" />
              </LabelRow>
            </div>
          )}
          {tab === 'status-line' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Status Line</h3>
              <LabelRow label="Timezone">
                <select value={s.timezone} onChange={e => update({ timezone: e.target.value as TimezoneId })} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 max-w-[200px]">{TIMEZONES.map(tz => <option key={tz.id} value={tz.id}>{tz.label}</option>)}</select>
              </LabelRow>
              <LabelRow label="Watermark">
                <input type="checkbox" checked={s.watermarkEnabled} onChange={e => update({ watermarkEnabled: e.target.checked })} className="accent-tej-500" />
              </LabelRow>
              {s.watermarkEnabled && (
                <>
                  <LabelRow label="Watermark Text">
                    <input type="text" value={s.watermark} onChange={e => update({ watermark: e.target.value })} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 w-full" />
                  </LabelRow>
                  <LabelRow label="Watermark Color">
                    <input type="color" value={s.watermarkColor} onChange={e => update({ watermarkColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                  </LabelRow>
                  <LabelRow label="Watermark Size">
                    <input type="range" min={16} max={96} value={s.watermarkFontSize} onChange={e => update({ watermarkFontSize: parseInt(e.target.value) })} className="w-full" />
                  </LabelRow>
                </>
              )}
            </div>
          )}
          {tab === 'scales' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Scales</h3>
              <LabelRow label="Vertical Grid">
                <input type="checkbox" checked={s.gridVertLines} onChange={e => update({ gridVertLines: e.target.checked })} className="accent-tej-500" />
              </LabelRow>
              {s.gridVertLines && <LabelRow label="Vert Grid Color"><input type="color" value={s.gridVertColor} onChange={e => update({ gridVertColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" /></LabelRow>}
              <LabelRow label="Horizontal Grid">
                <input type="checkbox" checked={s.gridHorzLines} onChange={e => update({ gridHorzLines: e.target.checked })} className="accent-tej-500" />
              </LabelRow>
              {s.gridHorzLines && <LabelRow label="Horz Grid Color"><input type="color" value={s.gridHorzColor} onChange={e => update({ gridHorzColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" /></LabelRow>}
              <LabelRow label="Session Breaks">
                <input type="checkbox" checked={s.sessionBreaks} onChange={e => update({ sessionBreaks: e.target.checked })} className="accent-tej-500" />
              </LabelRow>
              {s.sessionBreaks && <LabelRow label="Break Color"><input type="color" value={s.sessionBreakColor} onChange={e => update({ sessionBreakColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" /></LabelRow>}
            </div>
          )}
          {tab === 'appearance' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Appearance</h3>
              <LabelRow label="Background">
                <input type="color" value={s.background} onChange={e => update({ background: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Up Candle Body">
                <input type="color" value={s.upColor} onChange={e => update({ upColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Down Candle Body">
                <input type="color" value={s.downColor} onChange={e => update({ downColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Up Border">
                <input type="color" value={s.borderUpColor} onChange={e => update({ borderUpColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Down Border">
                <input type="color" value={s.borderDownColor} onChange={e => update({ borderDownColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Up Wick">
                <input type="color" value={s.wickUpColor} onChange={e => update({ wickUpColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Down Wick">
                <input type="color" value={s.wickDownColor} onChange={e => update({ wickDownColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
              <LabelRow label="Color Bars Based On">
                <select value={s.colorBarsBasedOnPreviousClose ? 'prev-close' : 'open-close'} onChange={e => update({ colorBarsBasedOnPreviousClose: e.target.value === 'prev-close' })} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
                  <option value="open-close">Open / Close</option>
                  <option value="prev-close">Previous Close</option>
                </select>
              </LabelRow>
              <LabelRow label="Crosshair Style">
                <select value={s.crosshairStyle} onChange={e => update({ crosshairStyle: e.target.value as CrosshairStyle })} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600">
                  <option value="cross">Cross</option>
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                </select>
              </LabelRow>
              <LabelRow label="Crosshair Color">
                <input type="color" value={s.crosshairColor} onChange={e => update({ crosshairColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
              </LabelRow>
            </div>
          )}
          {tab === 'trading' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Trading</h3>
              <p className="text-xs text-gray-500">Order entry settings and trade panel preferences.</p>
            </div>
          )}
          {tab === 'events' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Events</h3>
              <p className="text-xs text-gray-500">Configure earnings, dividends, and economic event markers on the chart.</p>
            </div>
          )}
          {tab === 'alerts' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Alert Settings</h3>
              <p className="text-xs text-gray-500">Manage notification preferences and default alert behavior.</p>
            </div>
          )}
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <button onClick={onClose} className="px-4 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium">OK</button>
            <button onClick={() => dispatch(resetAdvanced())} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Reset Defaults</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
