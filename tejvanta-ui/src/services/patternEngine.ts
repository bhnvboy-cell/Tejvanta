export type PatternType =
  | 'flag' | 'pennant' | 'double-top' | 'double-bottom'
  | 'vol-compression' | 'liquidity-shock' | 'wyckoff-phase'

export type PatternDirection = 'bullish' | 'bearish' | 'neutral'

export interface PatternOverlay {
  trendlines?: Array<{ x1: number; y1: number; x2: number; y2: number }>
  levels?: Array<{ time: number; price: number; label: string; color?: string }>
  markers?: Array<{ time: number; position: 'aboveBar' | 'belowBar' | 'inBar'; color: string; shape: 'circle' | 'arrowUp' | 'arrowDown' | 'square'; text: string }>
}

export interface DetectedPattern {
  id: string
  type: PatternType
  startIndex: number
  endIndex: number
  confidence: number
  direction: PatternDirection
  description: string
  alertMessage: string
  measurements?: Record<string, number>
  overlay: PatternOverlay
}

export interface PatternAlert {
  type: PatternType
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: number
  candleTime: number
  confidence: number
}

export interface DetectionConfig {
  flagMinPoleCandles: number
  flagMaxSlopeDeg: number
  pennantMinTouches: number
  doubleTopTolerance: number
  doubleBottomTolerance: number
  volatilityCompressionPeriod: number
  volCompressionThreshold: number
  liquidityShockMultiplier: number
}

const DEFAULT_CONFIG: DetectionConfig = {
  flagMinPoleCandles: 5,
  flagMaxSlopeDeg: 30,
  pennantMinTouches: 4,
  doubleTopTolerance: 0.005,
  doubleBottomTolerance: 0.005,
  volatilityCompressionPeriod: 20,
  volCompressionThreshold: 0.5,
  liquidityShockMultiplier: 3.0,
}

let patternCounter = 0

function avgRange(candles: any[], start: number, len: number): number {
  let sum = 0
  for (let i = start; i < start + len && i < candles.length; i++) sum += candles[i].high - candles[i].low
  return sum / Math.min(len, candles.length - start)
}

function sma(arr: number[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < arr.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += arr[i - j]
    result.push(sum / period)
  }
  return result
}

function atr(candles: any[], period: number): number[] {
  const result: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i - 1].close), Math.abs(candles[i].low - candles[i - 1].close))
    if (i < period) { result.push(tr); continue }
    let sum = 0
    for (let j = 0; j < period; j++) sum += candles[i - j]?.high ? Math.max(candles[i - j].high - candles[i - j].low, Math.abs(candles[i - j].high - (candles[i - j - 1]?.close || candles[i - j].high)), Math.abs(candles[i - j].low - (candles[i - j - 1]?.close || candles[i - j].low))) : 0
    result.push(sum / period)
  }
  return result
}

