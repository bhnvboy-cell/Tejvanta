import { useState, useEffect, useRef, useCallback } from 'react'
import { TradingViewChart, type ChartType } from './TradingViewChart'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { usePaperTrading } from '../../hooks/usePaperTrading'
import { SearchTicker } from '../layout/SearchTicker'
import { DrawingToolbar } from '../drawing/DrawingToolbar'
import { DrawingLayer } from '../drawing/DrawingLayer'
import { PineScriptEditor } from './PineScriptEditor'
import { ChartSettingsModal } from '../chartSettings/ChartSettingsModal'
import { IndicatorSettingsPanel } from '../chartSettings/IndicatorSettingsPanel'
import { StrategyTesterPanel } from '../chartSettings/StrategyTesterPanel'
import { ComparePanel } from '../compare/ComparePanel'
import { AlertsPanel } from '../alerts/AlertsPanel'
import { OptionsPayoffDiagram } from '../options/OptionsPayoffDiagram'
import type { PineScript } from '../../services/pineScriptEngine'
import { defaultScripts } from '../../services/pineScriptEngine'
import { loadScripts } from '../../services/bhavcopy'
import { addDailyActivity } from '../../services/learningEngine'
import { type IndicatorDef, type IndicatorType, BUILTIN_INDICATORS } from '../../services/indicatorEngine'

const TIMEFRAMES = ['5s', '1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W']
const CHART_TYPES: { id: ChartType; label: string; title: string }[] = [
  { id: 'candle', label: 'C', title: 'Candle' }, { id: 'renko', label: 'R', title: 'Renko' },
  { id: 'line', label: 'L', title: 'Line' }, { id: 'area', label: 'A', title: 'Area' }, { id: 'bar', label: 'B', title: 'Bar' },
]


export interface ChartSettings {
  upColor: string; downColor: string; renkoBrickSize: 'fixed' | 'atr'; renkoBrickPct: number; renkoAtrMult: number; renkoWicks: boolean; showVolume: boolean
}

const defaultSettings: ChartSettings = {
  upColor: '#22c55e', downColor: '#ef4444', renkoBrickSize: 'fixed', renkoBrickPct: 0.05, renkoAtrMult: 1.5, renkoWicks: false, showVolume: false,
}

type RightTab = 'indicators' | 'compare' | 'strategy' | 'alerts' | 'options'

