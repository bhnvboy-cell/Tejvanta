# Tejvanta Offline Modules — Complete Architecture

---

## 1) BACKTESTING_ENGINE

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   BacktestEngine                        │
├─────────────────────────────────────────────────────────┤
│  run(config: BacktestConfig): BacktestResult            │
│  runBatch(patterns: string[]): BatchResult              │
│  walkForward(config): WalkForwardResult                 │
│  multiTimeframe(config): BacktestResult                 │
│  portfolio(configs: BacktestConfig[]): PortfolioResult  │
└───────────┬─────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │  StrategyRunner │
    │  ┌────────────┐ │
    │  │ PineStrat  │ │  ← executes PineScript strategy on candle data
    │  │ BuiltInStrat│ │  ← SMA/EMA/RSI/pattern-based strategies
    │  └────────────┘ │
    └───────┬─────────┘
            │
    ┌───────┴────────┐
    │  TradeLogger    │  ← records every fill, SL hit, TP hit
    └───────┬─────────┘
            │
    ┌───────┴────────┐
    │  MetricsEngine  │  ← computes win rate, R-multiple, drawdown, etc.
    └────────────────┘
```

### Data Structures

```typescript
interface BacktestConfig {
  strategy: {
    type: 'pine' | 'builtin'
    code?: string           // PineScript source if type='pine'
    id?: string             // built-in strategy id: 'ema20-pullback', 'breakout-retest', etc.
    params?: Record<string, number>
  }
  instrument: string        // 'TICKER1' ... 'TICKER4'
  timeframe: string         // '5m' | '15m' | '1h' | '4h'
  dataSource: 'mock' | 'replay' | 'generated'
  patternIds?: string[]     // if dataSource='mock', which patterns to run on
  startCandle?: number      // offset into data array
  endCandle?: number
  initialCapital: number
  riskPerTrade: number      // fraction of capital (0.01 = 1%)
  commission: number        // per-trade flat fee
  slippage: number          // as fraction of price (0.001 = 0.1%)
  filters?: {
    requireTrend?: boolean  // require EMA20 > EMA50 on higher TF
    avoidChop?: boolean     // skip when ATR < threshold
    maxSpread?: number
  }
  multiTimeframe?: {
    biasTf: string          // e.g. '4h' for trend direction
    entryTf: string         // e.g. '15m' for trigger
  }
}

interface TradeRecord {
  id: string
  entryTime: number         // unix seconds
  exitTime: number
  side: 'buy' | 'sell'
  entryPrice: number
  exitPrice: number
  quantity: number
  stopLoss: number
  takeProfit: number
  exitReason: 'tp' | 'sl' | 'signal' | 'manual'
  rMultiple: number
  pnl: number
  pnlPercent: number
  fees: number
  tags: string[]            // strategy ids, pattern ids, etc.
  emotions?: string         // journal entry
  mistake?: string          // mistake tag
}

interface BacktestResult {
  config: BacktestConfig
  trades: TradeRecord[]
  summary: {
    totalTrades: number
    winRate: number            // fraction 0-1
    avgR: number               // average R-multiple
    totalPnl: number
    totalPnlPercent: number
    maxDrawdown: number        // as fraction 0-1
    maxDrawdownPct: number
    profitFactor: number       // gross profit / gross loss
    expectancy: number         // avg PnL per trade
    sharpeRatio: number        // daily returns sharpe
    avgBarsHeld: number
    winLossRatio: number
    consecutiveWins: number
    consecutiveLosses: number
  }
  equityCurve: Array<{ time: number; equity: number }>
  monthlyBreakdown: Record<string, { trades: number; pnl: number; winRate: number }>
}

interface WalkForwardConfig extends BacktestConfig {
  inSampleSize: number       // candles for optimization
  outSampleSize: number      // candles for validation
  stepSize: number           // rolling window step
  paramRanges: Record<string, [number, number, number]>  // param: [min, max, step]
}

interface WalkForwardResult {
  segments: Array<{
    inSample: BacktestResult
    outSample: BacktestResult
    params: Record<string, number>
  }>
  overall: BacktestResult
}

interface PortfolioResult {
  configs: BacktestConfig[]
  combinedTrades: TradeRecord[]
  correlation: Array<{ strategyA: string; strategyB: string; correlation: number }>
  summary: BacktestResult['summary']
}
```

### Execution Flow

```
1. User selects strategy tile → "Backtest" button
2. BacktestEngine picks matching mock patterns (from trainingEngine)
3. For each pattern:
   a. Generate candle data via generatePatternData()
   b. StrategyRunner walks candles bar-by-bar
   c. On signal → create order with SL/TP at config levels
   d. On each new candle → check if SL/TP hit → record trade
   e. After all candles → compute metrics