function detectFlag(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  const lookback = Math.min(30, idx)
  if (lookback < cfg.flagMinPoleCandles + 3) return null

  const avgR = avgRange(candles, idx - lookback, lookback)

  for (let poleEnd = 2; poleEnd < lookback - 3; poleEnd++) {
    const poleStart = idx - lookback
    const poleLen = poleEnd - poleStart
    if (poleLen < cfg.flagMinPoleCandles) continue

    let poleDirection = 0
    for (let i = poleStart + 1; i <= poleEnd; i++) {
      poleDirection += Math.sign(candles[i].close - candles[i - 1].close)
    }

    const isBullish = poleDirection > 0
    const poleAvgR = avgRange(candles, poleStart, poleLen)

    const flagStart = poleEnd + 1
    const flagLen = idx - flagStart
    if (flagLen < 3) continue

    let flagPrices = candles.slice(flagStart, idx + 1).map(c => isBullish ? c.close : -c.close)
    const slope = (flagPrices[flagPrices.length - 1] - flagPrices[0]) / flagPrices.length
    const slopeDeg = Math.abs(Math.atan(slope) * (180 / Math.PI))

    if (slopeDeg > cfg.flagMaxSlopeDeg) continue

    const channelWidth = Math.max(...candles.slice(flagStart, idx + 1).map(c => c.high - c.low))
    const conf = Math.min(1, (poleLen / 10) * 0.5 + (1 - channelWidth / avgR) * 0.3 + (1 - slopeDeg / cfg.flagMaxSlopeDeg) * 0.2)
    if (conf < 0.3) continue

    patternCounter++
    const breakoutPrice = isBullish ? Math.max(...candles.slice(flagStart, idx + 1).map(c => c.high)) : Math.min(...candles.slice(flagStart, idx + 1).map(c => c.low))
    return {
      id: `flag-${patternCounter}`,
      type: 'flag',
      startIndex: poleStart,
      endIndex: idx,
      confidence: Math.round(conf * 100) / 100,
      direction: isBullish ? 'bullish' : 'bearish',
      description: `${isBullish ? 'Bull' : 'Bear'} flag (pole: ${poleLen} candles, flag: ${flagLen} candles)`,
      alertMessage: isBullish ? 'Bull flag forming — watch for upside breakout' : 'Bear flag forming — watch for downside breakdown',
      measurements: { poleCandles: poleLen, flagCandles: flagLen, poleHeight: Math.abs(candles[poleEnd].close - candles[poleStart].close), channelWidth },
      overlay: {
        trendlines: [{
          x1: candles[flagStart].time,
          y1: isBullish ? Math.min(...candles.slice(flagStart, idx + 1).map(c => c.low)) : Math.max(...candles.slice(flagStart, idx + 1).map(c => c.high)),
          x2: candles[idx].time,
          y2: isBullish ? breakoutPrice : breakoutPrice,
        }],
        markers: [{
          time: candles[idx].time,
          position: 'belowBar',
          color: isBullish ? '#22c55e' : '#ef4444',
          shape: isBullish ? 'arrowUp' : 'arrowDown',
          text: 'FLAG',
        }],
      },
    }
  }
  return null
}

function detectPennant(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  const lookback = Math.min(25, idx)
  if (lookback < 8) return null

  for (let poleEnd = 2; poleEnd < lookback - 4; poleEnd++) {
    const poleStart = idx - lookback
    const poleLen = poleEnd - poleStart
    if (poleLen < 4) continue

    let poleDirection = 0
    for (let i = poleStart + 1; i <= poleEnd; i++) poleDirection += Math.sign(candles[i].close - candles[i - 1].close)
    const isBullish = poleDirection > 0

    const pennantStart = poleEnd + 1
    const pennantLen = idx - pennantStart
    if (pennantLen < 4) continue

    const pennantCandles = candles.slice(pennantStart, idx + 1)
    const highs = pennantCandles.map(c => c.high)
    const lows = pennantCandles.map(c => c.low)

    const startRange = highs[0] - lows[0]
    const endRange = highs[highs.length - 1] - lows[lows.length - 1]

    let touches = 0
    for (let i = 1; i < pennantCandles.length - 1; i++) {
      if (Math.abs(pennantCandles[i].high - Math.max(...highs.slice(0, i + 1))) < 0.001 * pennantCandles[i].high) touches++
      if (Math.abs(pennantCandles[i].low - Math.min(...lows.slice(0, i + 1))) < 0.001 * pennantCandles[i].low) touches++
    }

    if (touches < cfg.pennantMinTouches) continue
    if (endRange > startRange * 0.7) continue

    const conf = Math.min(1, (touches / 6) * 0.4 + (1 - endRange / startRange) * 0.4 + (poleLen / 8) * 0.2)
    if (conf < 0.3) continue

    patternCounter++
    return {
      id: `pennant-${patternCounter}`,
      type: 'pennant',
      startIndex: poleStart,
      endIndex: idx,
      confidence: Math.round(conf * 100) / 100,
      direction: isBullish ? 'bullish' : 'bearish',
      description: `${isBullish ? 'Bull' : 'Bear'} pennant (${pennantLen} candles converging, ${touches} touches)`,
      alertMessage: 'Pennant forming — apex approaching, breakout imminent',
      measurements: { poleCandles: poleLen, pennantCandles: pennantLen, touches, startRange, endRange },
      overlay: {
        trendlines: [
          { x1: candles[pennantStart].time, y1: Math.max(...highs), x2: candles[idx].time, y2: highs[highs.length - 1] },
          { x1: candles[pennantStart].time, y1: Math.min(...lows), x2: candles[idx].time, y2: lows[lows.length - 1] },
        ],
        markers: [{
          time: candles[idx].time, position: 'belowBar', color: '#a855f7', shape: 'square', text: 'PEN',
        }],
      },
    }
  }
  return null
}

