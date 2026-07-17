import type { Tick } from '../types/Instrument'
import { createRng, hashSymbol, symbolPrice, generateTick, pickPhase, smoothRSI } from './marketEngine'
import type { MarketPhase, OrderFlow } from './marketEngine'

interface MockSymbolState {
  price: number
  refPrice: number
  phase: MarketPhase
  rsi: number
  orderFlow: OrderFlow
  tickCount: number
  rng: () => number
  rsiFn: (prev: number, curr: number) => number
  prevTickPrice: number
  open: number
  high: number
  low: number
  dayStartPrice: number
}

const DEFAULT_SYMBOLS = [
  'NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY',
  'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'WIPRO', 'HINDUNILVR',
  'AAPL', 'MSFT', 'BTC-USD',
]

let currentVix = 14

export function setVix(vix: number) {
  currentVix = Math.max(8, Math.min(40, vix))
}

function vixDailyVol(): number {
  return 0.003 + (currentVix / 100) * 0.05
}

const state = new Map<string, MockSymbolState>()

function initSymbol(symbol: string): MockSymbolState {
  const seed = hashSymbol(symbol + 'mock3d')
  const rng = createRng(seed)
  const basePrice = symbolPrice(symbol)
  const { price, phase, rsi } = generateInitialState(symbol, basePrice, rng)
  return {
    price,
    refPrice: price,
    phase,
    rsi,
    orderFlow: { buyVolume: 0, sellVolume: 0, netImbalance: 0 },
    tickCount: 0,
    rng,
    rsiFn: smoothRSI(),
    prevTickPrice: price,
    open: price,
    high: price,
    low: price,
    dayStartPrice: price,
  }
}

function generateInitialState(
  symbol: string,
  basePrice: number,
  rng: () => number,
): { price: number; phase: MarketPhase; rsi: number } {
  let price = basePrice
  let phase: MarketPhase = 'accumulation'
  let rsi = 50
  const rsiFn = smoothRSI()
  const dailyVol = vixDailyVol()
  let prevPrice = price

  for (let i = 0; i < 100; i++) {
    const tick = generateTick(price, phase, dailyVol, rsi, rng, price)
    prevPrice = price
    price = tick.price
    rsi = rsiFn(prevPrice, price)
    const of: OrderFlow = { buyVolume: tick.buyVol, sellVolume: tick.sellVol, netImbalance: 0 }
    phase = pickPhase(phase, rsi, of, rng, i)
  }
  return { price, phase, rsi }
}

function generateNextTick(sym: MockSymbolState, symbol: string): Tick {
  const dailyVol = vixDailyVol()
  const tick = generateTick(sym.price, sym.phase, dailyVol, sym.rsi, sym.rng, sym.refPrice)

  sym.prevTickPrice = sym.price
  sym.price = tick.price
  sym.rsi = sym.rsiFn(sym.prevTickPrice, sym.price)

  sym.high = Math.max(sym.high, sym.price)
  sym.low = Math.min(sym.low, sym.price)

  sym.tickCount++
  sym.orderFlow.buyVolume += tick.buyVol
  sym.orderFlow.sellVolume += tick.sellVol
  const total = sym.orderFlow.buyVolume + sym.orderFlow.sellVolume
  sym.orderFlow.netImbalance = total > 0 ? (sym.orderFlow.buyVolume - sym.orderFlow.sellVolume) / total : 0

  if (sym.tickCount % 50 === 0) sym.refPrice = sym.price
  sym.phase = pickPhase(sym.phase, sym.rsi, sym.orderFlow, sym.rng, sym.tickCount)

  const change = sym.price - sym.dayStartPrice
  const changePercent = sym.dayStartPrice > 0 ? (change / sym.dayStartPrice) * 100 : 0

  return {
    instrumentId: instrumentId(symbol),
    symbol,
    timestamp: new Date().toISOString(),
    price: sym.price,
    volume: Math.round(tick.buyVol + tick.sellVol),
    bid: sym.price - 0.05,
    ask: sym.price + 0.05,
    open: sym.open,
    high: sym.high,
    low: sym.low,
    prevClose: sym.dayStartPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
  }
}

const SYMBOL_TO_ID: Record<string, number> = {
  NIFTY: 1, BANKNIFTY: 2, RELIANCE: 3, TCS: 4, HDFCBANK: 5, INFY: 6,
  ICICIBANK: 7, SBIN: 8, BHARTIARTL: 9, ITC: 10, WIPRO: 11, HINDUNILVR: 12,
  AAPL: 13, MSFT: 14, 'BTC-USD': 15,
}
let nextId = 100

function instrumentId(symbol: string): number {
  return SYMBOL_TO_ID[symbol] ?? (() => { const id = nextId++; SYMBOL_TO_ID[symbol] = id; return id })()
}

function ensureSymbol(symbol: string): MockSymbolState {
  let s = state.get(symbol)
  if (!s) {
    s = initSymbol(symbol)
    state.set(symbol, s)
    for (let i = 0; i < 100; i++) generateNextTick(s, symbol)
  }
  return s
}

export function getLatestTick(symbol: string): Tick | null {
  const s = ensureSymbol(symbol)
  return generateNextTick(s, symbol)
}

export function getAllLatestTicks(symbols?: string[]): Tick[] {
  const list = symbols ?? DEFAULT_SYMBOLS
  return list.map(symbol => {
    const s = ensureSymbol(symbol)
    for (let i = 0; i < 12; i++) generateNextTick(s, symbol)
    return generateNextTick(s, symbol)
  })
}

export function advanceTicks(symbols?: string[], count: number = 6): Tick[] {
  const list = symbols ?? DEFAULT_SYMBOLS
  return list.map(symbol => {
    const s = ensureSymbol(symbol)
    for (let i = 0; i < count; i++) generateNextTick(s, symbol)
    return generateNextTick(s, symbol)
  })
}

export function resetMockData(): void {
  state.clear()
}
