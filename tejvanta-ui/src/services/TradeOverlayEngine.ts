import type { Position, Order } from '../types/Order'
import type { RiskOverlay } from '../types/chartSettings'

export interface OverlayPosition {
  id: number
  symbol: string
  side: 'LONG' | 'SHORT'
  quantity: number
  entryPrice: number
  currentPrice: number
  stopLoss: number
  takeProfit: number
  unrealizedPnL: number
  pnlPercent: number
  status: 'ACTIVE' | 'CLOSED'
  closedAtCandle?: number
}

export interface OverlayColors {
  buy: string
  sell: string
  sl: string
  tp: string
  entry: string
  pnlPositive: string
  pnlNegative: string
  zoneBuy: string
  zoneSell: string
}

export const DEFAULT_OVERLAY_COLORS: OverlayColors = {
  buy: '#22c55e',
  sell: '#ef4444',
  sl: '#f97316',
  tp: '#22c55e',
  entry: '#6366f1',
  pnlPositive: '#22c55e',
  pnlNegative: '#ef4444',
  zoneBuy: 'rgba(34,197,94,0.08)',
  zoneSell: 'rgba(239,68,68,0.08)',
}

export interface OverlayConfig {
  showEntryMarker: boolean
  showSLLine: boolean
  showTPLine: boolean
  showPositionLine: boolean
  showSLZone: boolean
  showTPZone: boolean
  showPnLLabel: boolean
  showTradeHistory: boolean
  dynamicSL: boolean
  dynamicSLTrailPct: number
  autoCloseOnSLTP: boolean
  colors: OverlayColors
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  showEntryMarker: true,
  showSLLine: true,
  showTPLine: true,
  showPositionLine: true,
  showSLZone: false,
  showTPZone: false,
  showPnLLabel: true,
  showTradeHistory: true,
  dynamicSL: false,
  dynamicSLTrailPct: 0.5,
  autoCloseOnSLTP: true,
  colors: { ...DEFAULT_OVERLAY_COLORS },
}

export interface SLTPResult {
  positionId: number
  type: 'SL' | 'TP'
  price: number
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  view: { start: number; count: number }
  candleData: Array<{ time: number; open: number; high: number; low: number; close: number }>
  xFor: (i: number) => number
  yFor: (p: number) => number
  minP: number
  maxP: number
  mainH: number
  pl: number
  pt: number
  cw: number
  dpr: number
}

export class TradeOverlayEngine {
  private config: OverlayConfig
  private positions: Map<number, OverlayPosition> = new Map()
  private tradeHistory: OverlayPosition[] = []
  private onAutoClose: ((positionId: number, type: 'SL' | 'TP', price: number) => void) | null = null

  constructor(config?: Partial<OverlayConfig>) {
    this.config = { ...DEFAULT_OVERLAY_CONFIG, ...config }
  }

  setOnAutoClose(cb: (positionId: number, type: 'SL' | 'TP', price: number) => void) {
    this.onAutoClose = cb
  }

  updateConfig(cfg: Partial<OverlayConfig>) {
    Object.assign(this.config, cfg)
  }

  attachPosition(pos: OverlayPosition) {
    this.positions.set(pos.id, { ...pos })
  }

  attachPositions(positions: OverlayPosition[]) {
    for (const p of positions) this.attachPosition(p)
  }

  detachPosition(positionId: number) {
    this.positions.delete(positionId)
  }

  clearAll() {
    this.positions.clear()
    this.tradeHistory = []
  }

  syncFromRedux(positions: Position[], orders: Order[]) {
    const active = new Map<number, OverlayPosition>()
    for (const p of positions) {
      const order = orders.find(o => o.instrumentId === p.instrumentId && (o.status === 'FILLED' || o.status === 'OPEN'))
      const existing = this.positions.get(p.id)
      active.set(p.id, {
        id: p.id,
        symbol: p.symbol,
        side: p.quantity > 0 ? 'LONG' : 'SHORT',
        quantity: Math.abs(p.quantity),
        entryPrice: p.avgPrice,
        currentPrice: existing?.currentPrice ?? p.currentPrice,
        stopLoss: existing?.stopLoss ?? order?.stopLoss ?? 0,
        takeProfit: order?.takeProfit ?? 0,
        unrealizedPnL: p.unrealizedPnL,
        pnlPercent: p.pnlPercent,
        status: 'ACTIVE',
      })
    }
    this.positions = active
  }

  toRiskOverlay(positionId: number): RiskOverlay | null {
    const pos = this.positions.get(positionId)
    if (!pos) return null
    return {
      entryPrice: pos.entryPrice,
      stopLoss: pos.stopLoss,
      takeProfit: pos.takeProfit,
      quantity: pos.quantity,
      direction: pos.side === 'LONG' ? 'long' : 'short',
      visible: true,
      color: pos.side === 'LONG' ? this.config.colors.buy : this.config.colors.sell,
    }
  }