function detectDoubleTop(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  const lookback = Math.min(40, idx)
  if (lookback < 10) return null

  const highs = candles.slice(idx - lookback, idx + 1).map((c, i) => ({ idx: i + idx - lookback, time: c.time, high: c.high, vol: c.volume || 0 }))

  for (let i = 1; i < highs.length - 3; i++) {
    const leftLen = i - 1
    const midLen = Math.min(3, Math.floor((highs.length - i) / 2))
    const rightLen = highs.length - i - midLen - 1
    if (leftLen < 3 || rightLen < 3) continue

    const leftMax = highs.slice(0, i + 1).reduce((p, c) => c.high > p.high ? c : p)
    const midMin = highs.slice(i, i + midLen + 1).reduce((p, c) => c.high < p.high ? c : p)
    const rightMax = highs.slice(i + midLen).reduce((p, c) => c.high > p.high ? c : p)

    if (leftMax.idx === rightMax.idx) continue

    const peakDiff = Math.abs(leftMax.high - rightMax.high) / Math.max(leftMax.high, rightMax.high)
    if (peakDiff > cfg.doubleTopTolerance) continue

    const neckline = midMin.high
    const leftVol = leftMax.vol
    const rightVol = rightMax.vol

    if (rightVol > leftVol * 0.8) continue

    const conf = Math.min(1, (1 - peakDiff / cfg.doubleTopTolerance) * 0.4 + (1 - rightVol / leftVol) * 0.3 + Math.min(1, (rightMax.idx - leftMax.idx) / 10) * 0.3)
    if (conf < 0.3) continue

    patternCounter++
    const isConfirmed = idx > rightMax.idx + 2 && candles[idx].close < neckline
    return {
      id: `double-top-${patternCounter}`,
      type: 'double-top',
      startIndex: idx - lookback,
      endIndex: idx,
      confidence: Math.round(conf * 100) / 100,
      direction: 'bearish',
      description: `Double top at ₹${leftMax.high.toFixed(2)} / ₹${rightMax.high.toFixed(2)}${isConfirmed ? ' — CONFIRMED (neckline break)' : ' — forming'}`,
      alertMessage: isConfirmed ? 'M-pattern neckline break — bearish reversal confirmed!' : 'M-pattern forming — watch for neckline break',
      measurements: { peak1Price: leftMax.high, peak2Price: rightMax.high, neckline, peakDiff },
      overlay: {
        levels: [
          { time: leftMax.time, price: leftMax.high, label: 'Peak 1', color: '#ef4444' },
          { time: rightMax.time, price: rightMax.high, label: 'Peak 2', color: '#ef4444' },
          { time: midMin.time, price: neckline, label: 'Neckline', color: '#f97316' },
        ],
        markers: [{
          time: candles[idx].time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'M',
        }],
      },
    }
  }
  return null
}

