# Tejvanta Trading Curriculum

---

## 1) CURRICULUM_LEVELS

---

### LEVEL 1 — BEGINNER (Foundation Trader)

**Goal:** Chart literacy, basic indicators, simple execution discipline.

#### Core Concepts
| Concept | Detail |
|---------|--------|
| Candlestick anatomy | Open, high, low, close; body vs wick/shadow; bullish vs bearish |
| Timeframes | 1m → 1D; higher TF = broader trend, lower TF = finer entry |
| Market structure | Trend (higher highs/higher lows), range (horizontal chop), downtrend (lower highs/lower lows) |
| Support & Resistance | Horizontal levels; role-swap (S becomes R and vice versa) |
| Volume | Basic interpretation: volume confirms breakouts, diverges at tops/bottoms |

#### Indicators
| Indicator | Period | Purpose |
|-----------|--------|---------|
| SMA20 | 20 | Short-term trend direction |
| EMA20 | 20 | Smoother short-term trend, pullback reference |
| RSI14 | 14 | Overbought (>70) / oversold (<30) zones |

#### Beginner Strategies

**S1. EMA20 Pullback (TICKER1, TICKER3)**
- **Setup:** Price above EMA20, trending with HH/HL. Price pulls back to EMA20 or slightly below.
- **Entry:** Bullish candle close after touching EMA20.
- **Stop Loss:** 1× ATR below entry or below recent swing low.
- **Take Profit:** 2× risk or previous resistance level.
- **Timeframes:** 5m / 15m.
- **Rules:** No entry if RSI > 70 (overbought). No entry during chop (SMA50 flat).

**S2. RSI Mean-Reversion (TICKER2, TICKER4)**
- **Setup:** RSI14 enters oversold (<30) or overbought (>70) zone. Wait for a confirmation candle in opposite direction.
- **Entry:** At close of confirmation candle (bullish in oversold, bearish in overbought).
- **Stop Loss:** Beyond the recent swing point (low for oversold entry, high for overbought).
- **Take Profit:** Nearest S/R level or 1.5× risk.
- **Timeframes:** 5m / 15m.
- **Rules:** Skip if the trend is strongly against you (e.g., oversold in a powerful downtrend).

**S3. Simple Breakout (TICKER1—TICKER4)**
- **Setup:** Price compresses in a tight range (10–15 candles). Price breaks above resistance or below support with above-average volume.
- **Entry:** 1 candle after breakout closes outside range.
- **Stop Loss:** Inside the range (midpoint or opposite side).
- **Take Profit:** 2× range height projected.
- **Timeframes:** 5m / 15m / 1h.
- **Rules:** No entry on first candle touch; wait for confirmation candle close.

#### Beginner Patterns
| Pattern | Identification | Bias |
|---------|---------------|------|
| W Pattern (Double Bottom) | Two troughs at ≈ same level; neckline break above middle peak | Bullish |
| M Pattern (Double Top) | Two peaks at ≈ same level; neckline break below middle trough | Bearish |

#### Replay Usage
- 10 replay sessions, speed 0.5×–1×.
- Focus on: mark S/R before the session, identify trend vs range, execute entries, respect SL.

#### Evaluation
- Submit 20 paper trades with screenshots showing entry/SL/TP.
- Maintain a journal: entry reason, exit reason, R-multiple, emotion note.
- Pass a 10-question quiz on candle anatomy, timeframe selection, trend identification.

---

### LEVEL 2 — INTERMEDIATE (Pattern & Breakout Trader)

**Goal:** Pattern mastery, breakout logic, multi-timeframe confluence, risk management.

#### Advanced Chart Reading
| Concept | Detail |
|---------|--------|
| Volatility regimes | High vol (wide candles, gaps), low vol (small candles, tight range), expanding/contracting |
| Fake breakouts | Breakout with closing back inside the range within 1–3 candles |
| Liquidity zones | Above highs / below lows where stops cluster; price often sweeps these before reversing |
| Multi-timeframe analysis | Higher TF (4h/1D) = trend direction; lower TF (5m/15m) = trigger |

#### Indicators
| Indicator | Period | Purpose |
|-----------|--------|---------|
| EMA20 + EMA50 cross | 20, 50 | Trend confirmation; golden cross (bullish), death cross (bearish) |
| SMA20 bands | 20 ± k% | Synthetic Bollinger Bands; k defaults to 2%, adjustable |
| Volume spike | — | 2× above 20-period average = breakout confirmation |