4. Aggregate results across patterns → display summary
5. Render equity curve + trade list + monthly breakdown
```

### Example JSON

```json
{
  "config": {
    "strategy": { "type": "builtin", "id": "ema20-pullback" },
    "instrument": "TICKER1",
    "timeframe": "15m",
    "dataSource": "mock",
    "patternIds": ["EPB-01", "EPB-02"],
    "initialCapital": 1000000,
    "riskPerTrade": 0.01,
    "commission": 20,
    "slippage": 0.001
  },
  "trades": [
    {
      "id": "bt-001",
      "entryTime": 1768435200,
      "exitTime": 1768438800,
      "side": "buy",
      "entryPrice": 19542.30,
      "exitPrice": 19615.75,
      "quantity": 5,
      "stopLoss": 19489.50,
      "takeProfit": 19648.20,
      "exitReason": "tp",
      "rMultiple": 2.12,
      "pnl": 367.25,
      "pnlPercent": 0.38,
      "fees": 20,
      "tags": ["ema20-pullback", "EPB-01"]
    }
  ],
  "summary": {
    "totalTrades": 24,
    "winRate": 0.625,
    "avgR": 1.84,
    "totalPnl": 14982.50,
    "totalPnlPercent": 1.50,
    "maxDrawdown": 0.024,
    "profitFactor": 2.31,
    "expectancy": 624.27,
    "sharpeRatio": 1.42
  },
  "equityCurve": [
    { "time": 1768435200, "equity": 1000000 },
    { "time": 1768438800, "equity": 1000347.25 }
  ]
}
```

---

## 2) PATTERN_RECOGNITION_ENGINE

### Architecture

```
┌────────────────────────────────────────────────────┐
│              PatternDetector                        │
├────────────────────────────────────────────────────┤
│  analyze(candles: Candle[], config: DetectionConfig)│
│    → DetectedPattern[]                              │
│  watch(candle: Candle): PartialMatch[]              │
│    → real-time detection on streaming ticks         │
└────────────────────────────────────────────────────┘
```

### Data Structures

```typescript
interface DetectionConfig {
  flagMinPoleCandles: number      // default 5
  flagMaxSlopeDeg: number         // default 30
  pennantMinTouches: number       // default 4
  doubleTopTolerance: number      // fraction, e.g. 0.005 (0.5%)
  doubleBottomTolerance: number
  volatilityCompressionPeriod: number  // default 20
  volCompressionThreshold: number      // default 0.5 (50% of avg width)
  liquidityShockMultiplier: number     // default 3.0
}

type PatternType = 'flag' | 'pennant' | 'double-top' | 'double-bottom' | 'wyckoff-accumulation' | 'wyckoff-manipulation' | 'wyckoff-distribution' | 'wyckoff-consolidation' | 'vol-compression' | 'liquidity-shock'

type PatternConfidence = 'low' | 'medium' | 'high'