function detectDoubleBottom(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  const lookback = Math.min(40, idx)
  if (lookback < 10) return null

  const lows = candles.slice(idx - lookback, idx + 1).map((c, i) => ({ idx: i + idx - lookback, time: c.time, low: c.low, vol: c.volume || 0 }))

  for (let i = 1; i < lows.length - 3; i++) {
    const leftLen = i - 1
    const midLen = Math.min(3, Math.floor((lows.length - i) / 2))
    const rightLen = lows.length - i - midLen - 1
    if (leftLen < 3 || rightLen < 3) continue

    const leftMin = lows.slice(0, i + 1).reduce((p, c) => c.low < p.low ? c : p)
    const midMax = lows.slice(i, i + midLen + 1).reduce((p, c) => c.low > p.low ? c : p)
    const rightMin = lows.slice(i + midLen).reduce((p, c) => c.low < p.low ? c : p)

    if (leftMin.idx === rightMin.idx) continue

    const troughDiff = Math.abs(leftMin.low - rightMin.low) / Math.max(leftMin.low, rightMin.low)
    if (troughDiff > cfg.doubleBottomTolerance) continue

    const neckline = midMax.low
    const leftVol = leftMin.vol
    const rightVol = rightMin.vol

    if (rightVol < leftVol * 1.2) continue

    const conf = Math.min(1, (1 - troughDiff / cfg.doubleBottomTolerance) * 0.4 + (rightVol / leftVol - 1) * 0.3 + Math.min(1, (rightMin.idx - leftMin.idx) / 10) * 0.3)
    if (conf < 0.3) continue

    patternCounter++
    const isConfirmed = idx > rightMin.idx + 2 && candles[idx].close > neckline
    return {
      id: `double-bottom-${patternCounter}`,
      type: 'double-bottom',
      startIndex: idx - lookback,
      endIndex: idx,
      confidence: Math.round(conf * 100) / 100,
      direction: 'bullish',
      description: `Double bottom at ₹${leftMin.low.toFixed(2)} / ₹${rightMin.low.toFixed(2)}${isConfirmed ? ' — CONFIRMED (neckline break)' : ' — forming'}`,
      alertMessage: isConfirmed ? 'W-pattern neckline break — bullish reversal confirmed!' : 'W-pattern forming — watch for neckline break',
      measurements: { trough1Price: leftMin.low, trough2Price: rightMin.low, neckline, troughDiff },
      overlay: {
        levels: [
          { time: leftMin.time, price: leftMin.low, label: 'Trough 1', color: '#22c55e' },
          { time: rightMin.time, price: rightMin.low, label: 'Trough 2', color: '#22c55e' },
          { time: midMax.time, price: neckline, label: 'Neckline', color: '#f97316' },
        ],
        markers: [{
          time: candles[idx].time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'W',
        }],
      },
    }
  }
  return null
}

function detectVolCompression(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  const lookback = Math.min(50, idx)
  if (lookback < cfg.volatilityCompressionPeriod) return null

  const atrValues = atr(candles.slice(idx - lookback, idx + 1), 14)
  if (atrValues.length < 20) return null

  const recent20 = atrValues.slice(-20)
  const avgWidth = recent20.reduce((s, v) => s + v, 0) / recent20.length
  const minWidth = Math.min(...recent20)
  const ratio = minWidth / avgWidth

  if (ratio > cfg.volCompressionThreshold) return null

  const conf = Math.min(1, 1 - ratio / cfg.volCompressionThreshold)
  patternCounter++

  return {
    id: `vol-comp-${patternCounter}`,
    type: 'vol-compression',
    startIndex: idx - lookback,
    endIndex: idx,
    confidence: Math.round(conf * 100) / 100,
    direction: 'neutral',
    description: `Volatility compression — bandwidth at ${(ratio * 100).toFixed(0)}% of 20-period average`,
    alertMessage: 'Volatility squeeze detected — expansion imminent!',
    measurements: { bandwidthRatio: ratio, minWidth, avgWidth },
    overlay: {
      markers: [{
        time: candles[idx].time, position: 'aboveBar', color: '#facc15', shape: 'square', text: 'SQZ',
      }],
    },
  }
}

