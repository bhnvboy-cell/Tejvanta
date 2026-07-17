export type MarketPhase = 'accumulation' | 'manipulation' | 'fvg' | 'distribution' | 'consolidation'

export interface OrderFlow {
  buyVolume: number
  sellVolume: number
  netImbalance: number
}

export interface PhaseConfig {
  dir: number
  volFactor: number
  meanRev: number
}

const PHASE_CFG: Record<MarketPhase, PhaseConfig> = {
  accumulation: { dir: 0.01, volFactor: 1.0, meanRev: 0.12 },
  manipulation: { dir: 0.12, volFactor: 1.0, meanRev: 0.0 },
  fvg: { dir: 0.0, volFactor: 1.0, meanRev: 0.0 },
  distribution: { dir: -0.05, volFactor: 1.0, meanRev: 0.06 },
  consolidation: { dir: 0.0, volFactor: 1.0, meanRev: 0.15 },
}

export function phaseLabel(p: MarketPhase): string {
  switch (p) {
    case 'accumulation': return 'ACC'
    case 'manipulation': return 'MANIP'
    case 'fvg': return 'FVG'
    case 'distribution': return 'DIST'
    case 'consolidation': return 'CONS'
  }
}

export function phaseColor(p: MarketPhase): string {
  switch (p) {
    case 'accumulation': return 'bg-yellow-600'
    case 'manipulation': return 'bg-green-600'
    case 'fvg': return 'bg-purple-600'
    case 'distribution': return 'bg-orange-600'
    case 'consolidation': return 'bg-blue-600'
  }
}

export function smoothRSI() {
  let gains = 0, losses = 0, count = 0
  const period = 14
  return (prev: number, curr: number): number => {
    const diff = curr - prev
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    if (count < period) {
      gains += gain; losses += loss; count++
      if (count < period) return 50
    } else {
      gains = (gains * (period - 1) + gain) / period
      losses = (losses * (period - 1) + loss) / period
    }
    return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)
  }
}

export function createRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

export function hashSymbol(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return Math.abs(h)
}

export function symbolPrice(symbol: string): number {
  const prices: Record<string, number> = {
    RELIANCE: 1304, TCS: 3500, HDFCBANK: 1600, INFY: 1450,
    ICICIBANK: 1050, SBIN: 650, BHARTIARTL: 950, ITC: 450,
    WIPRO: 420, HINDUNILVR: 2500, NIFTY: 24200, BANKNIFTY: 58000,
    AAPL: 180, MSFT: 380, 'BTC-USD': 68000,
  }
  if (prices[symbol]) return prices[symbol]
  return 100 + Math.abs(hashSymbol(symbol)) % 50000
}

export function timeframeSeconds(tf: string): number {
  const map: Record<string, number> = { '5s': 5, '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1D': 86400, '1W': 604800 }
  return map[tf] || 86400
}

export const TICK_INTERVAL = 5
const TICKS_PER_DAY = 86400 / TICK_INTERVAL

let engineVix = 14

export function setEngineVix(vix: number) {
  engineVix = Math.max(8, Math.min(40, vix))
}

export function vixDailyVol(): number {
  return 0.003 + (engineVix / 100) * 0.05
}

export interface TickResult {
  price: number
  buyVol: number
  sellVol: number
}

export function generateTick(
  price: number,
  phase: MarketPhase,
  dailyVol: number,
  rsi: number,
  rng: () => number,
  refPrice: number
): TickResult {
  if (!price || price <= 0 || isNaN(price)) price = 100
  if (isNaN(dailyVol) || dailyVol <= 0) dailyVol = 0.01
  const cfg = PHASE_CFG[phase]
  const maxDelta = price * 0.0005

  const perTickScale = Math.sqrt(TICK_INTERVAL / 86400)
  const tickVol = dailyVol * price * perTickScale

  const drift = cfg.dir * tickVol * cfg.volFactor
  const noise = (rng() - 0.5) * tickVol * cfg.volFactor * 2
  const reversion = cfg.meanRev * (refPrice - price) * perTickScale

  let change = drift + noise + reversion
  change = Math.max(-maxDelta, Math.min(maxDelta, change))

  const newPrice = Math.round((price + change) * 100) / 100

  const goingUp = newPrice > price
  const baseVol = Math.round(1000 + rng() * 5000)
  const buyVol = goingUp ? baseVol : Math.round(baseVol * 0.3)
  const sellVol = goingUp ? Math.round(baseVol * 0.3) : baseVol

  return { price: newPrice, buyVol, sellVol }
}

