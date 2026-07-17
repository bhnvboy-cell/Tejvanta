export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'bollinger' | 'atr' | 'supertrend' | 'volume'

export interface IndicatorResult {
  time: number
  value: number
}

export interface BollingerResult {
  time: number
  middle: number
  upper: number
  lower: number
}

export interface SupertrendResult {
  time: number
  value: number
  direction: 1 | -1
}

export interface IndicatorOutput {
  name: string
  color: string
  linewidth: number
  data: IndicatorResult[]
  pane: 'main' | 'separate'
  overlay?: boolean
}

export interface IndicatorDef {
  type: IndicatorType
  params: Record<string, number | string | boolean>
  color: string
  linewidth: number
}

function sma(src: number[], len: number): number[] {
  const r: number[] = []
  for (let i = 0; i < src.length; i++) {
    if (i < len - 1) { r.push(NaN); continue }
    let s = 0; for (let j = 0; j < len; j++) s += src[i - j]
    r.push(s / len)
  }
  return r
}

function ema(src: number[], len: number): number[] {
  const k = 2 / (len + 1); const r: number[] = []; let v = src[0]
  for (let i = 0; i < src.length; i++) {
    v = src[i] * k + v * (1 - k)
    r.push(i >= len - 1 ? v : NaN)
  }
  return r
}

function rsi(src: number[], len: number): number[] {
  const r: number[] = []; let g = 0, l = 0
  for (let i = 1; i <= len && i < src.length; i++) { const d = src[i] - src[i - 1]; if (d >= 0) g += d; else l -= d }
  for (let i = len; i < src.length; i++) {
    const d = src[i] - src[i - 1]
    if (d >= 0) { g = (g * (len - 1) + d) / len; l = (l * (len - 1)) / len }
    else { l = (l * (len - 1) - d) / len; g = (g * (len - 1)) / len }
    r.push(l === 0 ? 100 : 100 - 100 / (1 + g / l))
  }
  return r
}

function calcStdDev(src: number[], len: number, mean: number[]): number[] {
  const r: number[] = []
  for (let i = 0; i < src.length; i++) {
    if (i < len - 1 || isNaN(mean[i])) { r.push(NaN); continue }
    let sq = 0
    for (let j = 0; j < len; j++) sq += (src[i - j] - mean[i]) ** 2
    r.push(Math.sqrt(sq / len))
  }
  return r
}

function atrRaw(candles: { high: number; low: number; close: number }[], len: number): number[] {
  const r: number[] = []
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { r.push(candles[i].high - candles[i].low); continue }
    const tr = Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i - 1].close), Math.abs(candles[i].low - candles[i - 1].close))
    if (i < len) { r.push(tr); continue }
    let s = 0; for (let j = 0; j < len; j++) s += r[i - j]
    r.push(s / len)
  }
  return r
}