export function MultiChartLayout() {
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const dispatch = useAppSelector
  const [layout, setLayout] = useState<1 | 2 | 4>(1)
  const defaultLayout = useAppSelector(s => s.settings.defaultLayout) as 1 | 2 | 4
  const [charts, setCharts] = useState<string[]>(() => [selectedSymbol])
  const [timeframe, setTimeframe] = useState('15m')
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [indicatorDefs, setIndicatorDefs] = useState<IndicatorDef[]>(() => BUILTIN_INDICATORS.filter(d => d.type === 'sma' || d.type === 'ema'))
  const [indicatorOpen, setIndicatorOpen] = useState(false)
  const [settings, setSettings] = useState<ChartSettings>(defaultSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [advSettingsOpen, setAdvSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [pineScripts, setPineScripts] = useState<PineScript[]>(() => loadScripts('tv_pine_scripts', defaultScripts))
  const [pineOpen, setPineOpen] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const { placeOrder, loading } = usePaperTrading()
  const instruments = useAppSelector(s => s.market.instruments)
  const priceRangeRef = useRef({ min: 24000, max: 26000 })
  const candleDataRef = useRef<Array<{ time: number; open: number; high: number; low: number; close: number }>>([])
  const viewRef = useRef({ start: 0, count: 50 })

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000)
  }, [])

  const handleChartTrade = useCallback(async (side: string, price: number, sym: string) => {
    const instrument = instruments.find(i => i.symbol === sym)
    if (!instrument) { showToast('error', `Instrument ${sym} not found`); return }
    try {
      await placeOrder({
        instrumentId: instrument.id, side: side.toUpperCase() as 'BUY' | 'SELL', orderType: 'MARKET',
        price: 0, quantity: 1, stopLoss: 0, takeProfit: 0,
      })
      addDailyActivity('trades')
      showToast('success', `${side.toUpperCase()} 1 ${sym} @ ${price}`)
    } catch (e: any) { showToast('error', e?.message || 'Order failed') }
  }, [instruments, placeOrder, showToast])

  const actualLayout = defaultLayout || layout

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    const closeInd = (e: MouseEvent) => { if (!(e.target as Element)?.closest?.('.indicator-dropdown')) setIndicatorOpen(false) }
    document.addEventListener('mousedown', closeInd)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('mousedown', closeInd) }
  }, [])

  const currentSymbolRef = useRef(selectedSymbol)
  currentSymbolRef.current = selectedSymbol

  const changeLayout = (l: 1 | 2 | 4) => {
    setLayout(l); const sym = currentSymbolRef.current
    if (l === 1) setCharts([sym]); else if (l === 2) setCharts([sym, 'BANKNIFTY']); else setCharts([sym, 'BANKNIFTY', 'RELIANCE', 'TCS'])
  }

  useEffect(() => {
    setCharts(prev => { const sym = currentSymbolRef.current; if (prev.length === 1 && prev[0] !== sym) return [sym]; if (prev.length > 1) { const u = [...prev]; u[0] = sym; return u }; return prev })
  }, [selectedSymbol])

  const toggleIndicatorDef = (def: IndicatorDef) => {
    setIndicatorDefs(prev => {
      const idx = prev.findIndex(d => d.type === def.type && JSON.stringify(d.params) === JSON.stringify(def.params))
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      return [...prev, def]
    })
  }
  const isIndicatorActive = (def: IndicatorDef) => indicatorDefs.some(d => d.type === def.type && JSON.stringify(d.params) === JSON.stringify(def.params))
  const gridClass = actualLayout === 1 ? 'grid-cols-1' : 'grid-cols-2'

  const RIGHT_TABS: { id: RightTab; label: string; icon: string }[] = [
    { id: 'indicators', label: 'Indicators', icon: '📊' },
    { id: 'compare', label: 'Compare', icon: '🔗' },
    { id: 'strategy', label: 'Strategy', icon: '📈' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'options', label: 'Options', icon: '📋' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1 bg-surface-light border-b border-gray-700 text-xs shrink-0 flex-wrap min-h-[32px]">
        <SearchTicker placeholder={selectedSymbol} />
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <div className="flex gap-px">{TIMEFRAMES.map(tf => (<button key={tf} onClick={() => setTimeframe(tf)} className={`px-1.5 py-1 rounded font-medium whitespace-nowrap ${timeframe === tf ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>{tf}</button>))}</div>
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <div className="flex gap-px">{CHART_TYPES.map(ct => (<button key={ct.id} onClick={() => setChartType(ct.id)} title={ct.title} className={`px-1.5 py-1 rounded font-medium ${chartType === ct.id ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>{ct.label}</button>))}</div>
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <div className="relative indicator-dropdown">
          <button onClick={() => setIndicatorOpen(v => !v)} className="px-1.5 py-1 rounded font-medium text-gray-400 hover:text-white hover:bg-gray-700" title="Indicators">📊 Ind</button>
          {indicatorOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 w-52 p-2 text-xs indicator-dropdown">
              {BUILTIN_INDICATORS.map((def, i) => {
                const active = isIndicatorActive(def)
                return (
                  <button key={i} onClick={() => toggleIndicatorDef(def)} className={`w-full text-left px-2 py-1.5 rounded transition flex items-center gap-2 ${active ? 'bg-tej-600/20 text-tej-400' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: def.color }} />
                    <span className="flex-1">{def.type.toUpperCase()}</span>
                    <span className="text-[9px] text-gray-500">{Object.values(def.params).join(',')}</span>
                    {active && <span className="text-tej-400 text-[10px]">✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {([1, 2, 4] as const).map(n => (<button key={n} onClick={() => changeLayout(n)} className={`px-1.5 py-1 rounded font-medium ${(defaultLayout || layout) === n ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>{n}x{n}</button>))}
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <button onClick={() => setPineOpen(!pineOpen)} className={`px-1.5 py-1 rounded font-medium ${pineOpen ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>Pine</button>
        <div className="w-px h-4 bg-gray-600 mx-1" />
        <div ref={settingsRef} className="relative">
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="px-1.5 py-1 rounded font-medium text-gray-400 hover:text-white hover:bg-gray-700" title="Chart settings">⚙</button>
          {settingsOpen && (
            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 w-64 p-3 text-xs">
              <div className="text-gray-300 font-semibold mb-2 border-b border-gray-600 pb-1">Chart Settings</div>
              <div className="space-y-2">
                <div className="text-gray-400 font-medium mt-1">Up/Down Colors</div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 w-8">Up</label>
                  <input type="color" value={settings.upColor} onChange={e => setSettings(s => ({ ...s, upColor: e.target.value }))} className="w-8 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                  <label className="text-gray-400 w-8">Down</label>
                  <input type="color" value={settings.downColor} onChange={e => setSettings(s => ({ ...s, downColor: e.target.value }))} className="w-8 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                </div>
                {chartType === 'renko' && (<><div className="text-gray-400 font-medium mt-2">Renko</div><div className="flex items-center gap-2"><label className="text-gray-400 w-16">Mode</label><div className="flex gap-1"><button onClick={() => setSettings(s => ({ ...s, renkoBrickSize: 'fixed' as const }))} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${settings.renkoBrickSize === 'fixed' ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>Fixed</button><button onClick={() => setSettings(s => ({ ...s, renkoBrickSize: 'atr' as const }))} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${settings.renkoBrickSize === 'atr' ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>ATR</button></div></div>{settings.renkoBrickSize === 'fixed' ? (<div className="flex items-center gap-2"><label className="text-gray-400 w-16">Brick %</label><input type="range" min="0.01" max="1" step="0.01" value={settings.renkoBrickPct} onChange={e => setSettings(s => ({ ...s, renkoBrickPct: +e.target.value }))} className="flex-1 accent-tej-500" /><span className="text-white w-8 text-right">{settings.renkoBrickPct}%</span></div>) : (<div className="flex items-center gap-2"><label className="text-gray-400 w-16">ATR Mult</label><input type="range" min="0.5" max="5" step="0.5" value={settings.renkoAtrMult} onChange={e => setSettings(s => ({ ...s, renkoAtrMult: +e.target.value }))} className="flex-1 accent-tej-500" /><span className="text-white w-8 text-right">{settings.renkoAtrMult}x</span></div>)}<div className="flex items-center gap-2"><label className="text-gray-400 w-16">Wicks</label><button onClick={() => setSettings(s => ({ ...s, renkoWicks: !s.renkoWicks }))} className={`px-2 py-0.5 rounded text-xs font-medium ${settings.renkoWicks ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{settings.renkoWicks ? 'ON' : 'OFF'}</button></div></>)}
                <div className="text-gray-400 font-medium mt-2">Volume</div>
                <div className="flex items-center gap-2"><label className="text-gray-400 w-16">Show</label><button onClick={() => setSettings(s => ({ ...s, showVolume: !s.showVolume }))} className={`px-2 py-0.5 rounded text-xs font-medium ${settings.showVolume ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{settings.showVolume ? 'ON' : 'OFF'}</button></div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <button onClick={() => { setSettingsOpen(false); setAdvSettingsOpen(true) }} className="w-full px-2 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-medium">Advanced Settings</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-h-0">
          <div ref={chartContainerRef} className={`w-full h-full grid ${gridClass} gap-px bg-gray-700`}>
            {charts.map((sym, i) => (
              <div key={`${sym}-${i}`} className="bg-surface relative min-h-0">
                <TradingViewChart
                  symbol={sym} containerId={`chart-${i}`} timeframe={timeframe}
                  chartType={chartType} indicatorDefs={indicatorDefs} settings={settings}
                  pineScripts={pineScripts} onTradeFromChart={(side, price) => handleChartTrade(side, price, sym)}
                />
              </div>
            ))}
            <DrawingLayer containerRef={chartContainerRef} />
          </div>
          <div className="absolute left-2 top-2 z-30">
            <DrawingToolbar />
          </div>

        </div>
        {pineOpen && (
          <div className="w-72 border-l border-gray-700 flex-shrink-0">
            <PineScriptEditor scripts={pineScripts} onChange={setPineScripts} />
          </div>
        )}
        {rightTab && (
          <div className="w-72 border-l border-gray-700 flex-shrink-0 flex flex-col">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700 bg-gray-800/50">
              {RIGHT_TABS.map(t => (
                <button key={t.id} onClick={() => setRightTab(rightTab === t.id ? null : t.id)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition ${rightTab === t.id ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === 'indicators' && <IndicatorSettingsPanel />}
              {rightTab === 'compare' && <ComparePanel />}
              {rightTab === 'strategy' && <StrategyTesterPanel />}
              {rightTab === 'alerts' && <AlertsPanel />}
              {rightTab === 'options' && <OptionsPayoffDiagram />}
            </div>
          </div>
        )}
      </div>

      {advSettingsOpen && <ChartSettingsModal onClose={() => setAdvSettingsOpen(false)} symbol={selectedSymbol} />}

      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
          {toast.msg}
        </div>
      )}
      {loading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-3 py-1 bg-tej-600 text-white rounded shadow-xl text-xs font-medium">Placing order...</div>
      )}
    </div>
  )
}
