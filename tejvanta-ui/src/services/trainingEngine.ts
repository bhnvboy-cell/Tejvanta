import type { MarketPhase } from './marketEngine'
import { generateInitialCandles, TICK_INTERVAL, createRng, hashSymbol, symbolPrice, vixDailyVol } from './marketEngine'
import { TICKER_MAP } from '../config/defaultWatchlist'

export type TileLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Master'
export type TileCategory = 'Trend' | 'Breakout' | 'Pattern' | 'Options' | 'Mean-Reversion' | 'System'

export interface StrategyTile {
  id: string
  title: string
  level: TileLevel
  category: TileCategory
  instruments: string[]
  timeframes: string[]
  indicators: string[]
  patternType: string | null
  description: string
  entryRules: string
  stopLoss: string
  takeProfit: string
  filters: string
  mockDataPatterns: string[]
  replayScenarios: string[]
  practiceSessions: number
  evaluationCriteria: string
}

export interface PatternOverride {
  phaseSequence: MarketPhase[]
  driftValues: number[]
  volatilityValues: number[]
  rsiTarget: number | null
  orderFlowBias: 'buy' | 'sell' | 'neutral'
  volumeMultiplier: number
  poleCandles: number | null
  consolidationCandles: number | null
}

export interface MockDataPattern {
  id: string
  name: string
  description: string
  ohlcBehavior: string
  moveRange: string
  level: TileLevel
  linkedStrategyIds: string[]
  override: PatternOverride
}

export interface ReplayScenario {
  id: string
  name: string
  instruments: string[]
  windowDays: number
  regime: string
  level: TileLevel
  strategyIds: string[]
  learningObjectives: string[]
  speedRange: [number, number]
  tickCount: number
  candleData: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
}

const TICK_SECONDS = TICK_INTERVAL

function generatePatternCandles(
  symbol: string,
  override: PatternOverride,
  numCandles: number,
  interval: number = 300,
): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  const now = Math.floor(Date.now() / 1000)
  const alignedNow = Math.floor(now / interval) * interval
  const startTime = alignedNow - numCandles * interval
  let price = symbolPrice(symbol)
  const dailyVol = vixDailyVol()
  const rng = createRng(hashSymbol(symbol + override.phaseSequence.join('')))
  const ticksPerCandle = Math.max(1, Math.round(interval / TICK_SECONDS))
  const perTickScale = Math.sqrt(TICK_INTERVAL / 86400)

  const data: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = []
  let rsi = 50
  let prevPrice = price

  const totalSegments = override.phaseSequence.length
  const candlesPerSegment = Math.max(3, Math.floor(numCandles / totalSegments))

  for (let i = 0; i < numCandles; i++) {
    const segIdx = Math.min(Math.floor(i / candlesPerSegment), totalSegments - 1)
    const phase = override.phaseSequence[segIdx]
    const drift = override.driftValues[segIdx] ?? 0
    const volFactor = override.volatilityValues[segIdx] ?? 1

    const t = startTime + i * interval
    const open = price
    let high = open, low = open
    let candleBuyVol = 0, candleSellVol = 0

    for (let j = 0; j < ticksPerCandle; j++) {
      const maxDelta = price * 0.0005
      const driftVal = drift * dailyVol * price * perTickScale * volFactor
      const noise = (rng() - 0.5) * dailyVol * price * perTickScale * volFactor * 2
      let change = driftVal + noise
      change = Math.max(-maxDelta, Math.min(maxDelta, change))
      price = Math.round((price + change) * 100) / 100
      high = Math.max(high, price)
      low = Math.min(low, price)
      const goingUp = price > prevPrice
      const baseVol = Math.round(1000 + rng() * 5000)
      candleBuyVol += goingUp ? baseVol : Math.round(baseVol * 0.3)
      candleSellVol += goingUp ? Math.round(baseVol * 0.3) : baseVol
      prevPrice = price

      if (override.rsiTarget != null && i > numCandles * 0.6) {
        const diff = override.rsiTarget - rsi
        price += diff * 0.01 * price * 0.001
      }
    }

    data.push({
      time: t,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume: Math.round((candleBuyVol + candleSellVol) * override.volumeMultiplier * (0.5 + rng() * 0.5)),
    })
  }

  return data
}