export function computeIndicator(
  def: IndicatorDef,
  candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[]
): IndicatorOutput[] {
  const closeArr = candles.map(c => c.close)
  const highArr = candles.map(c => c.high)
  const lowArr = candles.map(c => c.low)
  const volumeArr = candles.map(c => c.volume || 0)

  switch (def.type) {
    case 'sma': {
      const len = (def.params.length as number) || 20
      const values = sma(closeArr, len)
      return [{ name: `SMA(${len})`, color: def.color, linewidth: def.linewidth, data: zip(candles, values), pane: 'main' }]
    }
    case 'ema': {
      const len = (def.params.length as number) || 20
      const values = ema(closeArr, len)
      return [{ name: `EMA(${len})`, color: def.color, linewidth: def.linewidth, data: zip(candles, values), pane: 'main' }]
    }
    case 'rsi': {
      const len = (def.params.length as number) || 14
      const values = rsi(closeArr, len)
      return [{ name: `RSI(${len})`, color: def.color, linewidth: def.linewidth, data: zip(candles, values), pane: 'separate' }]
    }
    case 'bollinger': {
      const len = (def.params.length as number) || 20
      const mult = (def.params.multiplier as number) || 2
      const mid = sma(closeArr, len)
      const sd = calcStdDev(closeArr, len, mid)
      const upper: number[] = []; const lower: number[] = []
      for (let i = 0; i < closeArr.length; i++) {
        upper.push(isNaN(mid[i]) ? NaN : mid[i] + sd[i] * mult)
        lower.push(isNaN(mid[i]) ? NaN : mid[i] - sd[i] * mult)
      }
      const midColor = def.color || '#f97316'
      return [
        { name: `BB Middle(${len})`, color: midColor, linewidth: def.linewidth, data: zip(candles, mid), pane: 'main' },
        { name: `BB Upper(${len})`, color: midColor + '80', linewidth: def.linewidth * 0.7, data: zip(candles, upper), pane: 'main' },
        { name: `BB Lower(${len})`, color: midColor + '80', linewidth: def.linewidth * 0.7, data: zip(candles, lower), pane: 'main' },
      ]
    }
    case 'atr': {
      const len = (def.params.length as number) || 14
      const values = atrRaw(candles, len)
      return [{ name: `ATR(${len})`, color: def.color, linewidth: def.linewidth, data: zip(candles, values), pane: 'separate' }]
    }
    case 'supertrend': {
      const len = (def.params.length as number) || 10
      const mult = (def.params.multiplier as number) || 3
      const atrv = atrRaw(candles, len)
      const hl2 = candles.map(c => (c.high + c.low) / 2)
      const result: { time: number; value: number; direction: 1 | -1 }[] = []
      let direction: 1 | -1 = 1
      let prevUpper = 0, prevLower = 0
      for (let i = 0; i < candles.length; i++) {
        if (i < len || isNaN(atrv[i])) { result.push({ time: candles[i].time, value: NaN, direction }); continue }
        const mid = hl2[i]
        const upper = mid + mult * atrv[i]
        const lower = mid - mult * atrv[i]
        const finalUpper = (i === len || upper < prevUpper) ? upper : prevUpper
        const finalLower = (i === len || lower > prevLower) ? lower : prevLower
        if (i === len) { direction = candles[i].close > finalUpper ? 1 : -1 }
        else {
          if (candles[i].close <= finalUpper && direction === 1) direction = -1
          else if (candles[i].close >= finalLower && direction === -1) direction = 1
        }
        const val = direction === 1 ? finalLower : finalUpper
        result.push({ time: candles[i].time, value: val, direction })
        prevUpper = finalUpper; prevLower = finalLower
      }
      const data = result.map(r => ({ time: r.time, value: r.value }))
      return [{ name: `Supertrend(${len},${mult})`, color: def.color, linewidth: def.linewidth, data, pane: 'main' }]
    }
    case 'volume': {
      return [{
        name: 'Volume', color: def.color, linewidth: 1,
        data: volumeArr.map((v, i) => ({ time: candles[i].time, value: v })),
        pane: 'separate', overlay: true,
      }]
    }
    default:
      return []
  }
}

export const BUILTIN_INDICATORS: IndicatorDef[] = [
  { type: 'sma', params: { length: 20 }, color: '#f59e0b', linewidth: 1.5 },
  { type: 'sma', params: { length: 50 }, color: '#3b82f6', linewidth: 1.5 },
  { type: 'ema', params: { length: 20 }, color: '#a855f7', linewidth: 1.5 },
  { type: 'rsi', params: { length: 14 }, color: '#ec4899', linewidth: 1.5 },
  { type: 'bollinger', params: { length: 20, multiplier: 2 }, color: '#f97316', linewidth: 1.5 },
  { type: 'atr', params: { length: 14 }, color: '#06b6d4', linewidth: 1.5 },
  { type: 'supertrend', params: { length: 10, multiplier: 3 }, color: '#22c55e', linewidth: 2 },
  { type: 'volume', params: {}, color: '#6366f1', linewidth: 1 },
]

function zip(candles: { time: number }[], values: number[]): IndicatorResult[] {
  const r: IndicatorResult[] = []
  for (let i = 0; i < candles.length; i++) {
    const v = values[i]
    if (!isNaN(v) && v !== null) r.push({ time: candles[i].time, value: Math.round(v * 100) / 100 })
  }
  return r
}