interface DetectedPattern {
  id: string
  type: PatternType
  startIndex: number         // candle index
  endIndex: number           // candle index (current if forming)
  confidence: number         // 0-1
  direction: 'bullish' | 'bearish' | 'neutral'
  description: string
  measurements?: {
    poleHeight?: number      // for flag/pennant
    channelWidth?: number    // for flag
    apexIndex?: number       // for pennant
    necklinePrice?: number   // for M/W
    peakPrices?: number[]    // for double top
    troughPrices?: number[]  // for double bottom
  }
  alertMessage?: string
  overlayData?: {
    trendlines?: Array<{ x1: number; y1: number; x2: number; y2: number }>
    levels?: Array<{ time: number; price: number; label: string }>
  }
}
```

### Detection Algorithms

**Flag Detection:**
```
1. Find pole: consecutive candles (≥ 5) all in same direction, each range > avg range × 0.8
2. After pole, look for consolidation: candles moving opposite to pole, within ±0.15% channel
3. Channel slope must be 15-30° opposite to pole direction  
4. Volume must drop to < 60% of pole average during consolidation
5. Confidence = min(pole strength, consolidation tightness, volume drop)
```

**Pennant Detection:**
```
1. Find pole: same as flag
2. After pole, identify converging trendlines (lower highs + higher lows)
3. At least 4 touches total on both trendlines
4. Range at apex < 40% of range at start of pennant
5. Confidence = touches / 6 + (1 - apexRange/startRange)
```

**Double Top Detection:**
```
1. Find local maxima separated by at least 5 candles
2. Two peaks within priceTolerance% of each other
3. Volume on second peak < 80% of first peak volume
4. RSI on second peak < RSI on first peak (divergence)
5. After neckline break (below middle trough) → confirmed
6. Confidence = volDrop × rsiDivergence × proximity score
```

**Double Bottom Detection:**
```
1. Find local minima separated by at least 5 candles
2. Two troughs within priceTolerance%
3. Volume on second trough > 120% of first trough
4. RSI on second trough > RSI on first trough (bull divergence)
5. After neckline break (above middle peak) → confirmed
```

**Wyckoff Phase Detection:**
```
Already handled by marketEngine state machine.
Detection reads phaseRef to label current phase on chart.
```

**Volatility Compression:**
```
1. Compute SMA20 band width = 2 × ATR(20)
2. Track bandwidth history; find minima
3. When bandwidth < threshold × avgBandwidth(20) → alert
4. Confidence = 1 - (bandwidth / avgBandwidth)
```

**Liquidity Shock:**
```
1. Candle range > 3× ATR(20)
2. Or candle range > 2× previous candle range
3. Or volume > 3× avgVolume(20)
4. Confidence = min(1, range / (3 × ATR(20)))
```

### Overlay Rendering Instructions

| Pattern | Render |
|---------|--------|
| Flag | Draw channel lines (2 parallel lines along consolidation), label "FLAG" at breakout |
| Pennant | Draw converging trendlines, mark apex with "×", label "PENNANT" |
| Double Top | Draw horizontal line at peak level, draw neckline at trough, label "M" at midpoint |
| Double Bottom | Draw horizontal line at trough level, draw neckline at peak, label "W" at midpoint |
| Wyckoff phase | Color-coded badge (ACC=yellow, MANIP=green, FVG=purple, DIST=orange, CONS=blue) |
| Vol Compression | Draw horizontal bracket showing bandwidth at minimum, label "SQUEEZE" |
| Liquidity Shock | Highlight the shock candle with a red/green box outline, label "SHOCK" |

### Alerts

```typescript
interface PatternAlert {
  type: PatternType
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: number
  candleTime: number
  confidence: number
}
```

Example alerts:
- "Flag forming on TICKER3 — channel consolidation detected"
- "Pennant apex approaching on TICKER2 — prepare for breakout"
- "M-pattern neckline break on TICKER1 — bearish reversal confirmed"
- "Volatility squeeze on TICKER4 — expansion imminent"
- "Liquidity shock candle on TICKER1 — 3.2× average range"

---

## 3) RISK_MANAGEMENT_SYSTEM

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  RISK DASHBOARD                                         │
├────────────────────┬────────────────────────────────────┤
│  Daily Limits       │  Position Sizing                   │
│  ┌──────────────┐   │  ┌────────────────────────────┐   │
│  │ Daily Loss    │   │  │ Account: ₹10,00,000        │   │
│  │ Limit: 3%     │   │  │ Risk %:  1.00%             │   │
│  │ Today: -1.2%  │   │  │ Risk ₹:  ₹10,000           │   │
│  │ Remaining: 1.8%│  │  │ Stop:    100 pts            │   │
│  │ Status: ✅ OK  │   │  │ Qty:     10                │   │
│  └──────────────┘   │  └────────────────────────────┘   │
│                     │                                    │
│  Max Drawdown       │  Exposure Heatmap                  │
│  ┌──────────────┐   │  ┌────────────────────────────┐   │
│  │ Current: 4.2% │   │  │ TICKER1 ████████░░ 80%     │   │
│  │ Limit: 15%    │   │  │ TICKER3 ██░░░░░░░░ 20%     │   │
│  │ Status: ✅ OK  │   │  │ Total:    100%             │   │
│  └──────────────┘   │  └────────────────────────────┘   │
├────────────────────┴────────────────────────────────────┤
│  Risk Score Per Strategy                                 │
│  ┌─────────┬──────────┬────────┬────────┬───────────┐  │
│  │Strategy │ Win Rate │ Avg R  │ DD     │ Risk Score│  │
│  ├─────────┼──────────┼────────┼────────┼───────────┤  │
│  │EMA Pull │ 62%      │ 1.84   │ 2.4%   │  B+       │  │
│  │Flag Brk │ 55%      │ 2.10   │ 3.1%   │  B        │  │
│  │M Pattern│ 48%      │ 2.40   │ 4.8%   │  B-       │  │
│  └─────────┴──────────┴────────┴────────┴───────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Data Models

```typescript
interface RiskConfig {
  dailyLossLimit: number         // fraction 0-1, default 0.03
  maxDrawdownLimit: number       // fraction 0-1, default 0.15
  defaultRiskPerTrade: number    // fraction 0-1, default 0.01
  maxPositionSize: number        // fraction of capital, default 0.25
  maxConsecutiveLosses: number   // default 3 (after which risk is halved)
  minRR: number                  // minimum risk-reward ratio, default 1.5
}

interface DailyRiskState {
  date: string                   // YYYY-MM-DD
  startingEquity: number
  currentEquity: number
  pnl: number
  pnlPercent: number
  trades: number
  losses: number
  wins: number
  breached: boolean              // true if daily limit hit
}

interface DrawdownState {
  peakEquity: number
  currentDrawdown: number        // fraction 0-1
  maxDrawdown: number
  maxDrawdownDate: string
}

interface PositionSizeResult {
  riskCapital: number            // amount at risk (capital × risk%)
  stopDistance: number           // in price units
  quantity: number
  marginRequired: number
  riskScore: number              // 0-100 lower = safer
}

interface StrategyRiskScore {
  strategyId: string
  winRate: number
  avgR: number
  maxDrawdown: number
  profitFactor: number
  tradesCount: number
  score: string                  // A+ to F
  scoreNumeric: number           // 0-100
}
```

### Calculation Formulas

```
Risk Capital = Account Equity × RiskPerTrade
Quantity = RiskCapital / (EntryPrice × StopDistance_%)
   where StopDistance_% = |EntryPrice - StopPrice| / EntryPrice

R-Multiple = |ExitPrice - EntryPrice| / |StopPrice - EntryPrice|

Profit Factor = Gross Profit / Gross Loss

Expectancy = (WinRate × AvgWin) - (LossRate × AvgLoss)

Sharpe Ratio = (Mean(Returns) - RiskFreeRate) / StdDev(Returns)
   where Returns are daily portfolio returns

Max Drawdown = max(1 - Equity_t / PeakEquity) across all t

Risk Score = 50 × (1 - WinRate) + 20 × (1 - min(AvgR / 3, 1)) + 30 × DrawdownScore
   where DrawdownScore = min(MaxDD / 0.15, 1)

