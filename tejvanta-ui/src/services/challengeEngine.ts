import { loadJournals } from './journalEngine'

const STORAGE = 'tj_challenges'

export interface ChallengeDef {
  id: string
  tileId: string
  name: string
  description: string
  rules: string[]
  minTrades: number
  minAverageR: number
  minWinRate: number
  maxMistakes: string[]
  requirePatternConfirm?: string
  requireJournaled?: boolean
  badge: string
  xp: number
}

export interface ChallengeProgress {
  challengeId: string
  status: 'not-started' | 'in-progress' | 'completed'
  eligibleTrades: number
  currentTrades: number
  currentWinRate: number
  currentAvgR: number
  startedAt: number
  completedAt?: number
}

export const CHALLENGES: ChallengeDef[] = [
  // ====== FOUNDATION CHALLENGES ======
  { id: 'ch-ema-1', tileId: 'tile-ema-pullback', name: 'Pullback Precision', description: 'Trade 5 EMA pullbacks with 1.5R+ average', rules: ['Entry must be within 0.5% of EMA20', 'SL must be below recent swing low', 'TP at minimum 1:1.5 risk-reward', 'Journal every trade'], minTrades: 5, minAverageR: 1.5, minWinRate: 0.4, maxMistakes: ['no-sl', 'tight-sl', 'fomo'], badge: 'Pullback Pro', xp: 50 },
  { id: 'ch-ema-2', tileId: 'tile-ema-pullback', name: 'EMA Master', description: 'Trade 10 EMA pullbacks with 70%+ win rate', rules: ['All requirements from Pullback Precision', 'Maintain discipline score above 70', 'No revenge trading'], minTrades: 10, minAverageR: 1.0, minWinRate: 0.7, maxMistakes: ['no-sl', 'revenge'], badge: 'EMA Master', xp: 100 },
  { id: 'ch-ema-3', tileId: 'tile-ema-pullback', name: 'Consecutive Pullback Perfection', description: 'Trade 5 EMA pullbacks in a row with no losing trade', rules: ['5 consecutive winning trades', 'Each trade must have R ≥ 1.0', 'Journal every trade with notes'], minTrades: 5, minAverageR: 1.0, minWinRate: 1.0, maxMistakes: ['fomo', 'no-sl'], badge: 'Pullback Streak', xp: 150 },

  { id: 'ch-rs-1', tileId: 'tile-rsi-mean-reversion', name: 'Reversion Catcher', description: 'Trade 5 RSI mean-reversion setups', rules: ['Entry when RSI < 30 or > 70', 'Wait for RSI to cross back', 'SL beyond the swing point'], minTrades: 5, minAverageR: 1.5, minWinRate: 0.5, maxMistakes: ['fomo', 'chase'], badge: 'Reversion Catcher', xp: 50 },
  { id: 'ch-rs-2', tileId: 'tile-rsi-mean-reversion', name: 'Divergence Hunter', description: 'Trade 3 RSI divergences (hidden or regular)', rules: ['Identify divergence visually', 'Entry after confirmation candle', 'Journal the divergence type'], minTrades: 3, minAverageR: 2.0, minWinRate: 0.6, maxMistakes: ['fomo', 'no-confirmation'], badge: 'Divergence Hunter', xp: 100 },

  { id: 'ch-brk-1', tileId: 'tile-simple-breakout', name: 'Breakout Hunter', description: 'Trade 5 breakouts with correct identification', rules: ['Close above resistance', 'Volume confirmation', 'Journal each trade'], minTrades: 5, minAverageR: 2.0, minWinRate: 0.5, maxMistakes: ['fomo', 'chase'], badge: 'Breakout Hunter', xp: 50 },
  { id: 'ch-brk-2', tileId: 'tile-simple-breakout', name: 'Breakout Specialist', description: 'Trade 8 breakouts with 65%+ win rate', rules: ['All from Breakout Hunter rules', 'Minimum 1:2 R:R average', 'No chasing'], minTrades: 8, minAverageR: 2.0, minWinRate: 0.65, maxMistakes: ['fomo', 'chase', 'no-confirmation'], badge: 'Breakout Specialist', xp: 100 },
  { id: 'ch-brk-3', tileId: 'tile-simple-breakout', name: 'Fakeout Spotter', description: 'Trade 3 false breakouts correctly (identify and avoid)', rules: ['Identify a false breakout', 'Do NOT enter', 'Journal why it was false', 'Must correctly identify the follow-through direction'], minTrades: 3, minAverageR: 0, minWinRate: 0.5, maxMistakes: ['fomo', 'chase'], badge: 'Fakeout Spotter', xp: 75 },

  // ====== INTERMEDIATE CHALLENGES ======
  { id: 'ch-brk-rt-1', tileId: 'tile-breakout-retest', name: 'Retest Specialist', description: 'Trade 5 breakout-retest setups with confirmation candle', rules: ['Wait for retest after breakout', 'Confirmation candle required', 'Journal each trade'], minTrades: 5, minAverageR: 2.5, minWinRate: 0.6, maxMistakes: ['fomo', 'no-confirmation', 'chase'], badge: 'Retest Specialist', xp: 75 },
  { id: 'ch-brk-rt-2', tileId: 'tile-breakout-retest', name: 'Retest Elite', description: 'Trade 8 breakout-retest with 70%+ win rate', rules: ['All retest rules apply', 'Journal the order flow at retest', 'Note whether retest was shallow or deep'], minTrades: 8, minAverageR: 2.5, minWinRate: 0.7, maxMistakes: ['fomo', 'no-confirmation'], badge: 'Retest Elite', xp: 125 },

  { id: 'ch-flag-1', tileId: 'tile-flag-breakout', name: 'Flag Spotter', description: 'Trade 3 flag patterns with correct entry', rules: ['Identify flag structure correctly', 'Break above trendline required', 'Volume confirmation needed'], minTrades: 3, minAverageR: 2.0, minWinRate: 0.5, maxMistakes: ['fomo', 'no-confirmation'], requirePatternConfirm: 'flag', badge: 'Flag Spotter', xp: 50 },
  { id: 'ch-flag-2', tileId: 'tile-flag-breakout', name: 'Flagpole Measurer', description: 'Trade 5 flags using measured move targets', rules: ['Calculate flagpole height', 'Set TP using measured move', 'Journal target calculation'], minTrades: 5, minAverageR: 2.5, minWinRate: 0.6, maxMistakes: ['fomo', 'tight-sl'], requirePatternConfirm: 'flag', badge: 'Flagpole Master', xp: 100 },
  { id: 'ch-flag-3', tileId: 'tile-flag-breakout', name: 'Flags Across Timeframes', description: 'Trade flags on 3 different timeframes', rules: ['One flag on 5m timeframe', 'One flag on 15m timeframe', 'One flag on 1h timeframe', 'All must have proper entry'], minTrades: 3, minAverageR: 2.0, minWinRate: 0.5, maxMistakes: ['fomo', 'no-confirmation'], requirePatternConfirm: 'flag', badge: 'Multi-TF Flag Trader', xp: 100 },

  { id: 'ch-pen-1', tileId: 'tile-pennant-breakout', name: 'Pennant Pro', description: 'Trade 3 pennant patterns with volume confirm', rules: ['Identify pennant structure correctly', 'Break with 2x volume', 'Journal each trade'], minTrades: 3, minAverageR: 2.5, minWinRate: 0.6, maxMistakes: ['fomo', 'no-confirmation'], requirePatternConfirm: 'pennant', badge: 'Pennant Pro', xp: 75 },
  { id: 'ch-pen-2', tileId: 'tile-pennant-breakout', name: 'Symmetrical Triangle Expert', description: 'Trade 6 pennant patterns with 70%+ win rate', rules: ['Must correctly classify as pennant vs wedge', 'Volume expansion required on break', 'Journal the breakout angle'], minTrades: 6, minAverageR: 2.5, minWinRate: 0.7, maxMistakes: ['fomo', 'no-confirmation', 'chase'], requirePatternConfirm: 'pennant', badge: 'Triangle Expert', xp: 125 },

  // ====== ADVANCED CHALLENGES ======
  { id: 'ch-rev-1', tileId: 'tile-m-pattern-reversal', name: 'Reversal Catcher', description: 'Trade 2 M-pattern and 2 W-pattern reversals with proper SL', rules: ['Identify double top/bottom structure', 'SL beyond the pattern extreme', 'Volume confirmation on breakout'], minTrades: 4, minAverageR: 2.0, minWinRate: 0.5, maxMistakes: ['no-sl', 'tight-sl', 'early-exit'], badge: 'Reversal Catcher', xp: 75 },
  { id: 'ch-rev-2', tileId: 'tile-m-pattern-reversal', name: 'Pattern Measurer', description: 'Trade 5 reversals using measured move targets', rules: ['Calculate pattern height', 'Set TP using measured move formula', 'Journal calculation and result'], minTrades: 5, minAverageR: 2.5, minWinRate: 0.6, maxMistakes: ['no-sl', 'tight-sl'], badge: 'Measured Move Pro', xp: 100 },
  { id: 'ch-rev-3', tileId: 'tile-m-pattern-reversal', name: 'Complex Reversal Master', description: 'Trade 3 complex reversals (triple top/bottom, head & shoulders)', rules: ['Identify complex reversal pattern', 'SL beyond structure extreme', 'TP using measured move', 'Journal the structure type'], minTrades: 3, minAverageR: 3.0, minWinRate: 0.5, maxMistakes: ['no-sl', 'early-exit'], badge: 'Complex Reversal Master', xp: 150 },

  { id: 'ch-mtf-1', tileId: 'tile-mtf-confluence', name: 'MTF Master', description: 'Trade 5 setups aligned across 2+ timeframes', rules: ['Daily/weekly trend determines bias', 'Entry on 15m or lower', 'Both TFs must align', 'Journal TF analysis'], minTrades: 5, minAverageR: 2.0, minWinRate: 0.6, maxMistakes: ['fomo', 'no-confirmation'], badge: 'MTF Master', xp: 75 },
  { id: 'ch-mtf-2', tileId: 'tile-mtf-confluence', name: 'MTF Contrarian', description: 'Trade 3 counter-trend setups aligned across timeframes', rules: ['Higher TF trend is your bias', 'Entry against lower TF momentum', 'Tighter SL required'], minTrades: 3, minAverageR: 3.0, minWinRate: 0.5, maxMistakes: ['fomo', 'no-sl'], badge: 'MTF Contrarian', xp: 125 },
  { id: 'ch-mtf-3', tileId: 'tile-mtf-confluence', name: 'Wyckoff MTF Analyst', description: 'Identify Wyckoff phase alignment across 3 timeframes and trade', rules: ['Identify phase on weekly, daily, and 1h', 'Trade only when all 3 align', 'Journal the phase analysis'], minTrades: 3, minAverageR: 2.5, minWinRate: 0.6, maxMistakes: ['fomo'], requirePatternConfirm: 'liquidity-shock', badge: 'Wyckoff Analyst', xp: 150 },

  { id: 'ch-vol-1', tileId: 'tile-volatility-breakout', name: 'Vol Squeeze Trader', description: 'Trade 3 volatility squeeze breakouts', rules: ['Volume compression below 50% of average', 'Bollinger Bands at narrowest', 'Breakout with volume confirmation'], minTrades: 3, minAverageR: 3.0, minWinRate: 0.5, maxMistakes: ['fomo', 'chase'], requirePatternConfirm: 'volume-compression', badge: 'Vol Squeeze Pro', xp: 100 },
  { id: 'ch-vol-2', tileId: 'tile-volatility-breakout', name: 'Squeeze Direction Expert', description: 'Trade 3 squeezes with MTF direction bias', rules: ['Higher TF determines direction bias', 'Enter only when squeeze aligns with HTF trend', 'Journal TF analysis'], minTrades: 3, minAverageR: 3.0, minWinRate: 0.6, maxMistakes: ['fomo', 'chase', 'no-sl'], requirePatternConfirm: 'volume-compression', badge: 'Squeeze Direction Pro', xp: 125 },
  { id: 'ch-vol-3', tileId: 'tile-volatility-breakout', name: 'IV Contraction Trader', description: 'Trade 5 volatility events with proper risk management', rules: ['Use the squeeze as entry signal', 'Position size at 0.5x normal (high uncertainty)', 'Trail SL after 1:1 R:R'], minTrades: 5, minAverageR: 3.5, minWinRate: 0.5, maxMistakes: ['oversized', 'no-sl', 'tight-sl'], requirePatternConfirm: 'volume-compression', badge: 'IV Contraction Pro', xp: 175 },

  // ====== MASTER CHALLENGES ======
  { id: 'ch-sys-1', tileId: 'tile-system-builder', name: 'System Architect', description: 'Build and backtest a custom strategy with 60%+ win rate', rules: ['Define clear entry/exit rules in PineScript', 'Backtest on at least 30 replay sessions', 'Win rate above 60%', 'Max drawdown below 15%'], minTrades: 20, minAverageR: 1.5, minWinRate: 0.6, maxMistakes: [], badge: 'System Architect', xp: 200 },
  { id: 'ch-sys-2', tileId: 'tile-system-builder', name: 'System Optimizer', description: 'Optimize your strategy for different market phases', rules: ['Test strategy in accumulation, manipulation, distribution phases', 'Adjust parameters per phase', 'Document which phase your strategy works best in'], minTrades: 30, minAverageR: 1.5, minWinRate: 0.55, maxMistakes: [], badge: 'System Optimizer', xp: 250 },
  { id: 'ch-sys-3', tileId: 'tile-system-builder', name: 'Portfolio Builder', description: 'Build a portfolio of 3 uncorrelated strategies', rules: ['Strategy 1: Trend following', 'Strategy 2: Mean reversion', 'Strategy 3: Breakout', 'Each must be profitable independently'], minTrades: 50, minAverageR: 1.2, minWinRate: 0.5, maxMistakes: [], badge: 'Portfolio Architect', xp: 500 },
]