#### Intermediate Strategies

**S4. Breakout + Retest (TICKER1—TICKER4)**
- **Setup:** Price breaks a key S/R level, then pulls back to retest it from the other side.
- **Entry:** After retest candle closes, showing rejection of the level (long wick against the breakout direction).
- **Stop Loss:** Beyond the retest low/high by 0.5× ATR.
- **Take Profit:** 2× risk or next S/R level.
- **Timeframes:** 5m / 15m / 1h.
- **Rules:** Entry only if retest is within 5 candles of breakout. Skip if retest fails (closes back past the level).

**S5. Multi-Timeframe Confluence (TICKER1—TICKER4)**
- **Setup:** Higher timeframe (4h) trend confirmed (EMA20 > EMA50, price above both). Lower timeframe (5m/15m) shows a pullback to EMA20 + bullish reversal candle.
- **Entry:** At lower timeframe confirmation.
- **Stop Loss:** Below the pullback swing low (lower TF).
- **Take Profit:** 1.5× ATR of higher TF, or next higher TF S/R.
- **Timeframes:** 4h (bias) + 5m/15m (entry).
- **Rules:** If higher TF is choppy (EMAs entangled), skip.

**S6. Flag Pattern Breakout (TICKER2, TICKER3)**
- **Setup:** Sharp up/down move (pole, 5–10 strong candles). Tight consolidation channel sloping opposite the pole.
- **Entry:** When price breaks the flag channel in the pole direction with high volume.
- **Stop Loss:** Opposite side of the flag.
- **Take Profit:** Pole height projected from breakout point.
- **Timeframes:** 5m / 15m / 1h.
- **Rules:** Flag slope should be 15–30° opposite the pole. Volume drops during flag, spikes on breakout.

**S7. Pennant Pattern Breakout (TICKER2, TICKER4)**
- **Setup:** Sharp move (pole, 4–8 candles). Converging consolidation (lower highs + higher lows).
- **Entry:** Breakout above upper trendline (bullish) or below lower trendline (bearish) with volume.
- **Stop Loss:** Apex of the pennant or 0.5× ATR inside.
- **Take Profit:** Pole height projected.
- **Timeframes:** 5m / 15m.
- **Rules:** Duration of pennant should be 1/3 to 1/2 of pole duration. Shorter pennants = stronger breakouts.

#### Intermediate Patterns
| Pattern | Identification | Bias |
|---------|---------------|------|
| Flag | Pole → parallel channel (sloping opposite pole) | Continuation |
| Pennant | Pole → converging triangle | Continuation |
| Triangle squeeze | 4+ touches on converging trendlines; volatility compressing | Breakout (either direction) |
| Volatility compression | Bollinger bands narrowing to < 50% of 20-period avg width | Expansion imminent |

#### Replay Usage
- 20 replay sessions, speed 1×–4×.
- Focus on: marking levels before session, waiting for setup, position sizing (1–2% risk per trade).

#### Evaluation
- 30 trades with risk-reward ≥ 1:2.
- Correctly identify 8/10 flags/pennants in a test set.
- Pass a quiz on fakeouts, multi-timeframe alignment, volume confirmation.

---

### LEVEL 3 — ADVANCED (Professional Trader)

**Goal:** Combine price action, options, volatility, and scenario-based trading.

#### Market Structure
| Concept | Detail |
|---------|--------|
| Liquidity traps | Price breaks a key level, traps late entries, then reverses sharply |
| Stop-hunts | Sweep above recent high / below recent low to trigger stops, then reverse |
| Volatility expansion | ATR expanding > 20% in one candle; implies strong directional move |
| Regime shifts | Trend → chop or chop → trend; identified by ATR threshold and EMA alignment/disruption |

#### Indicators
| Indicator | How Used |
|-----------|----------|
| EMA20/50 + RSI + Volume | All three aligning = high-probability setup |
| Synthetic vol bands | SMA20 ± (ATR × multiplier); acts as dynamic S/R |

#### Advanced Strategies

**S8. M Pattern Reversal (TICKER1, TICKER3)**
- **Setup:** Two peaks at similar level (within 0.5%) with a trough between. Second peak shows weaker momentum (lower volume, longer upper wick, RSI divergence).
- **Entry:** Break below the neckline (the trough).
- **Stop Loss:** Above second peak.
- **Take Profit:** Neckline-to-peak height projected below neckline.
- **Timeframes:** 1h / 4h (swing-level pattern).
- **Rules:** RSI divergence between peaks is a strong filter (price higher but RSI lower).