export function pickPhase(
  current: MarketPhase,
  rsi: number,
  orderFlow: OrderFlow,
  rng: () => number,
  tickCount: number
): MarketPhase {
  if (tickCount < 30) return current

  switch (current) {
    case 'accumulation':
      if (rsi > 58 && rng() > 0.35) return 'manipulation'
      return 'accumulation'

    case 'manipulation':
      if (rsi > 72 && rng() > 0.25) return 'distribution'
      if (rsi > 62 && rng() > 0.3) return 'fvg'
      return 'manipulation'

    case 'fvg':
      if (rng() > 0.35) return 'distribution'
      return 'fvg'

    case 'distribution':
      if (rsi < 40 && rng() > 0.35) return 'consolidation'
      return 'distribution'

    case 'consolidation':
      if (rsi > 48 && rng() > 0.35) return 'accumulation'
      return 'consolidation'
  }
}

export function generateInitialCandles(
  symbol: string,
  timeframe: string,
  model?: { basePrice: number; volatility: number; avgVolume: number } | null
): { data: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>; price: number; phase: MarketPhase; rsi: number } {
  const interval = timeframeSeconds(timeframe)
  const now = Math.floor(Date.now() / 1000)
  const alignedNow = Math.floor(now / interval) * interval
  const numInitial = Math.min(200, Math.max(50, Math.floor(3600 / interval)))

  let price = model ? model.basePrice : symbolPrice(symbol)
  if (!isFinite(price) || price <= 0) price = 100
  const dailyVol = model ? model.volatility : vixDailyVol()
  let refPrice = price
  const rng = createRng(hashSymbol(symbol))

  let phase: MarketPhase = 'accumulation'
  let rsi = 50
  let orderFlow: OrderFlow = { buyVolume: 0, sellVolume: 0, netImbalance: 0 }
  const rsiFn = smoothRSI()
  let prevTickPrice = price

  const ticksPerCandle = Math.max(1, Math.round(interval / TICK_INTERVAL))
  const data: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = []

  for (let i = 0; i <= numInitial; i++) {
    const t = alignedNow - (numInitial - i) * interval
    let open = price
    let high = open, low = open

    let candleBuyVol = 0, candleSellVol = 0

    for (let j = 0; j < ticksPerCandle; j++) {
      const tick = generateTick(price, phase, dailyVol, rsi, rng, refPrice)
      if (!isFinite(tick.price)) continue
      prevTickPrice = price
      price = tick.price
      if (!isFinite(price)) price = prevTickPrice
      rsi = rsiFn(prevTickPrice, price)
      high = Math.max(high, price)
      low = Math.min(low, price)
      candleBuyVol += tick.buyVol
      candleSellVol += tick.sellVol
    }

    const totalVol = candleBuyVol + candleSellVol
    orderFlow = {
      buyVolume: candleBuyVol,
      sellVolume: candleSellVol,
      netImbalance: totalVol > 0 ? (candleBuyVol - candleSellVol) / totalVol : 0,
    }

    if (i % 5 === 0) refPrice = price

    phase = pickPhase(phase, rsi, orderFlow, rng, i)

    data.push({
      time: t,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume: Math.round((candleBuyVol + candleSellVol) * (0.5 + Math.random() * 0.5)),
    })
  }

  return { data, price, phase, rsi }
}

export function generateTickStream(
  priceRef: { current: number },
  phaseRef: { current: MarketPhase },
  rsiFnRef: { current: (prev: number, curr: number) => number },
  rsiValRef: { current: number },
  tickCountRef: { current: number },
  orderFlowRef: { current: OrderFlow },
  rngRef: { current: () => number },
  model?: { volatility: number; avgVolume: number } | null
): { price: number; buyVol: number; sellVol: number } {
  tickCountRef.current++

  const prevPrice = priceRef.current
  const dailyVol = model ? model.volatility : vixDailyVol()
  const rng = rngRef.current
  const phase = phaseRef.current
  const rsi = rsiValRef.current

  const refPrice = priceRef.current
  const tick = generateTick(prevPrice, phase, dailyVol, rsi, rng, refPrice)

  priceRef.current = tick.price
  const newRsi = rsiFnRef.current(prevPrice, tick.price)
  rsiValRef.current = newRsi

  const of = orderFlowRef.current
  of.buyVolume += tick.buyVol
  of.sellVolume += tick.sellVol
  const total = of.buyVolume + of.sellVolume
  of.netImbalance = total > 0 ? (of.buyVolume - of.sellVolume) / total : 0

  const newPhase = pickPhase(phase, newRsi, of, rng, tickCountRef.current)
  phaseRef.current = newPhase

  return { price: tick.price, buyVol: tick.buyVol, sellVol: tick.sellVol }
}
