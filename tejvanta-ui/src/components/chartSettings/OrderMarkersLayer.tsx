import { useEffect, useRef } from 'react'
import { useAppSelector } from '../../hooks/useAppDispatch'
import type { RiskOverlay } from '../../types/chartSettings'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
  candleDataRef: React.MutableRefObject<Array<{ time: number; open: number; high: number; low: number; close: number }>>
  viewRef: React.MutableRefObject<{ start: number; count: number }>
  priceRange: { min: number; max: number }
}

export function OrderMarkersLayer({ containerRef, candleDataRef, viewRef, priceRange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orders = useAppSelector(s => s.trading.orders)
  const positions = useAppSelector(s => s.trading.positions)
  const riskOverlay = useAppSelector(s => s.chartSettings.riskOverlay)

  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const r = container.getBoundingClientRect()
    canvas.width = r.width * dpr; canvas.height = r.height * dpr
    ctx.scale(dpr, dpr)

    const view = viewRef.current; const cd = candleDataRef.current
    if (cd.length === 0) return

    const cw = r.width - 60, ch = r.height
    const minP = priceRange.min, maxP = priceRange.max
    const xFor = (i: number) => (i - view.start) / view.count * cw + 4
    const yFor = (p: number) => ch - (p - minP) / (maxP - minP) * ch

    if (riskOverlay && riskOverlay.visible) {
      const ey = yFor(riskOverlay.entryPrice); const sy = yFor(riskOverlay.stopLoss); const ty = yFor(riskOverlay.takeProfit)
      ctx.fillStyle = riskOverlay.color + '15'
      ctx.fillRect(4, Math.min(ey, ty), cw, Math.abs(ey - ty))
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(4, sy); ctx.lineTo(4 + cw, sy); ctx.stroke()
      ctx.fillStyle = '#ef4444'; ctx.font = '9px monospace'; ctx.fillText(`SL ${riskOverlay.stopLoss.toFixed(2)}`, 8, sy - 2)
      ctx.strokeStyle = '#22c55e'; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(4, ty); ctx.lineTo(4 + cw, ty); ctx.stroke()
      ctx.fillStyle = '#22c55e'; ctx.fillText(`TP ${riskOverlay.takeProfit.toFixed(2)}`, 8, ty - 2)
      ctx.strokeStyle = '#6366f1'; ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(4, ey); ctx.lineTo(4 + cw, ey); ctx.stroke()
      ctx.fillStyle = '#6366f1'; ctx.fillText(`Entry ${riskOverlay.entryPrice.toFixed(2)}`, 8, ey - 2)
    }

    for (const o of orders) {
      if (o.status === 'FILLED' || o.status === 'OPEN') {
        const t = new Date(o.createdAt).getTime() / 1000
        const idx = cd.findIndex(c => Math.abs(c.time - t) < 120)
        if (idx < view.start || idx > view.start + view.count) continue
        const x = xFor(idx); const y = yFor(o.avgFillPrice || o.price)
        ctx.fillStyle = o.side === 'BUY' ? '#22c55e' : '#ef4444'
        const hw = 6, hh = 6
        if (o.side === 'BUY') { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.closePath(); ctx.fill() }
        else { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.closePath(); ctx.fill() }
        ctx.fillStyle = '#1f2937'; ctx.font = '8px monospace'
        ctx.fillText(`${o.side} ${o.quantity}`, x + (o.side === 'BUY' ? 8 : -50), y + 3)
      }
    }

    for (const p of positions) {
      const idx = cd.length - 1
      if (idx < view.start || idx > view.start + view.count) continue
      const x = xFor(idx); const y = yFor(p.avgPrice)
      const side = p.unrealizedPnL >= 0 ? 'LONG' : 'SHORT'
      ctx.fillStyle = p.unrealizedPnL >= 0 ? '#22c55e' : '#ef4444'
      const hw = 6, hh = 6
      if (p.unrealizedPnL >= 0) { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x + hw, y); ctx.lineTo(x, y + hh); ctx.closePath(); ctx.fill() }
      else { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.lineTo(x - hw, y); ctx.lineTo(x, y + hh); ctx.closePath(); ctx.fill() }
      ctx.fillStyle = '#1f2937'; ctx.font = '8px monospace'
      ctx.fillText(`${side} ${p.quantity} ${p.symbol}`, x + (p.unrealizedPnL >= 0 ? 8 : -70), y + 3)
    }
  })

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" style={{ left: '36px' }} />
}