**S9. W Pattern Reversal (TICKER1, TICKER4)**
- **Setup:** Two troughs at similar level (within 0.5%). Second trough shows stronger momentum (higher volume, shorter lower wick, RSI bullish divergence).
- **Entry:** Break above neckline (the middle peak).
- **Stop Loss:** Below second trough.
- **Take Profit:** Neckline-to-trough height projected above neckline.
- **Timeframes:** 1h / 4h.
- **Rules:** Prefer W pattern after a prolonged downtrend.

**S10. Options Directional Strategy (TICKER1, TICKER2)**
- **Setup:** Strong technical setup (e.g., EMA pullback + volume) aligned with expected directional move. Select near-month ATM options.
- **Entry:** Buy Call (bullish) or Buy Put (bearish) alongside the underlying trade.
- **Stop Loss:** Position size equivalent to 1.5× the underlying SL.
- **Take Profit:** 50–100% of premium or at the underlying TP level.
- **Timeframes:** 15m / 1h for timing; option expiry ≥ 7 days.
- **Rules:** Never more than 30% of risk budget in options. Options are supplementary, not primary.

**S11. Options Spread Strategy (TICKER1, TICKER2)**
- **Setup:** Defined-risk directional bet using bull call spread or bear put spread.
- **Execution:** Buy ATM option, sell OTM option (1 strike apart). Net debit paid.
- **Stop Loss:** 100% of premium paid (max loss).
- **Take Profit:** Max profit = strike width minus premium paid.
- **Timeframes:** 1h / 4h for bias; expiry 3–7 days.
- **Rules:** IV < 30th percentile of 20-day range recommended. Avoid before major events.

**S12. Volatility Breakout Strategy (TICKER2, TICKER3)**
- **Setup:** Bollinger bands (< SMA20 bands) at minimum width of 20 candles. Watch for an expansion candle (> 2× average range).
- **Entry:** In the direction of the expansion candle.
- **Stop Loss:** Beyond the expansion candle low (bullish) or high (bearish).
- **Take Profit:** 2× ATR or next key level.
- **Timeframes:** 15m / 1h.
- **Rules:** Skip if expansion happens during low-liquidity period.

#### Advanced Patterns
| Pattern | Detail |
|---------|--------|
| Head & Shoulders | 3 peaks: left shoulder (average), head (highest), right shoulder (lower, lower vol). Neckline break = bearish |
| Parabolic blow-off | Steep exponential rise, 30°+ trendline angle, followed by a crash candle (long upper wick, high volume) |
| Liquidity shock | Single candle with 3×+ average range, often triggered by news; wide spread, quick reversal |
| Event-driven IV spike | IV > 90th percentile; options premium inflated; mean-reversion post-event |

#### Replay Usage
- 30 replay sessions, speed 2×–8×.
- Full trade lifecycle: entry → management → exit → journaling.
- Each session includes at least one options trade.

#### Evaluation
- Max drawdown < 10% over 30 sessions.
- 50-trade journal with 90%+ rule adherence.
- All options trades logged with IV, delta, expiry, reason.

---

### LEVEL 4 — MASTER (System Builder)

**Goal:** Build and refine personal trading systems using Tejvanta.

#### System Design
| Component | Detail |
|-----------|--------|
| Entry rules | Clear conditions (e.g., EMA20 touch + RSI < 35 + bullish engulfing on 15m) |
| Exit rules | TP at 2× ATR; Trailing SL after 1× ATR in profit |
| Filters | Skip when ATR > 3× 20-period avg (volatility too high) or when EMA20/50 are entangled |
| Risk model | 1% per trade, 3% max daily loss, scale down after 2 consecutive losses |
| Instruments | TICKER1 (6 trades/mo expected), TICKER3 (8 trades/mo) |
| Timeframes | 4h for bias, 15m for entry |

#### Scenario-Based Training

| Scenario | Description | Regime | Session Count |
|----------|-------------|--------|---------------|
| Trend Day | Strong directional move, shallow pullbacks, volume rising | Trend | 10 |
| Range Day | Horizontal channel, wicky candles, failed breakouts | Chop | 10 |
| Volatility Day | Wide ranges, gaps, ATR > 2× average | High Vol | 5 |
| Event Day | Data release with IV spike, sharp move, mean-reversion | Event | 5 |
| Liquidity Shock Day | Single extreme candle, spread widening, quick normalization | Shock | 5 |

