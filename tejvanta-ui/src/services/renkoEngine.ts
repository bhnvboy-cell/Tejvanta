export interface RenkoCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  brickCount: number
  isUp: boolean
}

export interface RenkoConfig {
  brickSize: 'fixed' | 'atr'
  fixedBrickPct: number
  atrPeriod: number
  atrMultiplier: number
  showWicks: boolean
  showBrickVolume: boolean
}

export const DEFAULT_RENKO_CONFIG: RenkoConfig = {
  brickSize: 'fixed',
  fixedBrickPct: 0.05,
  atrPeriod: 14,
  atrMultiplier: 1.5,
  showWicks: false,
  showBrickVolume: false,
}

function atr(candles: { high: number; low: number; close: number }[], period: number): number {
  if (candles.length < 2) return 0
  let sum = 0; const n = Math.min(period, candles.length - 1)
  for (let i = 1; i <= n; i++) {
    sum += Math.max(candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close))
  }
  return sum / n
}

function round2(v: number): number { return Math.round(v * 100) / 100 }

function emitBrick(
  bricks: RenkoCandle[],
  base: number,
  close: number,
  cfg: RenkoConfig,
  runHigh: number,
  runLow: number,
  runVol: number,
  time: number,
): void {
  const isUp = close > base
  const bodyTop = Math.max(base, close)
  const bodyBot = Math.min(base, close)
  const hi = cfg.showWicks ? Math.max(runHigh, bodyTop) : bodyTop
  const lo = cfg.showWicks ? Math.min(runLow, bodyBot) : bodyBot
  bricks.push({
    time,
    open: round2(base),
    high: round2(hi),
    low: round2(lo),
    close: round2(close),
    volume: cfg.showBrickVolume ? runVol : 0,
    brickCount: 1,
    isUp,
  })
}

export function computeRenkoBricks(
  candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>,
  config: Partial<RenkoConfig> = {},
): RenkoCandle[] {
  const cfg = { ...DEFAULT_RENKO_CONFIG, ...config }
  if (candles.length < 2) return []

  const avgP = candles.reduce((s, c) => s + c.close, 0) / candles.length
  let brickSize: number
  if (cfg.brickSize === 'atr') {
    brickSize = atr(candles, cfg.atrPeriod) * cfg.atrMultiplier
    if (brickSize <= 0) brickSize = avgP * (cfg.fixedBrickPct / 100)
  } else {
    brickSize = avgP * (cfg.fixedBrickPct / 100)
  }
  brickSize = Math.max(brickSize, 0.01)
  brickSize = round2(brickSize)

  const bricks: RenkoCandle[] = []
  let base = round2(candles[0].open)
  let runHigh = candles[0].high
  let runLow = candles[0].low
  let runVol = candles[0].volume || 0

  for (let ci = 1; ci < candles.length; ci++) {
    const c = candles[ci]
    runHigh = Math.max(runHigh, c.high)
    runLow = Math.min(runLow, c.low)
    runVol += c.volume || 0

    // Determine how many bricks the running range can form (one direction per candle)
    const upCnt = Math.floor((runHigh - base) / brickSize)
    const downCnt = Math.floor((base - runLow) / brickSize)

    if (upCnt === 0 && downCnt === 0) continue

    // Pick the direction with more potential
    if (upCnt >= downCnt && upCnt > 0) {
      const bh = runHigh, bl = runLow, bv = runVol
      for (let i = 0; i < upCnt; i++) {
        const cl = round2(base + brickSize)
        emitBrick(bricks, base, cl, cfg, bh, bl, bv, c.time)
        base = cl
      }
    } else if (downCnt > 0) {
      const bh = runHigh, bl = runLow, bv = runVol
      for (let i = 0; i < downCnt; i++) {
        const cl = round2(base - brickSize)
        emitBrick(bricks, base, cl, cfg, bh, bl, bv, c.time)
        base = cl
      }
    }

    // Reset tracking for next candle
    runHigh = c.high
    runLow = c.low
    runVol = 0
  }

  return bricks
}

export function computeRenkoCandles(
  candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>,
  config: Partial<RenkoConfig> = {},
): RenkoCandle[] {
  return computeRenkoBricks(candles, config)
}