  onTick(price: number, candleCount?: number): SLTPResult[] {
    const results: SLTPResult[] = []
    for (const [id, pos] of this.positions) {
      if (pos.status !== 'ACTIVE') continue
      if (pos.stopLoss > 0) {
        const hit = pos.side === 'LONG' ? price <= pos.stopLoss : price >= pos.stopLoss
        if (hit) {
          results.push({ positionId: id, type: 'SL', price: pos.stopLoss })
          if (this.config.autoCloseOnSLTP) {
            this.onAutoClose?.(id, 'SL', pos.stopLoss)
            const hist = { ...pos, status: 'CLOSED' as const, currentPrice: pos.stopLoss, closedAtCandle: candleCount }
            this.tradeHistory.push(hist)
            this.positions.delete(id)
            continue
          }
        }
      }
      if (pos.takeProfit > 0) {
        const hit = pos.side === 'LONG' ? price >= pos.takeProfit : price <= pos.takeProfit
        if (hit) {
          results.push({ positionId: id, type: 'TP', price: pos.takeProfit })
          if (this.config.autoCloseOnSLTP) {
            this.onAutoClose?.(id, 'TP', pos.takeProfit)
            const hist = { ...pos, status: 'CLOSED' as const, currentPrice: pos.takeProfit, closedAtCandle: candleCount }
            this.tradeHistory.push(hist)
            this.positions.delete(id)
            continue
          }
        }
      }
      if (this.config.dynamicSL && pos.stopLoss > 0 && pos.side === 'LONG') {
        const trailPrice = pos.currentPrice * (1 - this.config.dynamicSLTrailPct / 100)
        if (trailPrice > pos.stopLoss) {
          pos.stopLoss = Math.round(trailPrice * 100) / 100
        }
      } else if (this.config.dynamicSL && pos.stopLoss > 0 && pos.side === 'SHORT') {
        const trailPrice = pos.currentPrice * (1 + this.config.dynamicSLTrailPct / 100)
        if (trailPrice < pos.stopLoss) {
          pos.stopLoss = Math.round(trailPrice * 100) / 100
        }
      }
      pos.currentPrice = price
    }
    return results
  }

  render(ctx: RenderContext) {
    const { ctx: c, view, candleData, xFor, yFor, minP, maxP, mainH, pl, pt, cw } = ctx

    for (const [, pos] of this.positions) {
      if (pos.status !== 'ACTIVE') continue
      this.renderPositionOverlay(c, pos, view, candleData, xFor, yFor, minP, maxP, mainH, pl, pt, cw)
    }

    if (this.config.showTradeHistory && this.tradeHistory.length > 0) {
      for (const hist of this.tradeHistory) {
        this.renderTradeHistoryMarker(c, hist, view, candleData, xFor, yFor)
      }
    }
  }