export const MOCK_PATTERNS: MockDataPattern[] = [
  {
    id: 'EPB-01',
    name: 'Smooth Uptrend with Shallow Pullbacks',
    description: 'HH/HL sequence with pullbacks touching EMA20 and bouncing. 3-5 pullbacks per 100 candles.',
    ohlcBehavior: 'Gradual uptrend (+0.03-0.06% per tick), pullbacks retrace 10-15% then reverse at EMA20.',
    moveRange: '+0.03-0.06% per tick',
    level: 'Beginner',
    linkedStrategyIds: ['tile-ema-pullback'],
    override: {
      phaseSequence: ['accumulation', 'manipulation', 'accumulation', 'manipulation'],
      driftValues: [0.02, 0.08, -0.01, 0.08],
      volatilityValues: [0.3, 1.0, 0.5, 1.0],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'EPB-02',
    name: 'Deep Pullback Heavy Retrace',
    description: 'Retrace 38-50% of prior swing, touches EMA50, reversal candle closes above EMA20.',
    ohlcBehavior: '-0.06 to -0.10% per tick during retrace, then +0.08% per tick on reversal.',
    moveRange: '-0.10% then +0.08% per tick',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-ema-pullback', 'tile-breakout-retest'],
    override: {
      phaseSequence: ['manipulation', 'distribution', 'accumulation', 'manipulation'],
      driftValues: [0.08, -0.06, 0.01, 0.08],
      volatilityValues: [1.0, 0.7, 0.4, 1.0],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.2,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'EPB-03',
    name: 'Failed Pullback Leading to Reversal',
    description: 'Price touches EMA20, closes below it, confirms breakdown below EMA50.',
    ohlcBehavior: '-0.05% per tick accelerating after EMA50 breakdown.',
    moveRange: '-0.05% per tick accelerating',
    level: 'Advanced',
    linkedStrategyIds: ['tile-m-pattern-reversal'],
    override: {
      phaseSequence: ['manipulation', 'distribution', 'fvg', 'distribution'],
      driftValues: [0.06, -0.02, -0.05, -0.08],
      volatilityValues: [0.8, 0.6, 1.2, 1.0],
      rsiTarget: null,
      orderFlowBias: 'sell',
      volumeMultiplier: 1.3,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'MRP-01',
    name: 'RSI > 75 Sharp Reversal',
    description: '5-8 candles of buying push RSI above 75, then bearish engulfing drops RSI below 50.',
    ohlcBehavior: '+0.08% per tick then -0.06% per tick on reversal.',
    moveRange: '+0.08% to -0.06% per tick',
    level: 'Beginner',
    linkedStrategyIds: ['tile-rsi-mean-reversion'],
    override: {
      phaseSequence: ['manipulation', 'distribution', 'consolidation'],
      driftValues: [0.10, -0.06, 0.0],
      volatilityValues: [1.2, 0.8, 0.3],
      rsiTarget: null,
      orderFlowBias: 'neutral',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'MRP-02',
    name: 'RSI < 25 V-Bottom',
    description: '5-8 candles of selling push RSI below 25, then bullish hammer closes above EMA20.',
    ohlcBehavior: '-0.08% per tick then +0.06% on reversal.',
    moveRange: '-0.08% to +0.06% per tick',
    level: 'Beginner',
    linkedStrategyIds: ['tile-rsi-mean-reversion'],
    override: {
      phaseSequence: ['distribution', 'accumulation', 'manipulation'],
      driftValues: [-0.08, 0.01, 0.08],
      volatilityValues: [1.0, 0.4, 1.0],
      rsiTarget: null,
      orderFlowBias: 'neutral',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'MRP-03',
    name: 'Slow Grind Reversion with False Signals',
    description: 'Gradual drift to RSI > 75, slow choppy reversal over 15+ candles with false signals.',
    ohlcBehavior: '+0.03% then -0.02% per tick, with choppy intermediate moves.',
    moveRange: '+0.03% to -0.02% per tick',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-rsi-mean-reversion'],
    override: {
      phaseSequence: ['manipulation', 'fvg', 'distribution', 'consolidation'],
      driftValues: [0.04, 0.02, -0.02, 0.0],
      volatilityValues: [0.6, 0.8, 0.5, 0.3],
      rsiTarget: null,
      orderFlowBias: 'neutral',
      volumeMultiplier: 0.8,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'BOP-01',
    name: 'Tight Compression Breakout',
    description: '10-15 candles with range < 0.3% of price, then sudden expansion candle with above-avg volume.',
    ohlcBehavior: 'Compression ±0.02% per tick, then +0.5% on breakout candle.',
    moveRange: '+0.5% on breakout',
    level: 'Beginner',
    linkedStrategyIds: ['tile-simple-breakout'],
    override: {
      phaseSequence: ['consolidation', 'accumulation', 'manipulation', 'fvg'],
      driftValues: [0.0, 0.02, 0.10, 0.0],
      volatilityValues: [0.15, 0.25, 1.0, 0.8],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'BOP-02',
    name: 'Breakout Retest Continuation',
    description: 'Break above resistance, pullback to old resistance (now support), bounce and continuation.',
    ohlcBehavior: '+0.08% per tick breakout, -0.03% retest, +0.06% continuation.',
    moveRange: '+0.6% total',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-breakout-retest', 'tile-mtf-confluence'],
    override: {
      phaseSequence: ['accumulation', 'manipulation', 'accumulation', 'manipulation'],
      driftValues: [0.02, 0.08, -0.02, 0.06],
      volatilityValues: [0.3, 1.0, 0.4, 0.9],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.2,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'BOP-03',
    name: 'Fakeout Breakout Reversal',
    description: 'Break above resistance, close back inside range after 2 candles, trap buyers, sharp reversal.',
    ohlcBehavior: '+0.04% breakout, -0.02% fakeout close, then -0.07% per tick reversal.',
    moveRange: '-0.5% after fakeout',
    level: 'Advanced',
    linkedStrategyIds: ['tile-mtf-confluence'],
    override: {
      phaseSequence: ['accumulation', 'manipulation', 'distribution', 'fvg', 'distribution'],
      driftValues: [0.02, 0.05, -0.04, -0.03, -0.07],
      volatilityValues: [0.3, 0.8, 0.6, 0.8, 1.0],
      rsiTarget: null,
      orderFlowBias: 'sell',
      volumeMultiplier: 1.4,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'FLG-01',
    name: 'Bull Flag',
    description: '7-candle pole (+0.7%), 10-candle flag channel (-0.1% drift), then breakout (+0.8%). Volume drops 40% during flag, spikes 2x on breakout.',
    ohlcBehavior: '+1.5% total, with flag channel sloping 15-30° opposite the pole.',
    moveRange: '+1.5% total',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-flag-breakout'],
    override: {
      phaseSequence: ['manipulation', 'consolidation', 'manipulation', 'fvg'],
      driftValues: [0.10, -0.01, 0.08, 0.0],
      volatilityValues: [1.2, 0.25, 1.0, 0.8],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.0,
      poleCandles: 7,
      consolidationCandles: 10,
    },
  },
  {
    id: 'FLG-02',
    name: 'Bear Flag',
    description: '6-candle pole (-0.6%), 10-candle flag channel (+0.1% drift), then breakdown (-0.7%).',
    ohlcBehavior: '-1.3% total, with rising flag channel.',
    moveRange: '-1.3% total',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-flag-breakout'],
    override: {
      phaseSequence: ['distribution', 'consolidation', 'distribution'],
      driftValues: [-0.10, 0.01, -0.08],
      volatilityValues: [1.2, 0.25, 1.0],
      rsiTarget: null,
      orderFlowBias: 'sell',
      volumeMultiplier: 1.0,
      poleCandles: 6,
      consolidationCandles: 10,
    },
  },
  {
    id: 'PEN-01',
    name: 'Bull Pennant',
    description: '5-candle pole (+0.5%), 7-candle converging pennant (range shrinks from 0.3% to 0.1%), then breakout (+0.6%).',
    ohlcBehavior: '+1.1% total, converging triangle with lower highs + higher lows.',
    moveRange: '+1.1% total',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-pennant-breakout'],
    override: {
      phaseSequence: ['manipulation', 'accumulation', 'manipulation'],
      driftValues: [0.10, 0.0, 0.08],
      volatilityValues: [1.0, 0.2, 0.9],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.0,
      poleCandles: 5,
      consolidationCandles: 7,
    },
  },
  {
    id: 'PEN-02',
    name: 'Bear Pennant',
    description: '5-candle pole (-0.5%), 7-candle converging pennant, then breakdown (-0.5%).',
    ohlcBehavior: '-1.0% total, converging triangle.',
    moveRange: '-1.0% total',
    level: 'Intermediate',
    linkedStrategyIds: ['tile-pennant-breakout'],
    override: {
      phaseSequence: ['distribution', 'consolidation', 'distribution'],
      driftValues: [-0.10, 0.0, -0.08],
      volatilityValues: [1.0, 0.2, 0.9],
      rsiTarget: null,
      orderFlowBias: 'sell',
      volumeMultiplier: 1.0,
      poleCandles: 5,
      consolidationCandles: 7,
    },
  },
  {
    id: 'M-01',
    name: 'Clean Double Top Reversal',
    description: 'Peak 1 at +0.8%, trough at +0.2%, Peak 2 at +0.78% with lower volume and weak RSI. Neckline break at +0.2%.',
    ohlcBehavior: 'Two peaks at similar level, weaker second peak, break below neckline projects -0.6%.',
    moveRange: '-0.6% projected',
    level: 'Advanced',
    linkedStrategyIds: ['tile-m-pattern-reversal'],
    override: {
      phaseSequence: ['manipulation', 'accumulation', 'manipulation', 'distribution', 'fvg', 'distribution'],
      driftValues: [0.10, -0.04, 0.06, -0.02, -0.03, -0.06],
      volatilityValues: [1.2, 0.4, 0.8, 0.6, 0.8, 1.0],
      rsiTarget: null,
      orderFlowBias: 'sell',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'W-01',
    name: 'Clean Double Bottom Reversal',
    description: 'Trough 1 at -0.7%, middle peak at -0.1%, Trough 2 at -0.72% with higher volume and RSI divergence. Neckline break at -0.1%.',
    ohlcBehavior: 'Two troughs at similar level, stronger second trough, break above neckline projects +0.6%.',
    moveRange: '+0.6% projected',
    level: 'Advanced',
    linkedStrategyIds: ['tile-w-pattern-reversal'],
    override: {
      phaseSequence: ['distribution', 'manipulation', 'distribution', 'accumulation', 'manipulation'],
      driftValues: [-0.08, 0.04, -0.05, 0.02, 0.08],
      volatilityValues: [1.0, 0.6, 0.8, 0.4, 1.0],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'VOL-01',
    name: 'Trend Day',
    description: '100+ candles in one direction with 3-5 shallow pullbacks (< 20% retrace) and rising volume.',
    ohlcBehavior: '+1.2% across the day, volatility 0.8x normal.',
    moveRange: '+1.2% across day',
    level: 'Master',
    linkedStrategyIds: ['tile-ema-pullback', 'tile-system-builder'],
    override: {
      phaseSequence: ['accumulation', 'manipulation', 'accumulation', 'manipulation', 'accumulation', 'manipulation'],
      driftValues: [0.02, 0.08, 0.01, 0.07, 0.01, 0.08],
      volatilityValues: [0.3, 0.8, 0.3, 0.8, 0.3, 0.9],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 1.2,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'VOL-02',
    name: 'Range-Bound Day',
    description: '80+ candles in horizontal channel (0.3% tall) with wicky candles and 4+ failed breakouts.',
    ohlcBehavior: 'Net ±0.05% across day, volatility 0.5x normal.',
    moveRange: '±0.05% net',
    level: 'Master',
    linkedStrategyIds: ['tile-system-builder'],
    override: {
      phaseSequence: ['consolidation', 'accumulation', 'consolidation', 'accumulation', 'consolidation'],
      driftValues: [0.0, 0.01, 0.0, -0.01, 0.0],
      volatilityValues: [0.15, 0.25, 0.15, 0.25, 0.15],
      rsiTarget: null,
      orderFlowBias: 'neutral',
      volumeMultiplier: 0.7,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'VOL-03',
    name: 'Volatility Expansion',
    description: 'Bollinger band width < 50% for 20 candles, then 2.5x range candle + breakout.',
    ohlcBehavior: 'Volatility goes from 0.4x to 2.0x, +0.8% on breakout.',
    moveRange: '+0.8%',
    level: 'Advanced',
    linkedStrategyIds: ['tile-volatility-breakout'],
    override: {
      phaseSequence: ['consolidation', 'consolidation', 'accumulation', 'manipulation'],
      driftValues: [0.0, 0.0, 0.02, 0.10],
      volatilityValues: [0.15, 0.15, 0.4, 2.0],
      rsiTarget: null,
      orderFlowBias: 'buy',
      volumeMultiplier: 2.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
  {
    id: 'VOL-04',
    name: 'Liquidity Shock',
    description: '3x average range candle with spread widening 2x, normalizing in 3-5 candles.',
    ohlcBehavior: '±1.0% single candle, volatility spikes to 3x then decays.',
    moveRange: '±1.0% single candle',
    level: 'Master',
    linkedStrategyIds: ['tile-system-builder'],
    override: {
      phaseSequence: ['consolidation', 'fvg', 'consolidation'],
      driftValues: [0.0, 0.0, 0.0],
      volatilityValues: [0.15, 3.0, 0.3],
      rsiTarget: null,
      orderFlowBias: 'neutral',
      volumeMultiplier: 3.0,
      poleCandles: null,
      consolidationCandles: null,
    },
  },
]

export const STRATEGY_TILES: StrategyTile[] = [
  {
    id: 'tile-ema-pullback',
    title: 'EMA20 Pullback',
    level: 'Beginner',
    category: 'Trend',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER3],
    timeframes: ['5m', '15m'],
    indicators: ['EMA20', 'RSI14'],
    patternType: 'HH/HL',
    description: 'Buy pullbacks to EMA20 in an uptrend. Confirm with RSI > 40. Tight SL below swing low.',
    entryRules: 'Price above EMA20, trending with HH/HL. Price pulls back to EMA20 or slightly below. Bullish candle close after touching EMA20.',
    stopLoss: '1x ATR below entry or below recent swing low',
    takeProfit: '2x risk or previous resistance level',
    filters: 'No entry if RSI > 70. No entry during chop (SMA50 flat).',
    mockDataPatterns: ['EPB-01', 'EPB-02'],
    replayScenarios: ['RS-01'],
    practiceSessions: 5,
    evaluationCriteria: '10 trades with ≥1:2 RR',
  },
  {
    id: 'tile-rsi-mean-reversion',
    title: 'RSI Mean-Reversion',
    level: 'Beginner',
    category: 'Mean-Reversion',
    instruments: [TICKER_MAP.TICKER2, TICKER_MAP.TICKER4],
    timeframes: ['5m', '15m'],
    indicators: ['RSI14'],
    patternType: null,
    description: 'Enter when RSI14 crosses out of oversold (<30) or overbought (>70). Confirmation candle required.',
    entryRules: 'RSI14 enters oversold (<30) or overbought (>70) zone. Wait for confirmation candle of opposite direction.',
    stopLoss: 'Beyond recent swing point (low for oversold, high for overbought)',
    takeProfit: 'Nearest S/R level or 1.5x risk',
    filters: 'Skip if trend is strongly against you (e.g., oversold in powerful downtrend).',
    mockDataPatterns: ['MRP-01', 'MRP-02'],
    replayScenarios: ['RS-02'],
    practiceSessions: 5,
    evaluationCriteria: '10 trades, identify reversal candle correctly',
  },
  {
    id: 'tile-simple-breakout',
    title: 'Simple Breakout',
    level: 'Beginner',
    category: 'Breakout',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER2, TICKER_MAP.TICKER3, TICKER_MAP.TICKER4],
    timeframes: ['5m', '15m', '1h'],
    indicators: ['Volume'],
    patternType: null,
    description: 'Enter when price breaks a key S/R level with above-average volume. Confirm with close outside range.',
    entryRules: 'Price compresses in tight range (10-15 candles). Price breaks above resistance or below support with above-avg volume. 1 candle after breakout closes outside range.',
    stopLoss: 'Inside the range (midpoint or opposite side)',
    takeProfit: '2x range height projected',
    filters: 'No entry on first candle touch; wait for confirmation candle close.',
    mockDataPatterns: ['BOP-01'],
    replayScenarios: ['RS-04'],
    practiceSessions: 5,
    evaluationCriteria: '10 breakout trades, correct volume confirmation',
  },
  {
    id: 'tile-breakout-retest',
    title: 'Breakout + Retest',
    level: 'Intermediate',
    category: 'Breakout',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER2, TICKER_MAP.TICKER3, TICKER_MAP.TICKER4],
    timeframes: ['5m', '15m', '1h'],
    indicators: ['Volume'],
    patternType: null,
    description: 'After a breakout, wait for retest of the level from the other side. Enter on rejection candle. Avoid fake breakouts.',
    entryRules: 'Price breaks a key S/R level, then pulls back to retest it from the other side. Enter after retest candle closes showing rejection (long wick against breakout direction).',
    stopLoss: 'Beyond the retest low/high by 0.5x ATR',
    takeProfit: '2x risk or next S/R level',
    filters: 'Entry only if retest is within 5 candles of breakout. Skip if retest fails (closes back past the level).',
    mockDataPatterns: ['BOP-02', 'BOP-03'],
    replayScenarios: ['RS-04', 'RS-05'],
    practiceSessions: 8,
    evaluationCriteria: '15 trades, identify fakeout vs genuine retest',
  },
  {
    id: 'tile-mtf-confluence',
    title: 'Multi-Timeframe Confluence',
    level: 'Intermediate',
    category: 'Trend',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER3],
    timeframes: ['4h + 5m', '4h + 15m'],
    indicators: ['EMA20', 'EMA50', 'RSI14'],
    patternType: null,
    description: 'Use 4h chart for trend direction (EMA20 > EMA50, price above). Enter on 5m/15m pullback with confirmation.',
    entryRules: 'Higher TF (4h) trend confirmed (EMA20 > EMA50, price above both). Lower TF (5m/15m) shows pullback to EMA20 + bullish reversal candle.',
    stopLoss: 'Below the pullback swing low (lower TF)',
    takeProfit: '1.5x ATR of higher TF, or next higher TF S/R',
    filters: 'If higher TF is choppy (EMAs entangled), skip.',
    mockDataPatterns: ['EPB-01', 'EPB-02'],
    replayScenarios: ['RS-09'],
    practiceSessions: 8,
    evaluationCriteria: '15 trades with higher TF bias documented',
  },
  {
    id: 'tile-flag-breakout',
    title: 'Flag Pattern Breakout',
    level: 'Intermediate',
    category: 'Pattern',
    instruments: [TICKER_MAP.TICKER2, TICKER_MAP.TICKER3],
    timeframes: ['5m', '15m', '1h'],
    indicators: ['Volume'],
    patternType: 'Flag',
    description: 'Sharp pole, tight channel consolidation (sloping opposite to pole). Enter on channel breakout with volume spike. Pole height = TP projection.',
    entryRules: 'Sharp up/down move (pole, 5-10 strong candles). Tight consolidation channel sloping opposite the pole. Enter when price breaks flag channel in pole direction with high volume.',
    stopLoss: 'Opposite side of the flag',
    takeProfit: 'Pole height projected from breakout point',
    filters: 'Flag slope should be 15-30 degrees opposite the pole. Volume drops during flag, spikes on breakout.',
    mockDataPatterns: ['FLG-01', 'FLG-02'],
    replayScenarios: ['RS-03'],
    practiceSessions: 6,
    evaluationCriteria: '10 flag trades, correct pole measurement',
  },
  {
    id: 'tile-pennant-breakout',
    title: 'Pennant Pattern Breakout',
    level: 'Intermediate',
    category: 'Pattern',
    instruments: [TICKER_MAP.TICKER2, TICKER_MAP.TICKER4],
    timeframes: ['5m', '15m'],
    indicators: ['Volume'],
    patternType: 'Pennant',
    description: 'Sharp pole, converging triangle (lower highs + higher lows). Enter on breakout with volume. Shorter pennants yield stronger breakouts.',
    entryRules: 'Sharp move (pole, 4-8 candles). Converging consolidation (lower highs + higher lows). Breakout above upper trendline (bullish) or below lower (bearish) with volume.',
    stopLoss: 'Apex of the pennant or 0.5x ATR inside',
    takeProfit: 'Pole height projected',
    filters: 'Pennant duration should be 1/3 to 1/2 of pole duration. Shorter pennants = stronger breakouts.',
    mockDataPatterns: ['PEN-01', 'PEN-02'],
    replayScenarios: ['RS-03'],
    practiceSessions: 6,
    evaluationCriteria: '10 pennant trades, correct apex measurement',
  },
  {
    id: 'tile-m-pattern-reversal',
    title: 'M Pattern Reversal',
    level: 'Advanced',
    category: 'Pattern',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER3],
    timeframes: ['1h', '4h'],
    indicators: ['RSI14', 'Volume'],
    patternType: 'M',
    description: 'Two peaks at same level; second peak shows weaker momentum (lower volume, RSI divergence). Enter on neckline break below middle trough.',
    entryRules: 'Two peaks at similar level (within 0.5%) with trough between. Second peak shows weaker momentum (lower volume, longer upper wick, RSI divergence). Enter on neckline break (the trough).',
    stopLoss: 'Above second peak',
    takeProfit: 'Neckline-to-peak height projected below neckline',
    filters: 'RSI divergence between peaks is a strong filter (price higher but RSI lower).',
    mockDataPatterns: ['M-01'],
    replayScenarios: ['RS-06'],
    practiceSessions: 8,
    evaluationCriteria: '10 M-pattern trades, document RSI divergence for each',
  },
  {
    id: 'tile-w-pattern-reversal',
    title: 'W Pattern Reversal',
    level: 'Advanced',
    category: 'Pattern',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER4],
    timeframes: ['1h', '4h'],
    indicators: ['RSI14', 'Volume'],
    patternType: 'W',
    description: 'Two troughs at same level; second trough shows stronger momentum (higher volume, RSI bullish divergence). Enter on neckline break above middle peak.',
    entryRules: 'Two troughs at similar level (within 0.5%). Second trough shows stronger momentum (higher volume, shorter lower wick, RSI bullish divergence). Enter on neckline break (the middle peak).',
    stopLoss: 'Below second trough',
    takeProfit: 'Neckline-to-trough height projected above neckline',
    filters: 'Prefer W pattern after a prolonged downtrend.',
    mockDataPatterns: ['W-01'],
    replayScenarios: ['RS-06'],
    practiceSessions: 8,
    evaluationCriteria: '10 W-pattern trades, document RSI divergence for each',
  },
  {
    id: 'tile-options-directional',
    title: 'Options Directional Strategy',
    level: 'Advanced',
    category: 'Options',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER2],
    timeframes: ['15m', '1h'],
    indicators: ['EMA20', 'RSI14', 'Volume'],
    patternType: null,
    description: 'Combine strong TA setup with near-month ATM options. Calls for bullish, Puts for bearish. Options supplement primary trade. Max 30% of risk budget.',
    entryRules: 'Strong technical setup (e.g., EMA pullback + volume) aligned with expected directional move. Select near-month ATM options. Buy Call (bullish) or Buy Put (bearish).',
    stopLoss: 'Position size equivalent to 1.5x the underlying SL',
    takeProfit: '50-100% of premium or at the underlying TP level',
    filters: 'Never more than 30% of risk budget in options. Options are supplementary, not primary. Expiry >= 7 days.',
    mockDataPatterns: ['BOP-02', 'EPB-01'],
    replayScenarios: ['RS-07'],
    practiceSessions: 6,
    evaluationCriteria: '10 options trades, document IV, delta, expiry reasoning',
  },
  {
    id: 'tile-options-spread',
    title: 'Options Spread Strategy',
    level: 'Advanced',
    category: 'Options',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER2],
    timeframes: ['1h', '4h'],
    indicators: ['Vol Bands'],
    patternType: null,
    description: 'Bull call spread / bear put spread: Buy ATM, sell OTM one strike apart. Defined risk (premium paid). Prefer low IV (< 30th percentile).',
    entryRules: 'Defined-risk directional bet using bull call spread or bear put spread. Buy ATM option, sell OTM option (1 strike apart). Net debit paid.',
    stopLoss: '100% of premium paid (max loss)',
    takeProfit: 'Max profit = strike width minus premium paid',
    filters: 'IV < 30th percentile of 20-day range recommended. Avoid before major events.',
    mockDataPatterns: ['BOP-01'],
    replayScenarios: ['RS-07'],
    practiceSessions: 6,
    evaluationCriteria: '10 spread trades, calculate max loss and max profit correctly',
  },
  {
    id: 'tile-volatility-breakout',
    title: 'Volatility Breakout Strategy',
    level: 'Advanced',
    category: 'Breakout',
    instruments: [TICKER_MAP.TICKER2, TICKER_MAP.TICKER3],
    timeframes: ['15m', '1h'],
    indicators: ['Vol Bands', 'Volume'],
    patternType: null,
    description: 'Enter when synthetic Bollinger bands reach minimum width of 20 periods, then expansion candle (> 2x avg range) breaks out in its direction.',
    entryRules: 'Bollinger bands (SMA20 bands) at minimum width of 20 candles. Expansion candle > 2x average range. Enter in direction of expansion candle.',
    stopLoss: 'Beyond the expansion candle low (bullish) or high (bearish)',
    takeProfit: '2x ATR or next key level',
    filters: 'Skip if expansion happens during low-liquidity period.',
    mockDataPatterns: ['VOL-03'],
    replayScenarios: ['RS-08'],
    practiceSessions: 6,
    evaluationCriteria: '10 volatility breakout trades, measure band width correctly',
  },
  {
    id: 'tile-system-builder',
    title: 'Custom System Builder',
    level: 'Master',
    category: 'System',
    instruments: [TICKER_MAP.TICKER1, TICKER_MAP.TICKER2, TICKER_MAP.TICKER3, TICKER_MAP.TICKER4],
    timeframes: ['all'],
    indicators: ['all'],
    patternType: null,
    description: 'Design, backtest, and refine your own trading system. Define entry/exit rules, filters, risk models, and instrument/timeframe preferences. Validate with 100-trade challenge.',
    entryRules: 'Define your own entry conditions (e.g., EMA20 touch + RSI < 35 + bullish engulfing on 15m)',
    stopLoss: 'Define your own SL rules (e.g., 1% per trade, max 3% daily loss)',
    takeProfit: 'Define your own TP rules (e.g., 2x ATR, trailing SL after 1x ATR in profit)',
    filters: 'Define filters to skip (e.g., ATR > 3x 20-period avg, EMA20/50 entangled)',
    mockDataPatterns: ['VOL-01', 'VOL-02', 'VOL-04'],
    replayScenarios: ['RS-09', 'RS-10', 'RS-11'],
    practiceSessions: 20,
    evaluationCriteria: '100 trades, >=3 strategies, <=15% max drawdown, documented system',
  },
]

export const REPLAY_SCENARIOS: ReplayScenario[] = []

export function getPatternById(id: string): MockDataPattern | undefined {
  return MOCK_PATTERNS.find(p => p.id === id)
}

export function getTileById(id: string): StrategyTile | undefined {
  return STRATEGY_TILES.find(t => t.id === id)
}

export function getPatternsForTile(tileId: string): MockDataPattern[] {
  const tile = getTileById(tileId)
  if (!tile) return []
  return tile.mockDataPatterns.map(id => getPatternById(id)).filter(Boolean) as MockDataPattern[]
}

export function getScenariosForTile(tileId: string): ReplayScenario[] {
  const tile = getTileById(tileId)
  if (!tile) return []
  return tile.replayScenarios.map(id => REPLAY_SCENARIOS.find(s => s.id === id)).filter(Boolean) as ReplayScenario[]
}

export function generatePatternData(
  patternId: string,
  symbol: string = TICKER_MAP.TICKER1,
  numCandles: number = 80,
): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  const pattern = getPatternById(patternId)
  if (!pattern) return generateInitialCandles(symbol, '5m').data
  return generatePatternCandles(symbol, pattern.override, numCandles, 300)
}

export function generateScenarioData(
  scenarioId: string,
  symbol: string = TICKER_MAP.TICKER1,
): Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> {
  const scenario = REPLAY_SCENARIOS.find(s => s.id === scenarioId)
  if (scenario && scenario.candleData.length > 0) return scenario.candleData
  const patternsForScenario: MockDataPattern[] = scenarioId === 'RS-01' ? [getPatternById('EPB-01')!].filter(Boolean)
    : scenarioId === 'RS-02' ? [getPatternById('MRP-01')!, getPatternById('MRP-02')!].filter(Boolean)
    : scenarioId === 'RS-03' ? [getPatternById('FLG-01')!, getPatternById('PEN-01')!].filter(Boolean)
    : scenarioId === 'RS-04' ? [getPatternById('BOP-02')!].filter(Boolean)
    : scenarioId === 'RS-05' ? [getPatternById('VOL-02')!].filter(Boolean)
    : scenarioId === 'RS-06' ? [getPatternById('M-01')!, getPatternById('W-01')!].filter(Boolean)
    : scenarioId === 'RS-07' ? [getPatternById('BOP-02')!].filter(Boolean)
    : scenarioId === 'RS-08' ? [getPatternById('VOL-03')!].filter(Boolean)
    : scenarioId === 'RS-09' ? [getPatternById('EPB-01')!, getPatternById('EPB-02')!].filter(Boolean)
    : scenarioId === 'RS-10' ? [getPatternById('VOL-04')!].filter(Boolean)
    : scenarioId === 'RS-11' ? [getPatternById('VOL-01')!, getPatternById('VOL-02')!, getPatternById('VOL-04')!].filter(Boolean)
    : []
  if (patternsForScenario.length === 0) return generateInitialCandles(symbol, '5m').data
  let allData: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = []
  for (const p of patternsForScenario) {
    const segData = generatePatternCandles(p.id, p.override, 60, 300)
    allData = allData.concat(segData)
  }
  return allData
}

export function generateScenarioReplayData(symbol: string): Array<{ time: number; price: number; volume: number; buyVol: number; sellVol: number }> {
  const candles = generateInitialCandles(symbol, '5m')
  const ticks: Array<{ time: number; price: number; volume: number; buyVol: number; sellVol: number }> = []
  for (const c of candles.data) {
    for (let i = 0; i < 5; i++) {
      ticks.push({
        time: c.time + i,
        price: c.close,
        volume: Math.round(c.volume / 5),
        buyVol: Math.round(c.volume / 10),
        sellVol: Math.round(c.volume / 10),
      })
    }
  }
  return ticks
}