Strategy Risk Letter Grade:
  A+ : score ≥ 90
  A  : score ≥ 80
  B+ : score ≥ 70
  B  : score ≥ 60
  B- : score ≥ 50
  C+ : score ≥ 40
  C  : score ≥ 30
  D  : score ≥ 20
  F  : score < 20

Consecutive Loss Scaling:
  after 3 consecutive losses → riskPerTrade = riskPerTrade × 0.5
  after 5 consecutive losses → riskPerTrade = riskPerTrade × 0.25
  after a win → riskPerTrade = defaultRiskPerTrade
```

---

## 4) TRADE_JOURNAL_SYSTEM

### Storage Format (localStorage IndexedDB)

```typescript
interface JournalEntry {
  id: string                   // uuid
  tradeId: string              // links to TradeRecord.tradeId
  symbol: string
  side: 'buy' | 'sell'
  entryTime: number
  exitTime: number
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  rMultiple: number

  // Journal fields
  notes: string
  strategyTags: string[]       // ['ema20-pullback', 'flag-breakout']
  emotionTags: string[]        // ['confident', 'anxious', 'impatient', 'neutral', 'regret']
  mistakeTags: string[]        // ['fomo', 'no-sl', 'oversized', 'early-exit', 'revenge', 'chase', 'ignored-filter']
  patternType: string | null   // detected pattern at entry
  screenshotDataUrl: string | null  // auto-captured chart screenshot (base64)
  setupRating: 1 | 2 | 3 | 4 | 5
  executionRating: 1 | 2 | 3 | 4 | 5
  lessonLearned: string
}

interface MonthlyReport {
  year: number
  month: number
  summary: {
    totalTrades: number
    winRate: number
    avgR: number
    totalPnl: number
    maxDrawdown: number
    profitFactor: number
    expectancy: number
  }
  byStrategy: Record<string, {
    trades: number
    winRate: number
    avgR: number
    pnl: number
  }>
  byEmotion: Record<string, number>    // emotion → count
  byMistake: Record<string, number>    // mistake → count
  topLessons: Array<{ lesson: string; count: number }>
  equityCurve: Array<{ date: string; equity: number }>
}
```

### UI Layout

```
┌──────────────────────────────────────────────────────────┐
│  TRADE JOURNAL                             [Month ▼]     │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────┬──────┬──────┬──────┬──────────┐ │
│  │ Date         │ Sym  │ Side │ R    │ PnL  │ Tags     │ │
│  ├──────────────┼──────┼──────┼──────┼──────┼──────────┤ │
│  │ 2026-07-15   │ T1   │ BUY  │ 2.1  │+367  │ EMA,TP   │ │
│  │ 2026-07-15   │ T3   │ SELL │ -1.0 │-150  │ FOMO,SL  │ │
│  │ 2026-07-14   │ T2   │ BUY  │ 1.5  │+225  │ FLAG     │ │
│  └──────────────┴──────┴──────┴──────┴──────┴──────────┘ │
│                                                           │
│  ┌───────────── CLICK EXPAND ──────────────────────────┐  │
│  │ Trade #001 — 2026-07-15 10:32                       │  │
│  │ TICKER1 BUY x 5 @ 19542.30 → 19615.75 (+₹367)      │  │
│  │                                                      │  │
│  │ Notes: Perfect EMA20 touch, RSI at 42, volume       │  │
│  │ confirmed. Waited for confirmation candle.           │  │
│  │                                                      │  │
│  │ Strategy:  [EMA20 Pullback] [Breakout+Retest]       │  │
│  │ Emotions:  [Confident] [Focused]                    │  │
│  │ Mistakes:  (none)                                    │  │
│  │                                                      │  │
│  │ Setup: ★★★★☆  Execution: ★★★★★                     │  │
│  │ Lesson: "Patience paid off, entry was textbook"     │  │
│  │                                                      │  │
│  │ [📷 Screenshot] [Edit] [Delete]                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────── REPORT ───────────────────────────────┐  │
│  │ July 2026 Summary                                   │  │
│  │ 48 trades | 62% WR | Avg R: 1.84 | PnL: +₹14,982   │  │
│  │                                                      │  │
│  │ Best Strategy: EMA20 Pullback (18t, 72%, R:2.1)    │  │
│  │ Most Common Mistake: Early Exit (8 times)           │  │
│  │ Most Common Emotion: Confident (22 trades)          │  │
│  │                                                      │  │
│  │ [Download Report (JSON)] [Download Report (CSV)]    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Example Journal Entries

```json
[
  {
    "id": "jrn-001",
    "tradeId": "bt-001",
    "symbol": "TICKER1",
    "side": "buy",
    "entryTime": 1768435200,
    "exitTime": 1768438800,
    "entryPrice": 19542.30,
    "exitPrice": 19615.75,
    "quantity": 5,
    "pnl": 367.25,
    "rMultiple": 2.12,
    "notes": "Textbook EMA20 pullback. Price touched EMA20 exactly, RSI at 42, volume confirming. Waited one confirmation candle before entry.",
    "strategyTags": ["ema20-pullback"],
    "emotionTags": ["confident", "focused"],
    "mistakeTags": [],
    "patternType": null,
    "screenshotDataUrl": "data:image/png;base64,...",
    "setupRating": 4,
    "executionRating": 5,
    "lessonLearned": "Patience paid off. The confirmation candle filter saved me from entering during a deeper retrace."
  },
  {
    "id": "jrn-002",
    "tradeId": "bt-002",
    "symbol": "TICKER2",
    "side": "sell",
    "entryTime": 1768442400,
    "exitTime": 1768446000,
    "entryPrice": 44150.00,
    "exitPrice": 44420.50,
    "quantity": 3,
    "pnl": -811.50,
    "rMultiple": -1.50,
    "notes": "Entered before confirmation candle. Got faked out by a pennant that broke upward briefly. SL was too tight.",
    "strategyTags": ["pennant-breakout"],
    "emotionTags": ["impatient", "regret"],
    "mistakeTags": ["fomo", "no-confirmation", "tight-sl"],
    "patternType": "pennant",
    "screenshotDataUrl": null,
    "setupRating": 3,
    "executionRating": 2,
    "lessonLearned": "Never enter without confirmation candle. A tight SL on pennants gets picked off by noise."
  }
]
```