export function loadChallengeProgress(): Record<string, ChallengeProgress> {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} }
}

export function saveChallengeProgress(p: Record<string, ChallengeProgress>): void {
  localStorage.setItem(STORAGE, JSON.stringify(p))
}

export function evaluateChallenge(challengeId: string): ChallengeProgress {
  const def = CHALLENGES.find(c => c.id === challengeId)
  if (!def) throw new Error(`Challenge ${challengeId} not found`)
  const all = loadChallengeProgress()
  let prog = all[challengeId]
  if (!prog) {
    prog = { challengeId, status: 'not-started', eligibleTrades: 0, currentTrades: 0, currentWinRate: 0, currentAvgR: 0, startedAt: 0 }
  }

  const journals = loadJournals()
  const eligible = journals.filter(j =>
    j.strategyTags.some(s => s.includes(def.tileId.replace('tile-', ''))) &&
    !j.mistakeTags.some(m => def.maxMistakes.includes(m)) &&
    (def.requireJournaled ? (j.notes && j.notes.length > 5) : true)
  )

  const patternFiltered = def.requirePatternConfirm
    ? eligible.filter(j => j.patternType === def.requirePatternConfirm)
    : eligible

  const wins = patternFiltered.filter(j => j.pnl > 0)
  const avgR = patternFiltered.length > 0 ? patternFiltered.reduce((s, j) => s + j.rMultiple, 0) / patternFiltered.length : 0
  const winRate = patternFiltered.length > 0 ? wins.length / patternFiltered.length : 0

  prog.status = patternFiltered.length > 0 ? 'in-progress' : 'not-started'
  prog.eligibleTrades = patternFiltered.length
  prog.currentTrades = patternFiltered.length
  prog.currentWinRate = winRate
  prog.currentAvgR = avgR
  if (!prog.startedAt) prog.startedAt = Date.now() / 1000

  if (patternFiltered.length >= def.minTrades && avgR >= def.minAverageR && winRate >= def.minWinRate) {
    prog.status = 'completed'
    prog.completedAt = Date.now() / 1000
  }

  all[challengeId] = prog
  saveChallengeProgress(all)
  return prog
}

export function getChallengesForTile(tileId: string): ChallengeDef[] {
  return CHALLENGES.filter(c => c.tileId === tileId)
}

export function getTotalXPEarned(): number {
  const all = loadChallengeProgress()
  let total = 0
  for (const [id, prog] of Object.entries(all)) {
    if (prog.status === 'completed') {
      const def = CHALLENGES.find(c => c.id === id)
      if (def) total += def.xp
    }
  }
  return total
}

export function getOverallChallengeProgress(): { completed: number; total: number; xp: number } {
  const all = loadChallengeProgress()
  const completed = Object.values(all).filter(p => p.status === 'completed').length
  return { completed, total: CHALLENGES.length, xp: getTotalXPEarned() }
}
