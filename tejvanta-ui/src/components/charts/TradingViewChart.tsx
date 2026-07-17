import { useEffect, useRef, useState, useCallback } from 'react'
import type { ChartSettings } from './MultiChartLayout'
import type { PineScript } from '../../services/pineScriptEngine'
import { executePineScript } from '../../services/pineScriptEngine'
import {
  type MarketPhase, phaseLabel, smoothRSI, createRng, hashSymbol,
  generateInitialCandles, generateTickStream, TICK_INTERVAL as TICK_SECONDS, timeframeSeconds,
} from '../../services/marketEngine'
import type { OrderFlow } from '../../services/marketEngine'
import { detectPatterns } from '../../services/patternEngine'
import type { DetectedPattern, PatternAlert } from '../../services/patternEngine'
import { PatternPanel } from './PatternPanel'
import { computeIndicator, type IndicatorDef, type IndicatorOutput } from '../../services/indicatorEngine'
import { computeRenkoCandles, type RenkoConfig } from '../../services/renkoEngine'
import { TradeOverlayEngine } from '../../services/TradeOverlayEngine'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { closePosition } from '../../state/tradingSlice'

export type ChartType = 'candle' | 'renko' | 'line' | 'area' | 'bar'

const TICK_MS = TICK_SECONDS * 1000
const PAD = { top: 10, bottom: 26, left: 4, right: 54 }

interface Candle {
  time: number; open: number; high: number; low: number; close: number; volume: number
}