---

## 5) OPTIONS_STRATEGY_BUILDER

### Data Structures

```typescript
interface OptionLeg {
  type: 'call' | 'put'
  action: 'buy' | 'sell'
  strike: number
  expiry: string          // YYYY-MM-DD
  premium: number
  quantity: number        // lot size multiplier
  iv?: number
  delta?: number
  theta?: number
  gamma?: number
  vega?: number
}

interface OptionsStrategy {
  id: string
  name: string                  // 'Bull Call Spread', 'Iron Condor', etc.
  legs: OptionLeg[]
  netPremium: number            // positive = credit, negative = debit
  maxProfit: number
  maxLoss: number
  breakEvens: number[]          // price(s) where PnL = 0
  probabilityOfProfit: number   // 0-1
}

interface PayoffPoint {
  underlyingPrice: number
  pnl: number
  pnlPercent: number
}

interface PayoffDiagram {
  atExpiry: PayoffPoint[]
  tMinus1: PayoffPoint[]        // 1 day before expiry (theta decay)
  tMinus7: PayoffPoint[]        // 1 week before expiry
  current: PayoffPoint[]        // current date
  breakevens: number[]
}

interface IVCurve {
  strikes: number[]
  callIV: number[]
  putIV: number[]
  atmIV: number
  skew: number                  // (putIV_OTM - callIV_OTM) / ATM_IV
}
```

### Payoff Math

```
For each leg at expiry:
  Call Long:  max(0, Underlying - Strike) - Premium
  Call Short: Premium - max(0, Underlying - Strike)
  Put Long:   max(0, Strike - Underlying) - Premium
  Put Short:  Premium - max(0, Strike - Underlying)

Strategy PnL = Sum of all leg PnLs at each underlying price

Max Profit (debit spread): (StrikeWidth - NetDebit) × Quantity
Max Loss (debit spread): NetDebit × Quantity
Max Profit (credit spread): NetCredit × Quantity
Max Loss (credit spread): (StrikeWidth - NetCredit) × Quantity

Breakeven:
  Bull Call Spread: LowerStrike + NetDebit
  Bear Put Spread:  HigherStrike - NetDebit
  Short Straddle:   Strike ± NetCredit
  Long Straddle:    Strike ± NetDebit

Probability of Profit (simplified BSM):
  d1 = (ln(S/K) + (r + σ²/2)t) / (σ√t)
  d2 = d1 - σ√t
  For Call: POP = N(d2) for profit at expiry
  Where used as approximation, actual POP from Monte Carlo
```

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  OPTIONS STRATEGY BUILDER            [TICKER1] [Jul 24] │
├─────────────────────────────────────────────────────────┤
│  ┌─── LEG 1 ──────────────────────────────────────────┐ │
│  │ [Call ▼] [Buy ▼] Strike: [48500] Premium: [245.5] │ │
│  │ Qty: [1]                                           │ │
│  └────────────────────────────────────────────────────┘ │
│  [+ Add Leg]                                            │
│                                                          │
│  ┌─── STRATEGY SUMMARY ──────────────────────────────┐  │
│  │ Bull Call Spread                                   │  │
│  │ Net Debit: ₹12,350 | Max Profit: ₹17,650          │  │
│  │ Max Loss:  ₹12,350 | Breakeven: 48,647.50         │  │
│  │ POP: 58.3% | Max Risk: 1.23% of capital           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── PAYOFF DIAGRAM ────────────────────────────────┐  │
│  │   ▲ PnL                                            │  │
│  │ 17K│     ┌─── At Expiry                            │  │
│  │    │    ╱ ╲    ─── T-1                              │  │
│  │  0 │───╱───╲─────── T-7                             │  │
│  │    │  ╱     ╲                                       │  │
│  │-12K│─╱───────╲──                                    │  │
│  │    │          └──────► Underlying                    │  │
│  │    │         48,647                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── IV CURVE ──────────────────────────────────────┐  │
│  │ 30% ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░          │  │
│  │ 25% █████████████░░░░░░░░░██████████████           │  │
│  │ 20% ██████████████████████████████████████          │  │
│  │     PUTS ─── ATM ─── CALLS                          │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Offline Options Backtesting