#### Performance Optimization
| Metric | Target |
|--------|--------|
| Win rate | 40–60% |
| Avg R-multiple | ≥ 1.5 |
| Profit factor | ≥ 1.5 |
| Max drawdown | ≤ 15% |
| Sharpe ratio (daily) | ≥ 1.0 |
| Trades per month | 15–30 |

#### Final Assessment
- 100-trade challenge across TICKER1—TICKER4.
- At least 3 different strategies used with ≥ 10 trades each.
- 5 replay scenarios completed at Master difficulty (8× speed, no pause).
- 1 custom strategy documented: rules, filters, R-multiple distribution, performance summary.

---

## 2) MOCK_DATA_PATTERNS

All patterns use the `generateInitialCandles` / `generateTickStream` infrastructure in `marketEngine.ts`. The market engine already supports phase transitions; these patterns extend it with controlled parameterization.

### 2.1 EMA Pullback Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| EPB‑01 | Smooth uptrend with shallow pullbacks | HH/HL sequence, pullbacks touch EMA20 and bounce; 3–5 pullbacks per 100 candles | +0.03–0.06% per tick | Beginner | S1 (EMA20 Pullback) |
| EPB‑02 | Deep pullback, heavy retrace | Retrace 38.2–50% of prior swing, touches EMA50, reversal candle closes above EMA20 | −0.06–0.10% then +0.08% per tick | Intermediate | S1 + S4 (Breakout+Retest) |
| EPB‑03 | Failed pullback → reversal | Price touches EMA20, closes below it, next candle confirms breakdown below EMA50 | −0.05% per tick, accelerating | Advanced | S8 (M Pattern) |

**Engine overrides:**
```
phase: 'markup' → 'distribution' (for EPB-03)
volatility: 0.7× normal for pullback, 1.3× after breakout
order flow: net buy accumulates during pullback (EPB-01/02), net sell during reversal (EPB-03)
```

### 2.2 Mean-Reversion Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| MRP‑01 | RSI > 75, sharp reversal | 5–8 candles of buying, RSI > 75, then a bearish engulfing + RSI drop below 50 | +0.08% → −0.06% per tick | Beginner | S2 (RSI Mean-Reversion) |
| MRP‑02 | RSI < 25, V‑bottom | 5–8 candles of selling, RSI < 25, then a bullish hammer + close above EMA20 | −0.08% → +0.06% per tick | Beginner | S2 |
| MRP‑03 | Slow grind reversion | Gradual drift to RSI > 75, slow choppy reversal over 15+ candles, false signals | +0.03% then −0.02% | Intermediate | S2 (filtered) |

**Engine overrides:**
```
phase: 'markup' → 'distribution' (MRP-01), 'markdown' → 'accumulation' (MRP-02)
volatility: decreasing during reversion (0.8× → 0.5×)
rsiTarget: forced to 27 (oversold) or 73 (overbought) before reversal
```

### 2.3 Breakout Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| BOP‑01 | Tight compression → breakout | 10–15 candles with range < 0.3% of price; sudden expansion candle (+0.5%+); above‑avg volume | +0.5% on breakout | Beginner | S3 (Simple Breakout) |
| BOP‑02 | Breakout → retest → continuation | Break above resistance; pullback to old resistance (now support); bounce and continuation | +0.6% total | Intermediate | S4 (Breakout+Retest) |
| BOP‑03 | Breakout → fakeout → reversal | Break above resistance, close back inside range after 2 candles; trap buyers → sharp reversal down | −0.5% after fakeout | Advanced | S5 (MTF) to detect fakeout |

**Engine overrides:**
```
phase: 'accumulation' → 'markup' (BOP-01/02), 'markup' → 'distribution' (BOP-03)
volatility: 0.3× during compression, 2.0× on breakout
order flow: net buy spikes 3× on breakout (BOP-01/02), net sell on fakeout (BOP-03)
```

### 2.4 Pattern-Specific Data

#### FLAG Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| FLG‑01 | Bull flag, 7‑candle pole, 10‑candle flag | Pole: +0.7% total over 7 candles. Flag: −0.1% drift in tight channel. Breakout: +0.8% total. Volume drops 40% during flag, spikes 2× on breakout. | +1.5% total | Intermediate | S6 (Flag Breakout) |
| FLG‑02 | Bear flag | Pole: −0.6% over 6 candles. Flag: +0.1% drift. Breakout: −0.7%. | −1.3% total | Intermediate | S6 |