  private renderPositionOverlay(
    c: CanvasRenderingContext2D,
    pos: OverlayPosition,
    view: { start: number; count: number },
    candleData: Array<{ time: number; open: number; high: number; low: number; close: number }>,
    xFor: (i: number) => number,
    yFor: (p: number) => number,
    minP: number, maxP: number, mainH: number, pl: number, pt: number, cw: number,
  ) {
    const isLong = pos.side === 'LONG'
    const colors = this.config.colors
    const color = isLong ? colors.buy : colors.sell

    const entryY = yFor(pos.entryPrice)
    const slY = pos.stopLoss > 0 ? yFor(pos.stopLoss) : null
    const tpY = pos.takeProfit > 0 ? yFor(pos.takeProfit) : null

    const lastIdx = candleData.length - 1
    const clampedIdx = Math.max(view.start, Math.min(lastIdx, view.start + view.count - 1))
    const currentX = xFor(clampedIdx)

    if (this.config.showPositionLine && isFinite(entryY)) {
      c.strokeStyle = color
      c.lineWidth = 1
      c.setLineDash([4, 3])
      c.beginPath()
      c.moveTo(pl, entryY)
      c.lineTo(pl + cw, entryY)
      c.stroke()
      c.setLineDash([])

      c.fillStyle = color
      c.font = '9px monospace'
      c.textAlign = 'left'
      c.fillText(`${isLong ? 'LONG' : 'SHORT'} ${pos.quantity} @ ${pos.entryPrice.toFixed(2)}`, pl + 3, entryY - 3)
    }

    if (slY !== null && isFinite(slY)) {
      if (this.config.showSLZone && tpY !== null && isFinite(tpY)) {
        const zoneTop = isLong ? Math.min(slY, tpY) : Math.min(slY, tpY)
        const zoneBot = isLong ? Math.max(slY, entryY) : Math.max(slY, entryY)
        c.fillStyle = colors.zoneSell
        c.fillRect(pl, zoneTop, cw, zoneBot - zoneTop)
      }
      if (this.config.showSLLine) {
        c.strokeStyle = colors.sl
        c.lineWidth = 1
        c.setLineDash([4, 3])
        c.beginPath()
        c.moveTo(pl, slY)
        c.lineTo(pl + cw, slY)
        c.stroke()
        c.setLineDash([])
        c.fillStyle = colors.sl
        c.font = '9px monospace'
        c.textAlign = 'left'
        c.fillText(`SL ${pos.stopLoss.toFixed(2)}`, pl + 3, slY - 3)
      }
    }

    if (tpY !== null && isFinite(tpY)) {
      if (this.config.showTPZone && slY !== null && isFinite(slY)) {
        const zoneTop = isLong ? Math.min(slY, tpY) : Math.min(slY, tpY)
        const zoneBot = isLong ? Math.max(entryY, tpY) : Math.max(entryY, tpY)
        c.fillStyle = colors.zoneBuy
        c.fillRect(pl, zoneTop, cw, zoneBot - zoneTop)
      }
      if (this.config.showTPLine) {
        c.strokeStyle = colors.tp
        c.lineWidth = 1
        c.setLineDash([4, 3])
        c.beginPath()
        c.moveTo(pl, tpY)
        c.lineTo(pl + cw, tpY)
        c.stroke()
        c.setLineDash([])
        c.fillStyle = colors.tp
        c.font = '9px monospace'
        c.textAlign = 'left'
        c.fillText(`TP ${pos.takeProfit.toFixed(2)}`, pl + 3, tpY - 3)
      }
    }

    if (this.config.showEntryMarker && lastIdx >= view.start && lastIdx <= view.start + view.count) {
      const ey = yFor(pos.entryPrice)
      c.strokeStyle = colors.entry
      c.lineWidth = 2
      c.setLineDash([])
      c.beginPath()
      c.moveTo(currentX - 5, ey - 5)
      c.lineTo(currentX + 5, ey + 5)
      c.moveTo(currentX + 5, ey - 5)
      c.lineTo(currentX - 5, ey + 5)
      c.stroke()
    }

    if (this.config.showPnLLabel) {
      const pnlColor = pos.unrealizedPnL >= 0 ? colors.pnlPositive : colors.pnlNegative
      const pnlText = `P&L: ${pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} (${pos.pnlPercent >= 0 ? '+' : ''}${pos.pnlPercent.toFixed(2)}%)`
      c.fillStyle = pnlColor
      c.font = 'bold 10px monospace'
      c.textAlign = 'right'
      c.fillText(pnlText, pl + cw - 4, pt + 12)
    }
  }

  private renderTradeHistoryMarker(
    c: CanvasRenderingContext2D,
    hist: OverlayPosition,
    view: { start: number; count: number },
    candleData: Array<{ time: number; open: number; high: number; low: number; close: number }>,
    xFor: (i: number) => number,
    yFor: (p: number) => number,
  ) {
    if (candleData.length === 0) return
    const idx = hist.closedAtCandle != null ? Math.min(hist.closedAtCandle, candleData.length - 1) : candleData.length - 1
    if (idx < view.start || idx > view.start + view.count) return
    const x = xFor(idx)
    const y = yFor(hist.currentPrice || hist.entryPrice)
    const isLong = hist.side === 'LONG'

    c.fillStyle = isLong ? this.config.colors.buy : this.config.colors.sell
    const hw = 5
    const hh = 5
    c.beginPath()
    if (isLong) {
      c.moveTo(x, y - hh)
      c.lineTo(x + hw, y)
      c.lineTo(x, y + hh)
    } else {
      c.moveTo(x, y - hh)
      c.lineTo(x - hw, y)
      c.lineTo(x, y + hh)
    }
    c.closePath()
    c.fill()

    c.fillStyle = '#1f2937'
    c.font = '8px monospace'
    c.textAlign = isLong ? 'left' : 'right'
    c.fillText(
      `CLOSED ${isLong ? 'LONG' : 'SHORT'} ${hist.quantity}`,
      isLong ? x + 8 : x - 8,
      y + 3,
    )
  }

  getActivePositions(): OverlayPosition[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'ACTIVE')
  }

  getClosedPositions(): OverlayPosition[] {
    return this.tradeHistory
  }

  getConfig(): OverlayConfig {
    return { ...this.config }
  }
}
