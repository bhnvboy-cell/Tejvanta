import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { clearCandles } from '../../state/replaySlice'
import { DrawingToolbar } from '../drawing/DrawingToolbar'
import { DrawingLayer } from '../drawing/DrawingLayer'

interface TickData {
  timestamp: string
  price: number
}

interface TooltipData {
  time: string
  open: string
  high: string
  low: string
  close: string
}

function sma(values: number[], period: number) {
  const result: { time: number; value: number }[] = []
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += values[i - j]
    result.push({ time: 0, value: sum / period })
  }
  return result
}

class TickBuffer {
  private ticks: TickData[] = []
  add(t: TickData) { this.ticks.push(t) }
  flush() { const t = [...this.ticks]; this.ticks = []; return t }
  get length() { return this.ticks.length }
}

export interface ReplayChartHandle {
  applyTick: (tick: TickData) => void
  resetChart: () => void
  clearData: () => void
  toggleSma20: () => void
  toggleSma50: () => void
}

export const ReplayChart = forwardRef<ReplayChartHandle, {}>(function ReplayChart(_, ref) {
  const dispatch = useAppDispatch()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)
  const sma20SeriesRef = useRef<any>(null)
  const sma50SeriesRef = useRef<any>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const lastCandleTimeRef = useRef<number | null>(null)

  const tickBufferRef = useRef(new TickBuffer())
  const hasSetDataRef = useRef(false)
  const sma20Visible = useRef(true)
  const sma50Visible = useRef(true)

  const candles = useAppSelector(s => s.replay.candles)
  const mode = useAppSelector(s => s.replay.mode)

  const handleResetChart = useCallback(() => {
    chartRef.current?.timeScale().fitContent()
    setMenuPos(null)
  }, [])

  const applyTick = useCallback((tick: TickData) => {
    tickBufferRef.current.add(tick)
  }, [])

  const resetChart = useCallback(() => {
    chartRef.current?.timeScale().fitContent()
  }, [])

  const clearData = useCallback(() => {
    tickBufferRef.current.flush()
    hasSetDataRef.current = false
    lastCandleTimeRef.current = null
    dispatch(clearCandles())
    try { candleSeriesRef.current?.setData([]) } catch {}
    try { sma20SeriesRef.current?.setData([]) } catch {}
    try { sma50SeriesRef.current?.setData([]) } catch {}
  }, [dispatch])

  const toggleSma20 = useCallback(() => {
    sma20Visible.current = !sma20Visible.current
    sma20SeriesRef.current?.applyOptions({ visible: sma20Visible.current })
  }, [])

  const toggleSma50 = useCallback(() => {
    sma50Visible.current = !sma50Visible.current
    sma50SeriesRef.current?.applyOptions({ visible: sma50Visible.current })
  }, [])

  useImperativeHandle(ref, () => ({ applyTick, resetChart, clearData, toggleSma20, toggleSma50 }), [applyTick, resetChart, clearData, toggleSma20, toggleSma50])

  useEffect(() => {
    if (!containerRef.current) return

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null }

    const container = containerRef.current
    container.innerHTML = ''

    const chart = createChart(container, {
      layout: { background: { type: ColorType.Solid, color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: '#22c55e', width: 1, style: 2, labelBackgroundColor: '#166534' },
        horzLine: { color: '#22c55e', width: 1, style: 2, labelBackgroundColor: '#166534' },
      },
      timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: '#334155' },
      autoSize: true,
    })

    chart.timeScale().applyOptions({
      rightOffset: 10,
      barSpacing: 8,
      minBarSpacing: 5,
      fixLeftEdge: true,
      lockVisibleTimeRangeOnResize: true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 2, minMove: 0.05 },
    })

    const sma20Series = chart.addSeries(LineSeries, {
      color: '#facc15', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    })

    const sma50Series = chart.addSeries(LineSeries, {
      color: '#60a5fa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
    })

    chart.subscribeCrosshairMove((param: any) => {
      if (!param.time || !param.point) { setTooltip(null); return }
      const data = param.seriesData.get(candleSeries)
      if (!data) { setTooltip(null); return }

      setTooltip({
        time: new Date((param.time as number) * 1000).toLocaleString(),
        open: data.open?.toFixed(2),
        high: data.high?.toFixed(2),
        low: data.low?.toFixed(2),
        close: data.close?.toFixed(2),
      })
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    sma20SeriesRef.current = sma20Series
    sma50SeriesRef.current = sma50Series
    hasSetDataRef.current = false
    lastCandleTimeRef.current = null
    tickBufferRef.current = new TickBuffer()

    return () => {
      try { chart.remove() } catch {}
      chartRef.current = null
      candleSeriesRef.current = null
      sma20SeriesRef.current = null
      sma50SeriesRef.current = null
    }
  }, [])

  useEffect(() => {
    const candleSeries = candleSeriesRef.current
    if (!candleSeries || candles.length === 0) return

    const chartData = candles.map(c => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))

    if (!hasSetDataRef.current) {
      candleSeries.setData(chartData)
      hasSetDataRef.current = true
      if (chartData.length > 0) {
        lastCandleTimeRef.current = chartData[chartData.length - 1].time
      }
      try { chartRef.current?.priceScale('right').applyOptions({ autoScale: false }) } catch {}
    } else {
      const last = chartData[chartData.length - 1]
      if (lastCandleTimeRef.current == null || last.time > lastCandleTimeRef.current) {
        candleSeries.update(last)
        lastCandleTimeRef.current = last.time
      }
    }

    const closes = chartData.map(d => d.close)
    const sma20Series = sma20SeriesRef.current
    const sma50Series = sma50SeriesRef.current

    if (sma20Series && closes.length >= 20) {
      const sma20Data = sma(closes, 20).map((p, i) => ({
        time: chartData[19 + i].time,
        value: p.value,
      }))
      sma20Series.setData(sma20Data)
    }

    if (sma50Series && closes.length >= 50) {
      const sma50Data = sma(closes, 50).map((p, i) => ({
        time: chartData[49 + i].time,
        value: p.value,
      }))
      sma50Series.setData(sma50Data)
    }
  }, [candles])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setMenuPos({ x: e.clientX, y: e.clientY })
    }
    const handleClick = () => { setMenuPos(null) }

    el.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', handleClick)

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 right-3 z-30 flex gap-1">
        <DrawingToolbar />
      </div>
      <div ref={containerRef} className="w-full h-full" />
      <DrawingLayer chartRef={chartRef} containerRef={containerRef} />
      {tooltip && (
        <div className="absolute top-2 left-2 bg-gray-900/90 border border-gray-600 rounded px-3 py-2 text-xs font-mono space-y-1 pointer-events-none z-10">
          <div className="text-gray-400">{tooltip.time}</div>
          <div className="grid grid-cols-2 gap-x-3">
            <span className="text-gray-400">O:</span><span className="text-right text-white">{tooltip.open}</span>
            <span className="text-gray-400">H:</span><span className="text-right text-green-400">{tooltip.high}</span>
            <span className="text-gray-400">L:</span><span className="text-right text-red-400">{tooltip.low}</span>
            <span className="text-gray-400">C:</span><span className="text-right text-white">{tooltip.close}</span>
          </div>
        </div>
      )}
      {menuPos && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-50 py-1 text-sm"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={handleResetChart}>
            Reset Chart
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={() => {
            const chart = chartRef.current
            if (chart && chart.takeScreenshot) {
              chart.takeScreenshot().then?.((blob: Blob) => {
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'chart.png'
                a.click()
              }).catch(() => {})
            }
            setMenuPos(null)
          }}>
            Save as Image
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 whitespace-nowrap" onClick={() => {
            clearData()
            setMenuPos(null)
          }}>
            Clear Data
          </button>
        </div>
      )}
    </div>
  )
})