```typescript
interface OptionsBacktestConfig {
  strategy: OptionsStrategy
  underlyingData: Array<{ time: number; price: number }>
  dateRange: { start: string; end: string }
  rebalanceFrequency: 'daily' | 'weekly' | 'monthly'
  commission: number
}

interface OptionsBacktestResult {
  trades: Array<{
    openDate: string
    closeDate: string
    underlyingOpen: number
    underlyingClose: number
    strategyPnl: number
    underlyingPnl: number
    ivChange: number
  }>
  summary: {
    totalTrades: number
    winRate: number
    avgPnl: number
    maxDrawdown: number
    sharpeRatio: number
    vsUnderlyingCorrelation: number
  }
}
```

---

## 6) COACHING_AI

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CoachingEngine                        │
├──────────────────────────────────────────────────────────┤
│  evaluate(action: TraderAction, state: TraderState)      │
│    → CoachingFeedback[]                                   │
│  onTick(candle: Candle, patterns: DetectedPattern[])     │
│    → PatternAlert[]                                      │
│  scoreDiscipline(journal: JournalEntry[]): number         │
└──────────────────────────────────────────────────────────┘
```

### Rule Engine

```typescript
interface CoachingRule {
  id: string
  name: string
  category: 'entry' | 'exit' | 'risk' | 'discipline' | 'pattern'
  condition: (action: TraderAction, state: TraderState) => boolean
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
}

interface TraderAction {
  type: 'entry' | 'exit' | 'sl-placed' | 'tp-placed' | 'sl-moved' | 'tp-moved' | 'cancelled'
  time: number
  symbol: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  stopLoss?: number
  takeProfit?: number
}

interface TraderState {
  currentPosition: { symbol: string; side: string; quantity: number; entryPrice: number } | null
  dailyTrades: number
  dailyPnl: number
  consecutiveLosses: number
  equity: number
  peakEquity: number
  riskConfig: RiskConfig
  openOrders: number
}

interface CoachingFeedback {
  ruleId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
  timestamp: number
}
```

### Coaching Triggers (Predefined Rules)

| # | Rule | Condition | Message | Severity |
|---|------|-----------|---------|----------|
| 1 | No-SL Entry | order placed without SL | "Entry without Stop Loss! Set SL to limit risk." | critical |
| 2 | Oversized Position | qty > max allowed by risk model | "Position too large! Max safe size is {n} based on {rr}% risk." | critical |
| 3 | FOMO Entry | 3+ trades in 5 min | "Slow down! {n} trades in 5min suggests FOMO. Take a break." | warning |
| 4 | Revenge Trade | entry immediately after losing trade | "Revenge trading detected. Step away for 15 minutes." | critical |
| 5 | No Confirmation | entry without waiting for confirmation candle | "No confirmation candle! Strategy requires 1 candle close after signal." | warning |
| 6 | Pattern Forming | pattern detected | "Flag forming on {symbol}! Watch for breakout." | info |
| 7 | Daily Loss Breach | daily loss > limit × 0.8 | "Daily loss at {pnl}% — approaching {limit}% limit!" | warning |
| 8 | Daily Loss Hit | daily loss > limit | "Daily loss limit hit! No more trades today." | critical |
| 9 | Early Exit | exited before SL/TP with profit < 0.5R | "Early exit on winning trade! Left {rValue}R on the table." | warning |
| 10 | Consecutive Losses | 3+ consecutive losses | "{n} consecutive losses. Risk halved to {newRisk}%." | warning |
| 11 | Tight Stop | SL distance < 0.5 × ATR | "Stop too tight at {pts}pt. ATR is {atr}pt. Widen stop." | info |
| 12 | Trend Against | entry opposite to higher TF trend | "Trading against {tf} trend ({trend}). Consider waiting for alignment." | warning |
| 13 | Chop Zone | ATR < threshold, no clear trend | "Current market is choppy. Strategy win rate drops in chop." | info |
| 14 | Adding To Loser | increasing position on losing trade | "Averaging down! This is dangerous without a plan." | critical |
| 15 | Missed Stop | price crossed SL but trade not closed | "Price crossed SL level at {price} but trade still open!" | critical |

### Discipline Score

```typescript
function scoreDiscipline(entries: JournalEntry[]): number {
  let score = 100

  // Penalize mistakes
  const mistakePenalties: Record<string, number> = {
    'fomo': 10,
    'no-sl': 15,
    'oversized': 15,
    'early-exit': 8,
    'revenge': 20,
    'chase': 10,
    'ignored-filter': 12,
    'no-confirmation': 8,
    'tight-sl': 5,
  }

  for (const entry of entries) {
    for (const mistake of entry.mistakeTags) {
      score -= mistakePenalties[mistake] || 5
    }
  }

  // Boost for good practices
  const goodPracticePct = entries.filter(e =>
    e.mistakeTags.length === 0 &&
    e.executionRating >= 4
  ).length / Math.max(entries.length, 1)
  score += goodPracticePct * 10

  return Math.max(0, Math.min(100, score))
}
```

### Feedback Messages

```json
[
  {
    "ruleId": "no-sl-entry",
    "severity": "critical",
    "message": "Entry without Stop Loss on TICKER1!",
    "suggestion": "Set SL at 1× ATR below entry (₹19,489.50). Never skip the SL."
  },
  {
    "ruleId": "pattern-forming",
    "severity": "info",
    "message": "Bull flag forming on TICKER2!",
    "suggestion": "Watch for breakout above channel at ₹44,250 with volume confirmation."
  },
  {
    "ruleId": "daily-loss-breach",
    "severity": "warning",
    "message": "Daily loss at -2.5% — approaching 3% limit!",
    "suggestion": "Consider stepping away. Only take high-probability setups."
  }
]
```

---

## 7) MULTI_PORTFOLIO_SYSTEM

### Data Models

```typescript
interface Portfolio {
  id: string
  name: string
  description: string
  initialCapital: number
  currentEquity: number
  currency: string            // 'INR' | 'USD'
  riskConfig: RiskConfig
  strategyIds: string[]       // which strategies this portfolio uses
  instruments: string[]       // restricted to these instruments
  createdAt: number
  updatedAt: number
}