#### PENNANT Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| PEN‑01 | Bull pennant, 5‑candle pole, 7‑candle pennant | Pole: +0.5%. Pennant: converging, range shrinking from 0.3% to 0.1%. Breakout: +0.6%. | +1.1% total | Intermediate | S7 (Pennant Breakout) |
| PEN‑02 | Bear pennant | Pole: −0.5%. Pennant: converging. Breakout: −0.5%. | −1.0% total | Intermediate | S7 |

#### M Pattern (Double Top)

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| M‑01 | Clean double top, quick reversal | Peak 1 at +0.8%, trough at +0.2%, Peak 2 at +0.78% with lower vol/weak RSI. Neckline break at +0.2%. Projected move: −0.6%. | −0.6% projected | Advanced | S8 (M Pattern Reversal) |

#### W Pattern (Double Bottom)

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| W‑01 | Clean double bottom, bullish reversal | Trough 1 at −0.7%, middle peak at −0.1%, Trough 2 at −0.72% with higher vol/RSI div. Neckline break at −0.1%. Projected move: +0.6%. | +0.6% projected | Advanced | S9 (W Pattern Reversal) |

### 2.5 Volatility & Liquidity Patterns

| Pattern ID | Description | OHLC Behavior | % Move | Level | Linked Strategy |
|------------|-------------|---------------|--------|-------|-----------------|
| VOL‑01 | Trend day | 100+ candles, one direction, 3–5 shallow pullbacks (< 20% retrace), rising volume. Volatility 0.8× normal. | +1.2% across day | Beginner | S1 (EMA20) |
| VOL‑02 | Range-bound day | 80+ candles, horizontal channel (0.3% tall), wicky candles, 4+ failed breakouts. Volatility 0.5× normal. | +/− 0.05% net | Beginner | Range identification |
| VOL‑03 | Volatility expansion | Bollinger band width < 50% of 20‑period avg for 20 candles, then a 2.5× range candle + breakout. Volatility goes from 0.4× to 2.0×. | +0.8% | Advanced | S12 (Volatility Breakout) |
| VOL‑04 | Liquidity shock | 3× average range candle, spread widens 2×, then normalizes in 3–5 candles. Volatility spiked to 3× then decays. | +/− 1.0% single candle | Master | System Builder |

**Engine overrides:**
```
For VOL-01: phase stays 'markup' for 100+ ticks, drift = 0.06
For VOL-02: phase cycles accumulation ↔ consolidation, drift near zero
For VOL-03: phase 'consolidation' → 'markup', volatility from 0.4→2.0 step function
For VOL-04: single tick with 3× vol, then 0.6× decay per tick back to normal
```

---

## 3) REPLAY_SCENARIOS

Each scenario is a parameterized `marketEngine` configuration that can be loaded into the replay system.

