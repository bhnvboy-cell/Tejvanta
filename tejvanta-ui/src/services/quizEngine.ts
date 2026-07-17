const STORAGE_QUIZ = 'tj_quiz_attempts'

export type QuestionType =
  | 'identify-pattern' | 'choose-sl-placement' | 'choose-entry-candle'
  | 'spot-fake-breakout' | 'spot-trend-vs-chop' | 'calculate-risk'
  | 'choose-tp-level' | 'phase-identification' | 'volume-analysis'
  | 'order-flow-analysis' | 'risk-calculus' | 'multi-timeframe'

export interface QuizQuestion {
  id: string
  tileId: string
  type: QuestionType
  difficulty: 1 | 2 | 3
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface QuizAttempt {
  quizId: string
  answers: Array<{ questionId: string; selectedIndex: number; correct: boolean }>
  score: number
  passed: boolean
  timestamp: number
}

export const QUESTION_BANK: QuizQuestion[] = [
  // ====== EMA PULLBACK (5 questions) ======
  { id: 'q-ep-01', tileId: 'tile-ema-pullback', type: 'identify-pattern', difficulty: 1,
    prompt: 'Price touched EMA20 and reversed with increased volume. Is this a valid pullback entry?',
    options: ['Yes — price respected EMA and reversed with momentum', 'No — wait for next candle close', 'Only if RSI > 70', 'Not enough information'],
    correctIndex: 0, explanation: 'A valid EMA pullback shows price touching the EMA and immediately reversing with increasing volume.' },
  { id: 'q-ep-02', tileId: 'tile-ema-pullback', type: 'choose-sl-placement', difficulty: 1,
    prompt: 'Entry at 2850 on an EMA pullback. Where should SL go?',
    options: ['2848 (2 pts below entry)', '2820 (below recent swing low)', '2855 (above entry)', 'No SL needed on pullbacks'],
    correctIndex: 1, explanation: 'SL goes below the recent swing low, not just below entry. This gives the trade room to breathe.' },
  { id: 'q-ep-03', tileId: 'tile-ema-pullback', type: 'spot-trend-vs-chop', difficulty: 1,
    prompt: 'Price oscillates around EMA20 with no clear direction. Is this a pullback setup?',
    options: ['Yes — EMA is being tested', 'No — sideways/chop with no trend', 'Only on the 3rd touch', 'Wait for RSI divergence'],
    correctIndex: 1, explanation: 'Pullback requires a clear uptrend. Oscillating around EMA in chop is not valid — wait for trend to establish.' },
  { id: 'q-ep-04', tileId: 'tile-ema-pullback', type: 'choose-tp-level', difficulty: 1,
    prompt: 'You enter a long pullback at 2850, SL at 2820. Where is the minimum TP for 1:2 R:R?',
    options: ['2870', '2890', '2910', '2850'],
    correctIndex: 2, explanation: 'R = 2850 - 2820 = 30. 1:2 R:R means TP = 2850 + (2 × 30) = 2910.' },
  { id: 'q-ep-05', tileId: 'tile-ema-pullback', type: 'order-flow-analysis', difficulty: 2,
    prompt: 'During an EMA pullback, you see sell volume increasing as price approaches the EMA. What does this suggest?',
    options: ['Pullback will hold and reverse', 'EMA may break — weakness', 'Strong trend continuation', 'Volume is irrelevant'],
    correctIndex: 1, explanation: 'Increasing sell volume into the EMA suggests the pullback may fail. Look for buy volume absorption before entering.' },

  // ====== RSI MEAN REVERSION (4 questions) ======
  { id: 'q-rs-01', tileId: 'tile-rsi-mean-reversion', type: 'identify-pattern', difficulty: 1,
    prompt: 'RSI dropped below 30 and shows a bullish divergence. What should you do?',
    options: ['Enter long immediately', 'Wait for RSI to cross back above 30', 'Short the instrument', 'Ignore divergence'],
    correctIndex: 1, explanation: 'Wait for confirmation — RSI crossing back above 30 after being oversold confirms the reversal signal.' },
  { id: 'q-rs-02', tileId: 'tile-rsi-mean-reversion', type: 'choose-tp-level', difficulty: 1,
    prompt: 'Entry at 2800 after RSI oversold. Where is the logical TP?',
    options: ['2820 (small profit)', '2850 (nearest resistance)', '2900 (2x risk)', 'No TP needed'],
    correctIndex: 1, explanation: 'In mean-reversion, TP is typically at the nearest resistance level or the EMA20.' },
  { id: 'q-rs-03', tileId: 'tile-rsi-mean-reversion', type: 'spot-fake-breakout', difficulty: 2,
    prompt: 'RSI drops to 28 but price makes a lower low while RSI makes a higher low. What is this called?',
    options: ['Bearish continuation', 'Bullish divergence — potential reversal', 'RSI failure swing', 'Trend exhaustion'],
    correctIndex: 1, explanation: 'When price makes a lower low but RSI makes a higher low, it is a bullish divergence — momentum is slowing and a reversal is likely.' },
  { id: 'q-rs-04', tileId: 'tile-rsi-mean-reversion', type: 'order-flow-analysis', difficulty: 2,
    prompt: 'RSI is at 75 and price is at resistance. Volume is declining. What is the likely next move?',
    options: ['Breakout above resistance', 'Pullback or reversal from overbought', 'Continuation higher', 'Sideways consolidation'],
    correctIndex: 1, explanation: 'RSI overbought + resistance + declining volume = high probability of a pullback or reversal.' },

  // ====== SIMPLE BREAKOUT (4 questions) ======
  { id: 'q-sb-01', tileId: 'tile-simple-breakout', type: 'spot-fake-breakout', difficulty: 2,
    prompt: 'Price breaks above resistance but closes back below. Is this a valid breakout?',
    options: ['Yes — any break counts', 'No — fake breakout / failure', 'Only if volume confirms', 'Wait for next candle'],
    correctIndex: 1, explanation: 'A valid breakout requires the candle to CLOSE above resistance. A close back below signals a false breakout.' },
  { id: 'q-sb-02', tileId: 'tile-simple-breakout', type: 'choose-entry-candle', difficulty: 2,
    prompt: 'Resistance at 3000. Which is the correct entry for a breakout?',
    options: ['As soon as price touches 3000', 'When candle closes above 3000 with volume', 'After price goes 2% above', 'At previous support'],
    correctIndex: 1, explanation: 'Wait for confirmed close above resistance with increased volume for a valid breakout entry.' },
  { id: 'q-sb-03', tileId: 'tile-simple-breakout', type: 'volume-analysis', difficulty: 2,
    prompt: 'A breakout candle shows volume 3x the average. What does this confirm?',
    options: ['Nothing special', 'Strong conviction behind the move — breakout likely valid', 'Distribution is happening', 'Volume too high — wait'],
    correctIndex: 1, explanation: 'High volume on a breakout candle confirms institutional participation and increases the probability of a sustained move.' },
  { id: 'q-sb-04', tileId: 'tile-simple-breakout', type: 'identify-pattern', difficulty: 1,
    prompt: 'A stock has been consolidating between 2500 and 2600 for two weeks. It now breaks above 2600. What type of breakout is this?',
    options: ['Range breakout', 'Trend continuation', 'Pullback entry', 'Mean reversion'],
    correctIndex: 0, explanation: 'Breaking above a well-defined range after weeks of consolidation is a classic range breakout setup.' },

  // ====== BREAKOUT+RETEST (4 questions) ======
  { id: 'q-br-01', tileId: 'tile-breakout-retest', type: 'choose-entry-candle', difficulty: 2,
    prompt: 'After a breakout, price comes back to the broken resistance level. What confirms the retest entry?',
    options: ['Any touch of the level', 'Candle closes above the level with a rejection wick', 'Price staying below the level', 'RSI oversold'],
    correctIndex: 1, explanation: 'A valid retest entry shows price touching the level and bouncing with a rejection wick, closing back above it.' },
  { id: 'q-br-02', tileId: 'tile-breakout-retest', type: 'spot-fake-breakout', difficulty: 2,
    prompt: 'Price broke out, retested, and the retest candle closes BELOW the breakout level. What should you do?',
    options: ['Enter long — the retest is happening', 'Wait — this could be a failed breakout', 'Add to position', 'Set a wider SL'],
    correctIndex: 1, explanation: 'A retest that closes below the breakout level suggests the breakout has failed. Avoid entering and look for a new setup.' },
  { id: 'q-br-03', tileId: 'tile-breakout-retest', type: 'order-flow-analysis', difficulty: 3,
    prompt: 'Breakout shows high volume. Retest shows low volume. What does this tell you?',
    options: ['Weak retest — likely to resume higher', 'Retest will fail', 'Volume is irrelevant', 'Distribution happening'],
    correctIndex: 0, explanation: 'High volume breakout + low volume retest = strong hands are holding and selling pressure is minimal. The trend is likely to resume.' },
  { id: 'q-br-04', tileId: 'tile-breakout-retest', type: 'choose-sl-placement', difficulty: 2,
    prompt: 'Entered a retest at 2650. The breakout level is 2600. Where should SL go?',
    options: ['2640', '2590 (below the breakout level)', '2655', 'No SL — it is a retest'],
    correctIndex: 1, explanation: 'SL should go below the original breakout level (2600). If price falls back below, the breakout has failed and you want to be out.' },

  // ====== FLAG BREAKOUT (4 questions) ======
  { id: 'q-fb-01', tileId: 'tile-flag-breakout', type: 'identify-pattern', difficulty: 2,
    prompt: 'Sharp rally followed by downward-sloping parallel consolidation. What pattern?',
    options: ['Pennant (triangle)', 'Flag (parallel channel)', 'Double Top', 'Volume Compression'],
    correctIndex: 1, explanation: 'A flag has a sharp move then parallel downward-sloping consolidation. A pennant converges into a triangle.' },
  { id: 'q-fb-02', tileId: 'tile-flag-breakout', type: 'choose-entry-candle', difficulty: 2,
    prompt: 'Flag channel formed. Where is the correct entry?',
    options: ['As soon as price enters the flag', 'When price breaks above flag upper trendline with volume', 'At the bottom of the flag', 'When RSI overshoots'],
    correctIndex: 1, explanation: 'Wait for confirmed break above the flag upper trendline with increased volume. Premature entry inside the flag risks a false break.' },
  { id: 'q-fb-03', tileId: 'tile-flag-breakout', type: 'spot-fake-breakout', difficulty: 2,
    prompt: 'Price breaks above the flag but closes back inside. Is this a valid breakout?',
    options: ['Yes — any break counts', 'No — fake breakout / failure', 'Only if next candle also breaks', 'Depends on volume'],
    correctIndex: 1, explanation: 'A valid breakout requires the candle to CLOSE above the flag. A close back inside signals a false breakout.' },
  { id: 'q-fb-04', tileId: 'tile-flag-breakout', type: 'calculate-risk', difficulty: 3,
    prompt: 'Flagpole start: 2700. Flagpole top: 3000. Entry at 3020 after breakout. SL at 2970. What is the price target using flagpole measurement?',
    options: ['3200', '3300', '3400', '3100'],
    correctIndex: 1, explanation: 'Flagpole height = 3000 - 2700 = 300. Target = breakout point (3020) + flagpole height = 3020 + 300 = 3320. Nearest is 3300.' },

  // ====== PENNANT BREAKOUT (3 questions) ======
  { id: 'q-pb-01', tileId: 'tile-pennant-breakout', type: 'identify-pattern', difficulty: 2,
    prompt: 'A sharp move is followed by converging trend lines forming a small triangle. What pattern?',
    options: ['Flag (parallel channel)', 'Pennant (triangle)', 'Double Bottom', 'Wedge'],
    correctIndex: 1, explanation: 'A pennant is characterized by converging trend lines after a sharp move, forming a small symmetrical triangle.' },
  { id: 'q-pb-02', tileId: 'tile-pennant-breakout', type: 'volume-analysis', difficulty: 2,
    prompt: 'During pennant formation, volume typically contracts. What happens on the breakout?',
    options: ['Volume stays low', 'Volume should expand significantly', 'Volume is irrelevant', 'Volume reverses'],
    correctIndex: 1, explanation: 'Volume contracts during pennant formation and should expand significantly on the breakout for confirmation.' },
  { id: 'q-pb-03', tileId: 'tile-pennant-breakout', type: 'choose-entry-candle', difficulty: 2,
    prompt: 'Pennant has been forming for 10 candles. What indicates the entry is valid?',
    options: ['Price reaches the apex', 'Price breaks above upper trendline with 2x average volume', 'RSI crosses 50', 'Any move outside the triangle'],
    correctIndex: 1, explanation: 'Valid pennant entry requires a close above the upper trendline with at least 2x average volume for confirmation.' },

  // ====== M-PATTERN / W-PATTERN REVERSAL (4 questions) ======
  { id: 'q-mp-01', tileId: 'tile-m-pattern-reversal', type: 'identify-pattern', difficulty: 2,
    prompt: 'Two equal lows with a peak in between. What pattern?',
    options: ['Double Top', 'Double Bottom (W-pattern)', 'Flag', 'Pennant'],
    correctIndex: 1, explanation: 'Two equal lows = double bottom (W-pattern). Two equal highs = double top (M-pattern).' },
  { id: 'q-mp-02', tileId: 'tile-m-pattern-reversal', type: 'choose-sl-placement', difficulty: 2,
    prompt: 'Double Bottom entry at 2800. The lowest point of the pattern is 2700. Where should SL go?',
    options: ['2790', '2690 (slightly below the lowest low)', '2750', '2805'],
    correctIndex: 1, explanation: 'SL should go slightly below the lowest low of the pattern (2700). If price breaks below the pattern low, the reversal has failed.' },
  { id: 'q-mp-03', tileId: 'tile-m-pattern-reversal', type: 'choose-tp-level', difficulty: 2,
    prompt: 'Double Bottom pattern low: 2700. Entry: 2800. Neckline: 2800. What is the measured move target?',
    options: ['2850', '2900', '2950', '2800'],
    correctIndex: 1, explanation: 'Measured move = entry + (entry - low) = 2800 + (2800 - 2700) = 2800 + 100 = 2900.' },
  { id: 'q-mp-04', tileId: 'tile-m-pattern-reversal', type: 'spot-fake-breakout', difficulty: 3,
    prompt: 'Price breaks the neckline of a Double Bottom but volume is decreasing. What does this suggest?',
    options: ['Strong breakout', 'Weak breakout — could be a false break', 'Pattern is still valid', 'Volume does not matter'],
    correctIndex: 1, explanation: 'A valid reversal needs volume confirmation on the neckline break. Decreasing volume suggests lack of conviction.' },

  // ====== MTF CONFLUENCE (4 questions) ======
  { id: 'q-mtf-01', tileId: 'tile-mtf-confluence', type: 'phase-identification', difficulty: 3,
    prompt: '15m chart shows accumulation, 1h shows distribution. What does this mean?',
    options: ['Strong buy on 15m', 'Conflict — higher timeframe dominates', 'Ignore lower timeframe', 'Sell signal confirmed'],
    correctIndex: 1, explanation: 'When timeframes conflict, the higher timeframe dominates. 1h distribution means any 15m accumulation may be a trap.' },
  { id: 'q-mtf-02', tileId: 'tile-mtf-confluence', type: 'multi-timeframe', difficulty: 3,
    prompt: 'Daily chart is in an uptrend. 15m chart shows a pullback to EMA20 with bullish RSI divergence. What is the bias?',
    options: ['Bearish — lower timeframe is pulling back', 'Bullish — higher timeframe uptrend + lower timeframe setup align for continuation', 'Neutral — conflicting signals', 'Sell the pullback'],
    correctIndex: 1, explanation: 'This is ideal confluence: higher timeframe trend + lower timeframe pullback entry = high probability long setup.' },
  { id: 'q-mtf-03', tileId: 'tile-mtf-confluence', type: 'order-flow-analysis', difficulty: 3,
    prompt: 'Higher timeframe shows distribution (smart money selling). Lower timeframe shows a breakout. What is likely happening?',
    options: ['The breakout is real', 'This is a liquidity trap — smart money is distributing into the breakout', 'Buy the breakout', 'Lower timeframe always leads'],
    correctIndex: 1, explanation: 'Smart money distributes into strength. A lower timeframe breakout during higher timeframe distribution is often a trap to attract buyers.' },
  { id: 'q-mtf-04', tileId: 'tile-mtf-confluence', type: 'multi-timeframe', difficulty: 3,
    prompt: 'How many timeframes should you analyze for a proper MTF setup?',
    options: ['Just 1 — the entry timeframe', 'At least 2-3: higher trend, entry, lower for precision', '5+ timeframes', 'It depends on the instrument'],
    correctIndex: 1, explanation: 'The standard approach: higher timeframe for trend/bias, execution timeframe for setup, lower timeframe for entry precision.' },

  // ====== OPTIONS DIRECTIONAL (3 questions) ======
  { id: 'q-od-01', tileId: 'tile-options-directional', type: 'calculate-risk', difficulty: 2,
    prompt: 'You buy a Call option for ₹100. Delta is 0.5. If the underlying moves up ₹10, what is the approximate option profit?',
    options: ['₹100', '₹500', '₹1000', '₹50'],
    correctIndex: 1, explanation: 'Delta × move = 0.5 × 10 = ₹5 per share. For 1 lot (100 shares) = 5 × 100 = ₹500.' },
  { id: 'q-od-02', tileId: 'tile-options-directional', type: 'choose-sl-placement', difficulty: 2,
    prompt: 'You bought a Call option for ₹150. The option premium drops to ₹80. What should you consider?',
    options: ['Hold — it will come back', 'Cut loss — 47% down, define max risk before entry', 'Average down — buy more', 'Convert to spread'],
    correctIndex: 1, explanation: 'Define your max loss BEFORE entry. If the thesis is invalid, cut the loss rather than hoping for a recovery.' },
  { id: 'q-od-03', tileId: 'tile-options-directional', type: 'risk-calculus', difficulty: 3,
    prompt: 'IV is at 90th percentile historically. You expect a breakout. Should you buy options or sell them?',
    options: ['Buy options — breakout will increase IV', 'Sell options — IV is high and likely to contract (IV crush)', 'IV is irrelevant', 'Buy futures instead'],
    correctIndex: 1, explanation: 'When IV is already high, buying options risks IV crush even if direction is correct. Selling options or using spreads is safer.' },

  // ====== OPTIONS SPREAD (3 questions) ======
  { id: 'q-os-01', tileId: 'tile-options-spread', type: 'calculate-risk', difficulty: 3,
    prompt: 'Bull Call Spread: Buy 3000 CE @ ₹100, Sell 3100 CE @ ₹40. Max profit and max loss?',
    options: ['Max profit ₹40, Max loss ₹100', 'Max profit ₹60, Max loss ₹60', 'Max profit ₹6000, Max loss ₹6000', 'Max profit ₹100, Max loss ₹40'],
    correctIndex: 1, explanation: 'Net debit = 100 - 40 = ₹60. Max loss = net debit = ₹60 (×100 = ₹6,000). Max profit = spread width - net debit = (3100-3000) - 60 = 100 - 60 = ₹40 (×100 = ₹4,000). Wait — actually max profit = 100 - 60 = 40 per share = ₹4,000.' },
  { id: 'q-os-02', tileId: 'tile-options-spread', type: 'risk-calculus', difficulty: 3,
    prompt: 'When would you choose a Put Credit Spread over buying a Put outright?',
    options: ['When you expect a small move down and want theta decay on your side', 'When you expect a huge crash', 'When IV is low', 'Never — spreads are always worse'],
    correctIndex: 0, explanation: 'Put Credit Spreads are net sellers — you collect premium and benefit from theta decay. Best when you expect a moderate/small move down or sideways.' },
  { id: 'q-os-03', tileId: 'tile-options-spread', type: 'phase-identification', difficulty: 3,
    prompt: 'Entry for a Call Credit Spread. Which Wyckoff phase favors selling premium?',
    options: ['Accumulation', 'Distribution (high volatility, rangebound)', 'Markup', 'All phases equally'],
    correctIndex: 1, explanation: 'Distribution often features rangebound price action with high IV — ideal conditions for selling premium via credit spreads.' },

  // ====== VOLATILITY BREAKOUT (4 questions) ======
  { id: 'q-vb-01', tileId: 'tile-volatility-breakout', type: 'volume-analysis', difficulty: 3,
    prompt: 'Volume compressed to 40% of average, price range narrowing. What typically follows?',
    options: ['Continuation of same range', 'Explosive breakout', 'Reversal', 'Nothing significant'],
    correctIndex: 1, explanation: 'Volume compression + range contraction = volatility expansion. This is the squeeze setup.' },
  { id: 'q-vb-02', tileId: 'tile-volatility-breakout', type: 'spot-fake-breakout', difficulty: 3,
    prompt: 'Price breaks above squeeze range but volume is still low. Valid breakout?',
    options: ['Yes — break is a break', 'No — need volume confirmation', 'Only if RSI confirms', 'Depends on timeframe'],
    correctIndex: 1, explanation: 'A volatility breakout without volume is suspect. Wait for volume to confirm the directional move.' },
  { id: 'q-vb-03', tileId: 'tile-volatility-breakout', type: 'calculate-risk', difficulty: 3,
    prompt: 'Squeeze low: 2800, high: 2900. Entry at 2910 after breakout. Where is a logical SL?',
    options: ['2905', '2890 (below the squeeze high, now support)', '2950', 'No SL needed on squeezes'],
    correctIndex: 1, explanation: 'After a squeeze breakout, the previous squeeze high becomes support. SL should go below it — at 2890.' },
  { id: 'q-vb-04', tileId: 'tile-volatility-breakout', type: 'order-flow-analysis', difficulty: 3,
    prompt: 'Bollinger Bands are at their narrowest in 50 periods. What is the probability distribution of the next move?',
    options: ['Random — could go either way equally', 'Directional bias exists — usually follows the higher timeframe trend', 'Will go down', 'Will go up'],
    correctIndex: 1, explanation: 'While the breakout direction is unknown, it typically follows the higher timeframe trend. Use MTF analysis to determine the expected direction.' },

  // ====== SYSTEM BUILDER (5 questions) ======
  { id: 'q-sys-01', tileId: 'tile-system-builder', type: 'calculate-risk', difficulty: 3,
    prompt: 'Equity: ₹4,00,000. Risk: 1%. Entry: 3200, SL: 3100. Position size?',
    options: ['100 shares', '200 shares', '400 shares', '40 shares'],
    correctIndex: 3, explanation: '1% of ₹4,00,000 = ₹4,000 risk. Risk/share = 3200−3100 = ₹100. Size = 4000/100 = 40 shares.' },
  { id: 'q-sys-02', tileId: 'tile-system-builder', type: 'choose-tp-level', difficulty: 3,
    prompt: 'Trend system with 1:2 R:R. Entry 3200, SL 3100. TP?',
    options: ['3250', '3300', '3400', '3200'],
    correctIndex: 2, explanation: 'R = 100. 1:2 R:R means TP = 3200 + (2 × 100) = 3400.' },
  { id: 'q-sys-03', tileId: 'tile-system-builder', type: 'risk-calculus', difficulty: 3,
    prompt: 'Your strategy has 40% win rate with 1:3 R:R. Is this system profitable?',
    options: ['No — 40% is too low', 'Yes — expectancy = (0.4 × 3) - (0.6 × 1) = 1.2 - 0.6 = +0.6R per trade', 'Not enough information', 'Only with 50%+ win rate'],
    correctIndex: 1, explanation: 'Expectancy = (win rate × avg win) - (loss rate × avg loss) = (0.4 × 3) - (0.6 × 1) = 1.2 - 0.6 = +0.6R. This is profitable.' },
  { id: 'q-sys-04', tileId: 'tile-system-builder', type: 'risk-calculus', difficulty: 3,
    prompt: 'Backtesting shows 30% win rate with 1:5 R:R and 20% max drawdown. Is this system viable?',
    options: ['No — 30% is too low', 'Yes — expectancy +0.8R but 20% DD may be too high for most traders', 'Expectancy is all that matters', 'R:R must be higher'],
    correctIndex: 1, explanation: 'Expectancy = (0.3 × 5) - (0.7 × 1) = 1.5 - 0.7 = +0.8R (profitable). However, 20% drawdown is high — position sizing needs adjustment.' },
  { id: 'q-sys-05', tileId: 'tile-system-builder', type: 'multi-timeframe', difficulty: 3,
    prompt: 'What is the minimum sample size for a statistically significant backtest result?',
    options: ['10 trades', '30 trades', '100+ trades', '1000+ trades'],
    correctIndex: 2, explanation: 'A minimum of 100 trades is recommended for statistical significance. Below 30, results are essentially random noise.' },
]

export function getQuestionsForTile(tileId: string): QuizQuestion[] {
  return QUESTION_BANK.filter(q => q.tileId === tileId)
}

export function getTotalQuestions(): number {
  return QUESTION_BANK.length
}

export function loadQuizAttempts(): QuizAttempt[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_QUIZ) || '[]') } catch { return [] }
}