interface Account {
  id: string
  name: string
  type: 'paper' | 'simulation' | 'training'
  portfolios: Portfolio[]
  totalEquity: number
  createdAt: number
}

// Active portfolio selector
interface PortfolioState {
  accounts: Account[]
  activeAccountId: string | null
  activePortfolioId: string | null
}
```

### Switching Logic

```
1. PortfolioSelector component renders a dropdown with:
   ── Account: Training (₹10,00,000) ──
      ├── Portfolio: Main Swing (₹6,00,000)
      ├── Portfolio: Options Desk (₹2,00,000)
      └── Portfolio: Scalping (₹2,00,000)
   ── Account: Simulation (₹50,00,000) ──
      └── Portfolio: Fund Model (₹50,00,000)

2. On switch:
   a. Update PortfolioState.activePortfolioId
   b. Dispatch portfolioChanged action
   c. Clear current orders/positions
   d. Load orders/positions for new portfolio
   e. Update equity display, risk limits, PnL tracking

3. Risk segregation:
   - Each portfolio has its own RiskConfig
   - Daily loss limit is portfolio-scoped
   - Max drawdown is portfolio-scoped
   - Positions table filtered by active portfolio
```

---

## 8) LOCAL_SHARING

### Export / Import Format

All exports are plain JSON files with a `.tejvanta` extension (actually `.json` with a magic header).

```typescript
interface ExportPackage {
  version: '1.0'
  exportedAt: number
  type: 'pine-scripts' | 'strategy-tiles' | 'replay-sessions' | 'journals' | 'backtest-results' | 'portfolio'
  data: any
}
```

### Implementation

```typescript
class LocalSharing {
  // Export
  exportPineScripts(ids: string[]): void {
    const scripts = loadScripts().filter(s => ids.includes(s.id))
    const pkg: ExportPackage = { version: '1.0', exportedAt: Date.now(), type: 'pine-scripts', data: scripts }
    this.downloadAsJson(pkg, `tejvanta-pine-scripts-${Date.now()}.json`)
  }

  exportJournals(ids: string[]): void {
    const journals = JSON.parse(localStorage.getItem('tj_journals') || '[]')
      .filter((j: JournalEntry) => ids.includes(j.id))
    const pkg: ExportPackage = { version: '1.0', exportedAt: Date.now(), type: 'journals', data: journals }
    this.downloadAsJson(pkg, `tejvanta-journal-${Date.now()}.json`)
  }

  exportBacktestResult(result: BacktestResult): void {
    const pkg: ExportPackage = { version: '1.0', exportedAt: Date.now(), type: 'backtest-results', data: result }
    this.downloadAsJson(pkg, `tejvanta-backtest-${result.config.strategy.id}-${Date.now()}.json`)
  }

  // Import
  importFromFile(file: File): Promise<ExportPackage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const pkg = JSON.parse(e.target?.result as string) as ExportPackage
          resolve(pkg)
        } catch { reject(new Error('Invalid Tejvanta export file')) }
      }
      reader.readAsText(file)
    })
  }

  async importToLocal(file: File): Promise<string> {
    const pkg = await this.importFromFile(file)
    switch (pkg.type) {
      case 'pine-scripts': {
        const existing = loadScripts()
        const merged = [...existing, ...pkg.data.filter((s: any) => !existing.find((e: any) => e.id === s.id))]
        saveScripts(merged)
        return `Imported ${pkg.data.length} Pine Scripts`
      }
      case 'journals': {
        const existing = JSON.parse(localStorage.getItem('tj_journals') || '[]')
        const merged = [...existing, ...pkg.data.filter((j: JournalEntry) => !existing.find((e: any) => e.id === j.id))]
        localStorage.setItem('tj_journals', JSON.stringify(merged))
        return `Imported ${pkg.data.length} journal entries`
      }
      case 'backtest-results': {
        const existing = JSON.parse(localStorage.getItem('tj_backtests') || '[]')
        existing.push(pkg.data)
        localStorage.setItem('tj_backtests', JSON.stringify(existing))
        return `Imported backtest result for ${pkg.data.config.strategy.id}`
      }
      default: return `Imported ${pkg.type} (${Array.isArray(pkg.data) ? pkg.data.length : 1} items)`
    }
  }

  private downloadAsJson(pkg: ExportPackage, filename: string) {
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
}
```

### UI Buttons

| Location | Export Button | Import Button |
|----------|---------------|---------------|
| Pine Script Editor | Download Scripts | Upload Scripts |
| Trade Journal | Export Journal | Import Journal |
| Backtest Results | Export Result | — |
| Learning Page | — | Import Strategy Tile |
| Settings | Export All Data | Import All Data |

---

## 9) MOBILE_UI

### Layouts

All mobile views use the same Tailwind framework with responsive breakpoints (`sm:` prefix).

#### Charts (Mobile)

```
┌──────────────────┐
│ 📈 TICKER1  [▼TF]│  ← slim header, timeframe dropdown
├──────────────────┤
│                  │
│   CANDLE CHART   │  ← full-width, 100% viewport height minus header
│   (touch swipe   │
│    to pan, pinch │
│    to zoom)      │
│                  │
├──────────────────┤
│ [Buy] [Sell]     │  ← floating action buttons
└──────────────────┘