function fmtTime(ts: number, tf: string): string {
  const d = new Date(ts * 1000)
  if (tf === '5s' || tf === '1m') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  if (['5m', '15m', '30m', '1h'].includes(tf)) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function fmtPrice(p: number): string { return p >= 1000 ? p.toFixed(0) : p >= 10 ? p.toFixed(1) : p.toFixed(2) }

// --- per-symbol data cache so switching symbols doesn't restart from scratch ---
const candleCache = new Map<string, Candle[]>()
const stateCache = new Map<string, { price: number; phase: MarketPhase; rsiVal: number; tickCount: number; orderFlow: OrderFlow }>()

export function TradingViewChart({
  symbol, containerId = 'tv-chart', timeframe = '1D', chartType = 'candle', indicatorDefs = [],
  settings, pineScripts, onTradeFromChart,
}: {
  symbol: string; containerId?: string; timeframe?: string; chartType?: ChartType
  indicatorDefs?: IndicatorDef[]; settings?: ChartSettings; pineScripts?: PineScript[]
  onTradeFromChart?: (side: 'buy' | 'sell', price: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const candleDataRef = useRef<Candle[]>([])
  const renkoConfigRef = useRef<RenkoConfig>({ brickSize: 'fixed', fixedBrickPct: 0.05, atrPeriod: 14, atrMultiplier: 1.5, showWicks: false, showBrickVolume: false })
  const priceRef = useRef(0)
  const phaseRef = useRef<MarketPhase>('accumulation')
  const rsiFnRef = useRef<(prev: number, curr: number) => number>(smoothRSI())
  const rsiValRef = useRef(50)
  const tickCountRef = useRef(0)
  const orderFlowRef = useRef<OrderFlow>({ buyVolume: 0, sellVolume: 0, netImbalance: 0 })
  const rngRef = useRef<() => number>(createRng(hashSymbol(symbol)))
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchIdRef = useRef(0)
  const phaseDisplayRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const viewRef = useRef({ start: 0, count: 50 })
  const dragRef = useRef<{ dragging: boolean; startX: number; startStart: number }>({ dragging: false, startX: 0, startStart: 0 })
  const crosshairRef = useRef<{ x: number; y: number } | null>(null)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [patternAlerts, setPatternAlerts] = useState<PatternAlert[]>([])
  const [showPatterns, setShowPatterns] = useState(false)
  const [candleTimer, setCandleTimer] = useState('--')
  const [tooltip, setTooltip] = useState<{ time: string; o: string; h: string; l: string; c: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const patternsRef = useRef<DetectedPattern[]>([])
  const patPriceLinesRef = useRef<Array<{ price: number; color?: string; label: string }>>([])
  const optsRef = useRef(settings); optsRef.current = settings
  const indicatorDefsRef = useRef(indicatorDefs); indicatorDefsRef.current = indicatorDefs
  const indicatorOutputsRef = useRef<IndicatorOutput[]>([])
  const pineRef = useRef(pineScripts); pineRef.current = pineScripts
  const typeRef = useRef(chartType); typeRef.current = chartType
  const overlayEngineRef = useRef<TradeOverlayEngine>(new TradeOverlayEngine())
  const positions = useAppSelector(s => s.trading.positions)
  const orders = useAppSelector(s => s.trading.orders)
  const dispatch = useAppDispatch()
  const positionsRef = useRef(positions); positionsRef.current = positions
  const ordersRef = useRef(orders); ordersRef.current = orders

  // --- drawing ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const W = rect.width, H = rect.height
    if (W < 10 || H < 10) return
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr)

    const cd = candleDataRef.current
    if (cd.length === 0) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#9ca3af'; ctx.font = '13px monospace'; ctx.textAlign = 'center'; ctx.fillText('Loading...', W / 2, H / 2)
      return
    }

    const view = viewRef.current
    const total = cd.length
    if (view.start < 0) view.start = 0; if (view.start >= total - 1) view.start = Math.max(0, total - 2)
    if (view.count < 5) view.count = 5; if (view.count > total) view.count = total
    const endIdx = Math.min(view.start + view.count, total)
    const visible = cd.slice(view.start, endIdx); if (visible.length === 0) return

    const opts = optsRef.current
    const type = typeRef.current
    const isRenko = type === 'renko'
    const upColor = opts?.upColor || '#22c55e'
    const downColor = opts?.downColor || '#ef4444'
    const showVol = opts?.showVolume ?? false
    const indOutputs = indicatorOutputsRef.current
    const hasSeparate = indOutputs.some(o => o.pane === 'separate')
    const renkoWicks = opts?.renkoWicks ?? true

    // --- renko conversion (must happen before layout) ---
    const rc = renkoConfigRef.current
    rc.brickSize = opts?.renkoBrickSize || 'fixed'
    rc.showWicks = renkoWicks
    rc.fixedBrickPct = opts?.renkoBrickSize === 'fixed' ? (opts?.renkoBrickPct ?? 0.05) : (opts?.renkoBrickPct ?? 0.05)
    rc.atrMultiplier = opts?.renkoAtrMult ?? 1.5
    const chartData = isRenko ? computeRenkoCandles(visible, rc) : (visible as any)
    const items = chartData as any[]
    const renkoBrickCount = isRenko ? items.length : 0
    const renderCount = isRenko ? Math.max(renkoBrickCount, 5) : view.count
    const renderStart = isRenko ? 0 : view.start

    // layout
    const separateH = hasSeparate ? Math.max(40, (H - PAD.top - PAD.bottom) * (indOutputs.some(o => o.name.includes('ATR')) ? 0.28 : 0.22)) : 0
    const volH = showVol ? Math.max(20, (H - PAD.top - PAD.bottom) * 0.08) : 0
    const mainH = H - PAD.top - PAD.bottom - separateH - volH
    const cw = W - PAD.left - PAD.right
    if (mainH < 30 || cw < 20) return
    const pt = PAD.top, pl = PAD.left

    // price range
    let minP = Infinity, maxP = -Infinity
    for (const c of visible) {
      if (!isFinite(c.high) || !isFinite(c.low)) continue
      if (c.high > maxP) maxP = c.high; if (c.low < minP) minP = c.low
    }
    if (!isFinite(minP) || !isFinite(maxP) || minP === Infinity || maxP === -Infinity || maxP <= minP) {
      minP = 0; maxP = 1
    }
    const pad = (maxP - minP) * 0.08 || maxP * 0.01 || 1; minP -= pad; maxP += pad

    const candleW = Math.min(12, Math.max(2, cw / renderCount * 0.7))
    const xFor = (i: number) => pl + (i - renderStart) / renderCount * cw + candleW / 2
    const yFor = (p: number) => pt + mainH - (p - minP) / (maxP - minP) * mainH
    const separateTop = pt + mainH

    // background
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

    // grid
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
    const gLines = 6
    for (let i = 0; i <= gLines; i++) { const y = pt + mainH * i / gLines; ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(pl + cw, y); ctx.stroke() }
    const vStep = Math.max(1, Math.floor(items.length / Math.min(10, renderCount)))
    for (let i = 0; i < items.length; i += vStep) { const x = xFor(renderStart + i) - candleW / 2; ctx.beginPath(); ctx.moveTo(x, pt); ctx.lineTo(x, pt + mainH + separateH + volH); ctx.stroke() }

    // border
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(pl, pt, cw, mainH + separateH + volH)

    // --- chart data (candles, renko, line, area, bar) ---

    if (type === 'line' || type === 'area') {
      ctx.beginPath()
      for (let i = 0; i < items.length; i++) {
        const x = xFor(renderStart + i); const y = yFor(items[i].close)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = upColor; ctx.lineWidth = 2; ctx.stroke()
      if (type === 'area') {
        const lastX = xFor(renderStart + items.length - 1)
        ctx.lineTo(lastX, pt + mainH); ctx.lineTo(xFor(renderStart), pt + mainH); ctx.closePath()
        const g = ctx.createLinearGradient(0, pt, 0, pt + mainH)
        g.addColorStop(0, upColor + '33'); g.addColorStop(1, upColor + '02')
        ctx.fillStyle = g; ctx.fill()
      }
    } else if (type === 'bar') {
      for (let i = 0; i < items.length; i++) {
        const c = items[i]; const x = xFor(renderStart + i); const isUp = c.close >= c.open
        ctx.strokeStyle = isUp ? upColor : downColor; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, yFor(c.high)); ctx.lineTo(x, yFor(c.low)); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x - candleW * 0.4, yFor(c.open)); ctx.lineTo(x, yFor(c.open)); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x, yFor(c.close)); ctx.lineTo(x + candleW * 0.4, yFor(c.close)); ctx.stroke()
      }
    } else {
      // candle or renko
      for (let i = 0; i < items.length; i++) {
        const c = items[i]; const x = xFor(renderStart + i); const isUp = c.close >= c.open
        ctx.strokeStyle = isUp ? upColor : downColor; ctx.fillStyle = isUp ? upColor : downColor; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(x, yFor(c.high)); ctx.lineTo(x, yFor(c.low)); ctx.stroke()
        const bt = yFor(Math.max(c.open, c.close)), bb = yFor(Math.min(c.open, c.close)), bh = Math.max(1, bb - bt)
        if (isUp) ctx.fillRect(x - candleW / 2, bt, candleW, bh)
        else { ctx.fillRect(x - candleW / 2, bt, candleW, bh); ctx.strokeRect(x - candleW / 2 + 0.5, bt + 0.5, candleW - 1, bh - 1) }
      }
    }

    // --- indicators (engine-driven) ---
    const separateOutputs = indOutputs.filter(o => o.pane === 'separate' && o.data.length > 0)
    for (const out of indOutputs) {
      if (out.data.length === 0) continue
      if (out.pane === 'main') {
            drawLine(ctx, out.data as any, renderStart, renderCount, xFor, pt, mainH, minP, maxP, out.color, out.linewidth, pl, cw)
      }
    }
    // separate pane (RSI, ATR, etc.)
    if (separateOutputs.length > 0 && separateH > 20) {
      const sepTop = separateTop
      ctx.fillStyle = '#f3f4f6'; ctx.fillRect(pl, sepTop, cw, separateH)
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(pl, sepTop, cw, separateH)
      for (const out of separateOutputs) {
        const isRSI = out.name.startsWith('RSI')
        const sepMin = isRSI ? 0 : Math.min(...out.data.map(d => d.value)) * 0.9
        const sepMax = isRSI ? 100 : Math.max(...out.data.map(d => d.value)) * 1.1
        const sepY = (v: number) => sepTop + separateH - (v - sepMin) / (sepMax - sepMin) * separateH
        if (isRSI) {
          ctx.strokeStyle = '#fca5a5'; ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.moveTo(pl, sepY(70)); ctx.lineTo(pl + cw, sepY(70))
          ctx.moveTo(pl, sepY(30)); ctx.lineTo(pl + cw, sepY(30)); ctx.stroke(); ctx.setLineDash([])
        }
        ctx.beginPath()
        for (let i = 0; i < out.data.length; i++) {
          const idx = renderStart + (out.data.length - visible.length) + i
          const x = xFor(Math.max(renderStart, idx))
          const y = sepY(out.data[i].value)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = out.color; ctx.lineWidth = out.linewidth; ctx.stroke()
        if (isRSI) {
          ctx.textAlign = 'right'; ctx.font = '9px monospace'; ctx.fillStyle = '#4b5563'
          ctx.fillText('70', W - 4, sepY(70) + 3); ctx.fillText('30', W - 4, sepY(30) + 3)
          ctx.fillText('50', W - 4, sepY(50) + 3)
        }
        ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'left'; ctx.font = '8px monospace'
        ctx.fillText(out.name, pl + 3, sepTop + 10)
      }
    }

    // --- volume ---
    if (showVol && volH > 10) {
      const maxVol = Math.max(1, ...items.map(c => c.volume || 0))
      const volTop = pt + mainH + separateH
      ctx.fillStyle = '#f3f4f6'; ctx.fillRect(pl, volTop, cw, volH)
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(pl, volTop, cw, volH)
      for (let i = 0; i < items.length; i++) {
        const c = items[i]; const x = xFor(renderStart + i) - candleW / 2
        const vh = (c.volume || 0) / maxVol * (volH - 2)
        ctx.fillStyle = c.close >= c.open ? upColor + '66' : downColor + '66'
        ctx.fillRect(x, volTop + volH - 2 - vh, candleW, vh)
      }
    }

    // --- PineScript overlays ---
    const pineScripts = pineRef.current
    if (pineScripts && items.length > 0) {
      for (const script of pineScripts) {
        if (!script.enabled) continue
        try {
          const plots = executePineScript(script.code, items as any)
          for (const plot of plots) {
            if (plot.data.length === 0) continue
            drawLine(ctx, plot.data, renderStart, renderCount, xFor, pt, mainH, minP, maxP, plot.color, plot.linewidth, pl, cw)
          }
        } catch {}
      }
    }

    // --- pattern price lines ---
    for (const pline of patPriceLinesRef.current) {
      const y = yFor(pline.price)
      ctx.strokeStyle = pline.color || '#f97316'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(pl + cw, y); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = pline.color || '#f97316'; ctx.font = '9px monospace'; ctx.textAlign = 'left'
      ctx.fillText(pline.label, pl + 3, y - 2)
    }

    // --- trade overlay engine ---
    overlayEngineRef.current.render({
      ctx, view, candleData: cd, xFor, yFor, minP, maxP, mainH, pl, pt, cw, dpr,
    })

    // --- price axis ---
    ctx.textAlign = 'right'; ctx.font = '10px monospace'; ctx.fillStyle = '#4b5563'
    for (let i = 0; i <= gLines; i++) {
      const p = minP + (maxP - minP) * i / gLines; const y = pt + mainH - i / gLines * mainH
      ctx.fillText(fmtPrice(p), W - 4, y + 3)
    }

    // --- time axis ---
    ctx.textAlign = 'center'; ctx.font = '9px monospace'; ctx.fillStyle = '#6b7280'
    const tLabels = Math.min(8, items.length); const tStep = Math.max(1, Math.floor(items.length / tLabels))
    for (let i = 0; i < items.length; i += tStep) {
      const x = xFor(renderStart + i); ctx.fillText(fmtTime(items[i].time, timeframe), x, H - 5)
    }

    // --- crosshair ---
    if (crosshairRef.current) {
      const cx = crosshairRef.current.x, cy = crosshairRef.current.y
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(cx, pt); ctx.lineTo(cx, pt + mainH + separateH + volH); ctx.stroke()
      if (cy >= pt && cy <= pt + mainH) { ctx.beginPath(); ctx.moveTo(pl, cy); ctx.lineTo(pl + cw, cy); ctx.stroke() }
      ctx.setLineDash([])

      const candleIdx = Math.floor((cx - pl) / cw * renderCount) + renderStart
      const c = isRenko ? items[Math.min(candleIdx, items.length - 1)] : cd[Math.min(candleIdx, cd.length - 1)]
      if (c && candleIdx >= renderStart && candleIdx <= renderStart + renderCount) {
        const tx = Math.min(cx + 8, pl + cw - 100), ty = Math.max(pt + 2, cy - 50)
        ctx.fillStyle = '#ffffff'; ctx.fillRect(tx, ty, 96, 48)
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.strokeRect(tx, ty, 96, 48)
        ctx.font = '9px monospace'
        const lines = [fmtTime(c.time, timeframe), `O:${c.open.toFixed(2)}  H:${c.high.toFixed(2)}`, `C:${c.close.toFixed(2)}  L:${c.low.toFixed(2)}`]
        lines.forEach((l, i) => { ctx.fillStyle = i === 0 ? '#6b7280' : '#374151'; ctx.fillText(l, tx + 4, ty + 12 + i * 13) })
        setTooltip({ time: fmtTime(c.time, timeframe), o: c.open.toFixed(2), h: c.high.toFixed(2), l: c.low.toFixed(2), c: c.close.toFixed(2) })
      }
    }
  }, [timeframe])

  function drawLine(ctx: CanvasRenderingContext2D, data: Array<{ time: number; value: number }>, renderStart: number, renderCount: number, xFor: (i: number) => number, pt: number, mainH: number, minP: number, maxP: number, color: string, lw: number, pl: number, cw: number) {
    if (data.length < 2) return
    ctx.beginPath()
    let started = false
    for (const d of data) {
      const idx = Math.round((d.time - candleDataRef.current[0]?.time) / (candleDataRef.current[1]?.time - candleDataRef.current[0]?.time || 1))
      if (idx < renderStart || idx > renderStart + renderCount) continue
      const x = xFor(idx), y = pt + mainH - (d.value - minP) / (maxP - minP) * mainH
      started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true)
    }
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke()
  }

  // --- resize ---
  useEffect(() => {
    const ro = new ResizeObserver(() => { if (animRef.current) cancelAnimationFrame(animRef.current); animRef.current = requestAnimationFrame(draw) })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { ro.disconnect(); if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [draw])

  // --- mouse ---
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const v = viewRef.current; v.count = Math.max(5, Math.min(200, v.count + (e.deltaY > 0 ? 5 : -5))); requestAnimationFrame(draw) }
    const onMD = (e: MouseEvent) => { dragRef.current.dragging = true; dragRef.current.startX = e.clientX; dragRef.current.startStart = viewRef.current.start }
    const onMM = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(); crosshairRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      if (dragRef.current.dragging) { const dx = e.clientX - dragRef.current.startX; const ppc = (r.width - PAD.left - PAD.right) / viewRef.current.count; viewRef.current.start = Math.round(dragRef.current.startStart - dx / ppc) }
      requestAnimationFrame(draw)
    }
    const onMU = () => { dragRef.current.dragging = false }
    const onML = () => { crosshairRef.current = null; requestAnimationFrame(draw) }
    canvas.addEventListener('wheel', onWheel, { passive: false }); canvas.addEventListener('mousedown', onMD)
    window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU); canvas.addEventListener('mouseleave', onML)
    return () => { canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('mousedown', onMD); window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); canvas.removeEventListener('mouseleave', onML) }
  }, [draw])

  // --- chart init ---
  useEffect(() => {
    const container = containerRef.current; if (!container) return
    setError(null); const thisFetchId = ++fetchIdRef.current
    const cacheKey = `${symbol}_${timeframe}`
    const cachedCandles = candleCache.get(cacheKey)
    const cachedState = stateCache.get(cacheKey)

    if (cachedCandles && cachedCandles.length > 0 && cachedState) {
      candleDataRef.current = cachedCandles
      priceRef.current = cachedState.price
      phaseRef.current = cachedState.phase
      rsiValRef.current = cachedState.rsiVal
      tickCountRef.current = cachedState.tickCount
      orderFlowRef.current = cachedState.orderFlow
      rngRef.current = createRng(hashSymbol(symbol))
      rsiFnRef.current = smoothRSI()
      const endIdx = Math.max(0, cachedCandles.length - 50)
      viewRef.current = { start: endIdx, count: 50 }
      setCurrentPrice(cachedState.price)
      requestAnimationFrame(draw)
    } else {
      candleDataRef.current = []
      rngRef.current = createRng(hashSymbol(symbol)); rsiFnRef.current = smoothRSI(); rsiValRef.current = 50; tickCountRef.current = 0; orderFlowRef.current = { buyVolume: 0, sellVolume: 0, netImbalance: 0 }
      const initial = generateInitialCandles(symbol, timeframe, undefined)
      const data = initial.data as Candle[]
      if (thisFetchId !== fetchIdRef.current) return
      candleDataRef.current = data; priceRef.current = initial.price; phaseRef.current = initial.phase; rsiValRef.current = initial.rsi
      viewRef.current = { start: Math.max(0, data.length - 50), count: 50 }; setCurrentPrice(initial.price); requestAnimationFrame(draw)
    }

    const engine = overlayEngineRef.current
    engine.setOnAutoClose((positionId, type, price) => {
      const p = positionsRef.current.find(pp => pp.id === positionId)
      if (p) dispatch(closePosition(p.symbol))
    })

    const tickCallback = () => {
      if (thisFetchId !== fetchIdRef.current) return; const cd = candleDataRef.current; if (cd.length === 0) return
      const now = Math.floor(Date.now() / 1000); const interval = timeframeSeconds(timeframe); const candleTime = Math.floor(now / interval) * interval
      const result = generateTickStream(priceRef, phaseRef, rsiFnRef, rsiValRef, tickCountRef, orderFlowRef, rngRef, undefined)
      setCurrentPrice(result.price)
      const last = cd[cd.length - 1]
      if (last && candleTime === last.time) { last.high = Math.max(last.high, result.price); last.low = Math.min(last.low, result.price); last.close = result.price }
      else { cd.push({ time: candleTime, open: last ? last.close : result.price, high: result.price, low: result.price, close: result.price, volume: Math.round((result.buyVol + result.sellVol) * (0.5 + Math.random())) }) }
      if (phaseDisplayRef.current) phaseDisplayRef.current.textContent = phaseLabel(phaseRef.current)

      engine.syncFromRedux(positionsRef.current, ordersRef.current)
      engine.onTick(result.price, cd.length)

      if (tickCountRef.current % 6 === 0) {
        const r = detectPatterns(candleDataRef.current as any)
        if (JSON.stringify(r.patterns) !== JSON.stringify(patternsRef.current)) { patternsRef.current = r.patterns; setPatterns(r.patterns); setPatternAlerts(r.alerts); patPriceLinesRef.current = r.patterns.flatMap(p => p.overlay.levels || []) }
      }
      const defs = indicatorDefsRef.current
      if (defs.length > 0) indicatorOutputsRef.current = defs.flatMap(d => computeIndicator(d, cd as any))
      requestAnimationFrame(draw)
    }
    const computeIndicators = () => {
      const defs = indicatorDefsRef.current
      if (defs.length === 0) { indicatorOutputsRef.current = []; return }
      const cd = candleDataRef.current
      if (cd.length < 2) return
      indicatorOutputsRef.current = defs.flatMap(d => computeIndicator(d, cd as any))
    }
    computeIndicators()
    if (streamRef.current) clearInterval(streamRef.current)
    streamRef.current = setInterval(tickCallback, TICK_MS)
    return () => {
      const ck = `${symbol}_${timeframe}`
      candleCache.set(ck, candleDataRef.current)
      stateCache.set(ck, {
        price: priceRef.current,
        phase: phaseRef.current,
        rsiVal: rsiValRef.current,
        tickCount: tickCountRef.current,
        orderFlow: orderFlowRef.current,
      })
      if (streamRef.current) { clearInterval(streamRef.current); streamRef.current = null }
    }
  }, [symbol, timeframe, draw])

  // --- candle timer ---
  useEffect(() => {
    const interval = timeframeSeconds(timeframe); if (!interval) return
    const tick = () => { const now = Date.now(); const next = Math.ceil(now / (interval * 1000)) * (interval * 1000); const rem = Math.max(0, Math.round((next - now) / 1000)); setCandleTimer(rem >= 60 ? `${Math.floor(rem / 60)}m ${rem % 60}s` : `${rem}s`) }
    tick(); const id = setInterval(tick, 500); return () => clearInterval(id)
  }, [timeframe])

  const saveImage = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `${symbol}_${timeframe}.png`; a.click()
  }, [symbol, timeframe])

  const resetView = useCallback(() => {
    const cd = candleDataRef.current; if (cd.length === 0) return
    viewRef.current = { start: Math.max(0, cd.length - 50), count: 50 }; requestAnimationFrame(draw)
  }, [draw])

  if (error) return <div className="flex items-center justify-center h-full text-red-400 text-sm p-4">{error}</div>

  return (
    <div className="relative w-full h-full" onContextMenu={e => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }) }} onClick={() => setMenuPos(null)}>
      <div ref={containerRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
        <div ref={phaseDisplayRef} className="text-[10px] font-bold px-2 py-0.5 rounded text-white text-center bg-gray-700">{phaseLabel(phaseRef.current)} RSI:{rsiValRef.current.toFixed(0)}</div>
        <div className="text-[10px] text-gray-300 text-center font-mono">{currentPrice.toFixed(2)}</div>
        <div className="text-[9px] text-gray-400 text-center font-mono bg-gray-800/80 rounded px-1 py-0.5 border border-gray-700">{candleTimer}</div>
        <button onClick={() => setShowPatterns(v => !v)} className={`px-2 py-1 rounded text-xs font-bold shadow ${showPatterns ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} title="Pattern Detection"><span className="text-sm leading-none">△</span></button>
      </div>
      {showPatterns && <PatternPanel patterns={patterns} alerts={patternAlerts} onClose={() => setShowPatterns(false)} />}
      {menuPos && (
        <div className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 text-sm" style={{ left: menuPos.x, top: menuPos.y }} onClick={e => e.stopPropagation()}>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={() => { resetView(); setMenuPos(null) }}>Reset Chart</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={() => { saveImage(); setMenuPos(null) }}>Save as Image</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={() => { candleDataRef.current = []; requestAnimationFrame(draw); setMenuPos(null) }}>Clear Data</button>
        </div>
      )}
    </div>
  )
}