function detectLiquidityShock(candles: any[], idx: number, cfg: DetectionConfig): DetectedPattern | null {
  if (idx < 2) return null
  const c = candles[idx]
  const prev = candles[idx - 1]
  const candleRange = c.high - c.low

  const lookback = Math.min(20, idx)
  let avgRange = 0
  for (let i = idx - lookback; i < idx; i++) avgRange += candles[i].high - candles[i].low
  avgRange /= lookback

  if (candleRange < avgRange * cfg.liquidityShockMultiplier) return null

  const conf = Math.min(1, candleRange / (avgRange * 5))
  patternCounter++

  return {
    id: `shock-${patternCounter}`,
    type: 'liquidity-shock',
    startIndex: idx,
    endIndex: idx,
    confidence: Math.round(conf * 100) / 100,
    direction: c.close >= c.open ? 'bullish' : 'bearish',
    description: `Liquidity shock — ${(candleRange / avgRange).toFixed(1)}× average range`,
    alertMessage: `Liquidity shock candle! Range ${(candleRange / avgRange).toFixed(1)}× normal`,
    measurements: { candleRange, avgRange, multiplier: candleRange / avgRange },
    overlay: {
      levels: [{ time: c.time, price: c.high, label: 'SHOCK', color: '#ec4899' }],
      markers: [{
        time: c.time, position: 'aboveBar', color: '#ec4899', shape: 'square', text: 'SHOCK',
      }],
    },
  }
}

export function detectPatterns(
  candles: any[],
  config: Partial<DetectionConfig> = {}
): { patterns: DetectedPattern[]; alerts: PatternAlert[] } {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const patterns: DetectedPattern[] = []
  const alerts: PatternAlert[] = []

  for (let i = candles.length - 1; i >= Math.max(0, candles.length - 60); i--) {
    const flag = detectFlag(candles, i, cfg)
    if (flag) {
      const exists = patterns.some(p => p.type === 'flag' && Math.abs(p.startIndex - flag.startIndex) < 5)
      if (!exists) patterns.push(flag)
    }

    const pennant = detectPennant(candles, i, cfg)
    if (pennant) {
      const exists = patterns.some(p => p.type === 'pennant' && Math.abs(p.startIndex - pennant.startIndex) < 5)
      if (!exists) patterns.push(pennant)
    }

    const dt = detectDoubleTop(candles, i, cfg)
    if (dt) {
      const exists = patterns.some(p => p.type === 'double-top' && Math.abs(p.startIndex - dt.startIndex) < 5)
      if (!exists) patterns.push(dt)
    }

    const db = detectDoubleBottom(candles, i, cfg)
    if (db) {
      const exists = patterns.some(p => p.type === 'double-bottom' && Math.abs(p.startIndex - db.startIndex) < 5)
      if (!exists) patterns.push(db)
    }
  }

  const vc = detectVolCompression(candles, candles.length - 1, cfg)
  if (vc) patterns.push(vc)

  const ls = detectLiquidityShock(candles, candles.length - 1, cfg)
  if (ls) patterns.push(ls)

  for (const p of patterns) {
    if (p.confidence >= 0.4) {
      alerts.push({
        type: p.type,
        message: p.alertMessage,
        severity: p.confidence >= 0.7 ? 'critical' : p.confidence >= 0.55 ? 'warning' : 'info',
        timestamp: Date.now(),
        candleTime: candles[Math.min(p.endIndex, candles.length - 1)]?.time || 0,
        confidence: p.confidence,
      })
    }
  }

  return { patterns, alerts }
}

export function detectPatternsOnTick(
  candle: any,
  existingPatterns: DetectedPattern[],
  config: Partial<DetectionConfig> = {}
): { newPatterns: DetectedPattern[]; alerts: PatternAlert[] } {
  return { newPatterns: [], alerts: [] }
}

export function getPatternOverlayMarkers(patterns: DetectedPattern[]): PatternOverlay['markers'] {
  return patterns.flatMap(p => p.overlay.markers || [])
}

export function getPatternOverlayLevels(patterns: DetectedPattern[]): PatternOverlay['levels'] {
  return patterns.flatMap(p => p.overlay.levels || [])
}