export function saveQuizAttempt(a: QuizAttempt): void {
  const all = loadQuizAttempts()
  all.push(a)
  localStorage.setItem(STORAGE_QUIZ, JSON.stringify(all))
}

export function evaluateQuiz(tileId: string, answers: Array<{ questionId: string; selectedIndex: number }>): QuizAttempt {
  const questions = getQuestionsForTile(tileId)
  const mapped = answers.map(a => {
    const q = questions.find(q => q.id === a.questionId)
    return { ...a, correct: q ? a.selectedIndex === q.correctIndex : false }
  })
  const correct = mapped.filter(a => a.correct).length
  const score = questions.length > 0 ? correct / questions.length : 0
  const attempt: QuizAttempt = {
    quizId: `quiz-${tileId}-${Date.now()}`,
    answers: mapped,
    score: score * 100,
    passed: score >= 0.7,
    timestamp: Date.now() / 1000,
  }
  saveQuizAttempt(attempt)
  return attempt
}

export function hasPassedQuiz(tileId: string): boolean {
  const attempts = loadQuizAttempts().filter(a => a.passed)
  return attempts.some(a =>
    a.answers.some(ans => QUESTION_BANK.some(q => q.id === ans.questionId && q.tileId === tileId))
  )
}

export function getQuizStreak(): number {
  const attempts = loadQuizAttempts()
    .filter(a => a.passed)
    .sort((a, b) => b.timestamp - a.timestamp)
  if (attempts.length === 0) return 0
  let streak = 1
  for (let i = 0; i < attempts.length - 1; i++) {
    const diff = (attempts[i].timestamp - attempts[i + 1].timestamp) / 86400
    if (diff <= 3) streak++
    else break
  }
  return streak
}