| ID | Name | Instruments | Window | Regime | Level | Strategies | Learning Objectives |
|----|------|-------------|--------|--------|-------|------------|-------------------|
| RS‑01 | Beginner Trend Day (TICKER1) | TICKER1 | 1 day | Trend (VOL‑01) | Beginner | S1 (EMA20 Pullback) | Identify HH/HL, execute pullback entries, set proper SL, journal 3–5 trades |
| RS‑02 | Beginner Mean-Reversion (TICKER4) | TICKER4 | 1 day | Mean-reversion (MRP‑01, MRP‑02) | Beginner | S2 (RSI Mean‑Rev) | Read RSI, wait for confirmation candle, avoid catching falling knife |
| RS‑03 | Intermediate Flag & Pennant (TICKER2) | TICKER2 | 2 days | Pattern-based (FLG‑01, FLG‑02, PEN‑01) | Intermediate | S6, S7 | Identify flag vs pennant, measure pole, volume confirmation |
| RS‑04 | Breakout + Retest (TICKER3) | TICKER3 | 1 day | Breakout (BOP‑02) | Intermediate | S4 (Breakout+Retest) | Wait for retest, identify level role-swap, avoid fake breakouts |
| RS‑05 | Chop Zone Avoidance (TICKER1, TICKER4) | TICKER1, TICKER4 | 2 days | Range-bound (VOL‑02) | Intermediate | N/A (don't trade) | Identify chop, avoid false signals, wait for expansion |
| RS‑06 | M/W Reversal Day (TICKER1, TICKER3) | TICKER1, TICKER3 | 3 days | Pattern-based (M‑01, W‑01) | Advanced | S8 (M Pattern), S9 (W Pattern) | Identify double top/bottom, measure neckline, RSI divergence |
| RS‑07 | Options Expiry Pressure (TICKER1) | TICKER1 | 1 day | High vol with IV spike (event-like) | Advanced | S10, S11 | Select strike, calculate spread max loss, align with TA |
| RS‑08 | Volatility Expansion (TICKER2) | TICKER2 | 1 day | Volatility breakdown (VOL‑03) | Advanced | S12 (Volatility Breakout) | Measure band width, enter expansion candle, manage TP |
| RS‑09 | Multi-Day Swing Trend (TICKER3) | TICKER3 | 3 days | Trend with pullbacks (EPB‑01, EPB‑02) | Master | S5 (MTF Confluence), S1 | Multi-day position management, trailing SL, add-on entries |
| RS‑10 | Liquidity Shock & Reversal (TICKER1) | TICKER1 | 1 day | Shock (VOL‑04) | Master | System Builder | Survive shock, don't panic-exit, assess structural damage, trade the normalization |
| RS‑11 | Mixed Regime Challenge (TICKER1—TICKER4) | All | 5 days | Rotation: trend→chop→high vol→pattern→shock | Master | All | Adapt to regime changes, flexibly switch strategies, manage multiple positions |

### Replay Configuration Parameters
| Parameter | Values |
|-----------|--------|
| Speed | 0.5×, 1×, 2×, 4×, 8× |
| Pause on SL hit | true / false (Master: false) |
| Show expected ranges | true / false (Beginner: true, Advanced+: false) |
| Mark S/R levels | Pre-marked / Manual-only / None (Master) |
| Trading journal | Required fields: entry time, price, SL, TP, amount, exit time, price, R, notes |

---

## 4) LEARNING_PAGE_TILES

### Tile Data Model

```typescript
export interface StrategyTile {
  id: string
  title: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master'
  category: 'Trend' | 'Breakout' | 'Pattern' | 'Options' | 'Mean-Reversion' | 'System'
  instruments: string[]      // ['TICKER1', 'TICKER2', 'TICKER3', 'TICKER4']
  timeframes: string[]       // ['1m', '5m', '15m', '30m', '1h', '4h', '1D']
  indicators: string[]       // ['SMA20', 'EMA20', 'SMA50', 'EMA50', 'RSI14', 'Volume', 'Vol Bands']
  patternType: string | null // 'Flag', 'Pennant', 'M', 'W', 'HH/HL', null
  description: string        // short description
  mockDataPatterns: string[] // ['EPB-01', 'EPB-02', ...]
  replayScenarios: string[]  // ['RS-01', 'RS-06', ...]
  practiceSessions: number   // suggested count
  evaluationCriteria: string // e.g., '10 trades with ≥1:2 RR'
}
```

### Tiles

#### T1 — EMA20 Pullback (Beginner)
```
id: 'ema20-pullback'
level: 'Beginner'
category: 'Trend'
instruments: ['TICKER1', 'TICKER3']
timeframes: ['5m', '15m']
indicators: ['EMA20', 'RSI14']
patternType: 'HH/HL'
description: 'Buy pullbacks to EMA20 in an uptrend. Confirm with RSI > 40. Tight SL below swing low.'
mockDataPatterns: ['EPB-01', 'EPB-02']
replayScenarios: ['RS-01']
practiceSessions: 5
evaluationCriteria: '10 trades with ≥1:2 RR'
```

#### T2 — RSI Mean-Reversion (Beginner)
```
id: 'rsi-mean-reversion'
level: 'Beginner'
category: 'Mean-Reversion'
instruments: ['TICKER2', 'TICKER4']
timeframes: ['5m', '15m']
indicators: ['RSI14']
patternType: null
description: 'Enter when RSI14 crosses out of oversold (<30) or overbought (>70). Confirmation candle required.'
mockDataPatterns: ['MRP-01', 'MRP-02']
replayScenarios: ['RS-02']
practiceSessions: 5
evaluationCriteria: '10 trades, identify reversal candle correctly'
```

#### T3 — Simple Breakout (Beginner)
```
id: 'simple-breakout'
level: 'Beginner'
category: 'Breakout'
instruments: ['TICKER1', 'TICKER2', 'TICKER3', 'TICKER4']
timeframes: ['5m', '15m', '1h']
indicators: ['Volume']
patternType: null
description: 'Enter when price breaks a clear S/R level with above-average volume. Confirm with close outside range.'
mockDataPatterns: ['BOP-01']
replayScenarios: ['RS-04']
practiceSessions: 5
evaluationCriteria: '10 breakout trades, correct volume confirmation'
```

#### T4 — Breakout + Retest (Intermediate)
```
id: 'breakout-retest'
level: 'Intermediate'
category: 'Breakout'
instruments: ['TICKER1', 'TICKER2', 'TICKER3', 'TICKER4']
timeframes: ['5m', '15m', '1h']
indicators: ['Volume']
patternType: null
description: 'After a breakout, wait for retest of the level from the other side. Enter on rejection candle. Avoid fake breakouts.'
mockDataPatterns: ['BOP-02', 'BOP-03']
replayScenarios: ['RS-04', 'RS-05']
practiceSessions: 8
evaluationCriteria: '15 trades, identify fakeout vs genuine retest'
```

#### T5 — Multi-Timeframe Confluence (Intermediate)
```
id: 'mtf-confluence'
level: 'Intermediate'
category: 'Trend'
instruments: ['TICKER1', 'TICKER3']
timeframes: ['4h + 5m', '4h + 15m']
indicators: ['EMA20', 'EMA50', 'RSI14']
patternType: null
description: 'Use 4h chart for trend direction (EMA20 > EMA50, price above). Enter on 5m/15m pullback with confirmation.'
mockDataPatterns: ['EPB-01', 'EPB-02']
replayScenarios: ['RS-09']
practiceSessions: 8
evaluationCriteria: '15 trades with higher TF bias documented'
```

#### T6 — Flag Pattern Breakout (Intermediate)
```
id: 'flag-breakout'
level: 'Intermediate'
category: 'Pattern'
instruments: ['TICKER2', 'TICKER3']
timeframes: ['5m', '15m', '1h']
indicators: ['Volume']
patternType: 'Flag'
description: 'Sharp pole → tight channel consolidation (sloping opposite to pole). Enter on channel breakout with volume spike. Pole height = TP projection.'
mockDataPatterns: ['FLG-01', 'FLG-02']
replayScenarios: ['RS-03']
practiceSessions: 6
evaluationCriteria: '10 flag trades, correct pole measurement'
```

#### T7 — Pennant Pattern Breakout (Intermediate)
```
id: 'pennant-breakout'
level: 'Intermediate'
category: 'Pattern'
instruments: ['TICKER2', 'TICKER4']
timeframes: ['5m', '15m']
indicators: ['Volume']
patternType: 'Pennant'
description: 'Sharp pole → converging triangle (lower highs + higher lows). Enter on breakout with volume. Shorter pennants → stronger breakouts.'
mockDataPatterns: ['PEN-01', 'PEN-02']
replayScenarios: ['RS-03']
practiceSessions: 6
evaluationCriteria: '10 pennant trades, correct apex measurement'
```

#### T8 — M Pattern Reversal (Advanced)
```
id: 'm-pattern-reversal'
level: 'Advanced'
category: 'Pattern'
instruments: ['TICKER1', 'TICKER3']
timeframes: ['1h', '4h']
indicators: ['RSI14', 'Volume']
patternType: 'M'
description: 'Two peaks at same level; second peak shows weaker momentum (lower volume, RSI divergence). Enter on neckline break below middle trough.'
mockDataPatterns: ['M-01']
replayScenarios: ['RS-06']
practiceSessions: 8
evaluationCriteria: '10 M-pattern trades, document RSI divergence for each'
```

#### T9 — W Pattern Reversal (Advanced)
```
id: 'w-pattern-reversal'
level: 'Advanced'
category: 'Pattern'
instruments: ['TICKER1', 'TICKER4']
timeframes: ['1h', '4h']
indicators: ['RSI14', 'Volume']
patternType: 'W'
description: 'Two troughs at same level; second trough shows stronger momentum (higher volume, RSI bullish divergence). Enter on neckline break above middle peak.'
mockDataPatterns: ['W-01']
replayScenarios: ['RS-06']
practiceSessions: 8
evaluationCriteria: '10 W-pattern trades, document RSI divergence for each'
```

#### T10 — Options Directional Strategy (Advanced)
```
id: 'options-directional'
level: 'Advanced'
category: 'Options'
instruments: ['TICKER1', 'TICKER2']
timeframes: ['15m', '1h']
indicators: ['EMA20', 'RSI14', 'Volume']
patternType: null
description: 'Combine strong TA setup with near-month ATM options. Calls for bullish, Puts for bearish. Options supplement primary stock/index trade. Max 30% of risk budget.'
mockDataPatterns: ['BOP-02', 'EPB-01']
replayScenarios: ['RS-07']
practiceSessions: 6
evaluationCriteria: '10 options trades, document IV, delta, expiry reasoning'
```

#### T11 — Options Spread Strategy (Advanced)
```
id: 'options-spread'
level: 'Advanced'
category: 'Options'
instruments: ['TICKER1', 'TICKER2']
timeframes: ['1h', '4h']
indicators: ['Vol Bands']
patternType: null
description: 'Bull call spread / bear put spread: Buy ATM, sell OTM one strike apart. Defined risk (premium paid). Prefer low IV (< 30th percentile). Max profit = strike width minus premium.'
mockDataPatterns: ['BOP-01']
replayScenarios: ['RS-07']
practiceSessions: 6
evaluationCriteria: '10 spread trades, calculate max loss and max profit correctly'
```

#### T12 — Volatility Breakout Strategy (Advanced)
```
id: 'volatility-breakout'
level: 'Advanced'
category: 'Breakout'
instruments: ['TICKER2', 'TICKER3']
timeframes: ['15m', '1h']
indicators: ['Vol Bands', 'Volume']
patternType: null
description: 'Enter when synthetic Bollinger bands reach minimum width of 20 periods, then an expansion candle (> 2× avg range) breaks out. Direction of expansion = trade direction.'
mockDataPatterns: ['VOL-03']
replayScenarios: ['RS-08']
practiceSessions: 6
evaluationCriteria: '10 volatility breakout trades, measure band width correctly'
```

#### T13 — Custom System Builder (Master)
```
id: 'system-builder'
level: 'Master'
category: 'System'
instruments: ['TICKER1', 'TICKER2', 'TICKER3', 'TICKER4']
timeframes: ['all']
indicators: ['all']
patternType: null
description: 'Design, backtest, and refine your own trading system. Define entry/exit rules, filters, risk models, and instrument/timeframe preferences. Validate with 100-trade challenge.'
mockDataPatterns: ['all']
replayScenarios: ['RS-09', 'RS-10', 'RS-11']
practiceSessions: 20
evaluationCriteria: '100 trades, ≥3 strategies, ≤15% max drawdown, documented system'
```

---

## Implementation Notes

### Market Engine Integration
Each mock data pattern maps to parameterized overrides in `generateInitialCandles`:
```typescript
interface PatternOverride {
  phaseSequence: MarketPhase[]
  driftValues: number[]          // one per phase segment
  volatilityValues: number[]     // one per phase segment
  rsiTarget: number | null       // force RSI to this value before reversal
  orderFlowBias: 'buy' | 'sell' | 'neutral'
  volumeMultiplier: number       // 0.3 (low) to 3.0 (high)
  poleCandles: number | null     // for flag/pennant pole length
  consolidationCandles: number | null // for flag/pennant consolidation
}
```

### Replay Data Format
```typescript
interface ReplayScenario {
  id: string
  name: string
  instruments: string[]
  sessions: number
  speedRange: [number, number]   // e.g., [0.5, 1.0]
  tickData: { time: number; price: number; volume: number; buyVol: number; sellVol: number }[]
  phaseMarkers?: { time: number; label: string }[]  // optional phase annotations for feedback
}
```

### Learning Page Tile Rendering
Tiles render in a responsive grid grouped by level. Each tile is clickable → opens a detail panel showing:
- Strategy rule card (entry, SL, TP, filters)
- Linked mock data patterns (click to generate a chart example)
- Linked replay scenarios (click to start replay)
- Practice session tracker (progress bar)
- Evaluation checklist

```
+--------------------------------------------+
| [Level: Beginner]                           |
| +------------------+ +------------------+  |
| | EMA20 Pullback   | | RSI Mean-Rev     |  |
| | ⭐ 10/20 trades  | | ⭐ 8/10 trades   |  |
| +------------------+ +------------------+  |
| [Level: Intermediate]                       |
| +------------------+ +------------------+  |
| | Breakout+Retest  | | Flag Pattern     |  |
| | ⭐ 5/15 trades   | | ⭐ 3/10 trades   |  |
| +------------------+ +------------------+  |
+--------------------------------------------+
```