Touch controls:
- Single tap: show crosshair + tooltip
- Long press: open context menu (Reset, Screenshot, Clear)
- Swipe left/right: pan time scale
- Pinch in/out: zoom
```

#### Trading (Mobile)

```
┌──────────────────┐
│ New Order  [×]   │  ← modal or bottom sheet
├──────────────────┤
│ Symbol: TICKER1  │
│ Side: [Buy][Sell]│
│ Qty:  [-]  5 [+] │
│ Price: 19542.30  │
│ SL:    [_____]   │
│ TP:    [_____]   │
│                  │
│ [Place Order]    │  ← full-width button
└──────────────────┘

Positions tab: card-based layout (no table)
┌──────────────────┐
│ ◉ TICKER1        │
│ BUY 5 @ 19542    │
│ PnL: +₹367 (△)   │
│ [Close] [SL/TP]  │
├──────────────────┤
│ ◉ TICKER3        │
│ SELL 3 @ 1304    │
│ PnL: -₹150 (▽)   │
│ [Close] [SL/TP]  │
└──────────────────┘
```

#### Replay (Mobile)

```
┌──────────────────┐
│ ⏪ REPLAY        │
├──────────────────┤
│                  │
│   REPLAY CHART   │  ← same as chart view
│                  │
├──────────────────┤
│ ◄ ⏸ ►  [2x]     │  ← bottom controller bar
│ [████████░░] 45% │
└──────────────────┘
```

#### Learning Tiles (Mobile)

```
┌──────────────────┐
│ 📘 CURRICULUM    │
├──────────────────┤
│ [Beginner ▼]     │  ← level dropdown filter
├──────────────────┤
│ ┌────────────────┐│
│ │ EMA20 Pullback ││
│ │ Beginner       ││
│ │ 5m / 15m       ││
│ │ 5 sessions     ││
│ └────────────────┘│
│ ┌────────────────┐│
│ │ RSI Mean-Rev   ││
│ │ Beginner       ││
│ │ 5m / 15m       ││
│ │ 5 sessions     ││
│ └────────────────┘│
│ ...               │
└──────────────────┘

Tile tap → bottom sheet detail:
┌──────────────────┐
│ EMA20 Pullback   │
├──────────────────┤
│ Tab: [Rules][Pats]│
│                   │
│ Rules: Entry when │
│ price touches     │
│ EMA20 in uptrend  │
│ ...               │
│                   │
│ [Open Replay]     │
└──────────────────┘
```

#### Journal (Mobile)

```
┌──────────────────┐
│ 📓 JOURNAL  [+ ] │
├──────────────────┤
│ ┌────────────────┐│
│ │ Jul 15  TICKER1││
│ │ BUY  R:2.1     ││
│ │ ✅ EMA, TP     ││
│ └────────────────┘│
│ ┌────────────────┐│
│ │ Jul 15  TICKER3││
│ │ SELL R:-1.0    ││
│ │ ❌ FOMO, SL    ││
│ └────────────────┘│
│ ...               │
├──────────────────┤
│ Monthly: +₹14,982 │
│ WR: 62% | 48 trds │
└──────────────────┘

New entry: bottom sheet form
┌──────────────────┐
│ New Journal Entry│
├──────────────────┤
│ Notes: [________]│
│ Emotions: [▼]    │
│ Mistakes: [▼]    │
│ Rating: ★★★★☆   │
│ [Add Screenshot] │
│                  │
│ [Save]           │
└──────────────────┘
```

### Responsive Breakpoints

```css
/* Mobile (< 640px) */
.sm\:hidden                /* hide desktop elements */
.sm\:flex                  /* show mobile layout */
.sm\:bottom-sheet          /* bottom sheet modal */
.sm\:full-width-chart      /* chart takes full width */
.sm\:card-list             /* replace tables with cards */

/* Tablet (640-1024px) */
.md\:sidebar-collapsed     /* auto-collapse sidebar */
.md\:two-column           /* 2-col tile grid */

/* Desktop (> 1024px) */
.lg\:sidebar-visible       /* expanded sidebar */
.lg\:three-column          /* 3-col tile grid */
```

---

## Implementation Priority

| Module | Priority | Effort | Dependencies |
|--------|----------|--------|--------------|
| Pattern Recognition Engine | P0 | 3 days | marketEngine, TradingViewChart |
| Risk Management System | P0 | 2 days | tradingSlice, PaperTrading |
| Trade Journal System | P1 | 2 days | localStorage |
| Coaching AI | P1 | 3 days | Pattern Recognition, Risk |
| Backtesting Engine | P1 | 5 days | trainingEngine, PineScriptEngine |
| Options Strategy Builder | P2 | 4 days | optionsSlice |
| Multi-Portfolio System | P2 | 2 days | tradingSlice |
| Local Sharing | P2 | 1 day | — |
| Mobile UI | P3 | 5 days | all components |
