# Tejvanta Learning Module — Complete Architecture

---

## 1) SKILL PROGRESSION SYSTEM

### 1.1 Progression Map

```
FOUNDATION (Beginner)        ──►  PATTERN & BREAKOUT (Int.)  ──►  PROFESSIONAL (Adv.)  ──►  SYSTEM BUILDER (Master)
  3 tiles required                   4 tiles required                All adv. tiles            All master tiles
  3 replays                          4 replays                       + custom strategy         + backtested system
  5 journal entries                  10 journal entries              5 challenges              + 10 challenges
  Discipline ≥ 60                    Pattern acc ≥ 70%               Discipline ≥ 70           Discipline ≥ 80
                                                                     Drawdown ≤ 15%            Drawdown ≤ 10%
```

### 1.2 Data Model

```typescript
// Persistent per user
interface SkillState {
  userId: string // "default"
  level: 'foundation' | 'intermediate' | 'advanced' | 'master'
  unlockedLevels: Array<'foundation' | 'intermediate' | 'advanced' | 'master'>
  nodes: Record<string, ProgressNode>
  completedAt: Record<string, number> // epoch seconds
  unlockedAt: Record<string, number>
}

interface ProgressNode {
  id: string                  // e.g. "foundation-01", "int-pattern-03"
  type: 'strategy-tile' | 'replay' | 'challenge' | 'quiz' | 'custom-strategy'
  status: 'locked' | 'available' | 'in-progress' | 'completed'
  progress: number            // 0-100
  prerequisites: string[]     // node IDs that must be completed first
  requirement: {
    tileIds?: string[]
    replayIds?: string[]
    minJournalEntries?: number
    minDisciplineScore?: number
    minPatternAccuracy?: number
    minDrawdown?: number
    challengeIds?: string[]
    quizIds?: string[]
    requireCustomStrategy?: boolean
    requireBacktest?: boolean
  }
}
```

### 1.3 Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  [FOUNDATION] ●─●─●─●    [INTERMEDIATE] ◎─○─○─○    │
│  3/3 tiles  ✓ 3 replays     1/4 tiles  0 replays    │
│  ═══════════════ 100%        ════ 25%               │
│                                                      │
│  [PROFESSIONAL] ○─○─○─○    [MASTER] ○─○─○─○         │
│  0/4 tiles  0 replays       0/2 tiles  0 replays     │
│  LOCKED ▒▒▒▒▒▒▒▒▒▒          LOCKED ▒▒▒▒▒▒▒▒▒▒       │
└─────────────────────────────────────────────────────┘
```

- Each level is a horizontal card with node circles (filled = completed, half = in-progress, empty = locked)
- Progress bar per level
- Unlock condition summary below each locked level

### 1.4 LocalStorage Persistence

```typescript
const STORAGE_KEY = 'tj_skill_state'

function loadSkillState(): SkillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultSkillState()
  } catch { return defaultSkillState() }
}

function saveSkillState(state: SkillState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function defaultSkillState(): SkillState {
  return {
    userId: 'default',
    level: 'foundation',
    unlockedLevels: ['foundation'],
    nodes: {},
    completedAt: {},
    unlockedAt: { foundation: Date.now() / 1000 },
  }
}
```

### 1.5 Update Rules

- When a tile, replay, challenge, or quiz completes → `checkProgression()`
- `checkProgression()` evaluates unlock conditions for the next level
- If conditions met → push to `unlockedLevels`, set `unlockedAt`, show celebration modal

---

## 2) MODULE COMPLETION TRACKING

### 2.1 Tile State Machine

```
NOT_STARTED ──► IN_PROGRESS ──► COMPLETED
                  │
                  │ (first replay or practice trade)
                  ▼
              available
```

```typescript
type TileStatus = 'not-started' | 'in-progress' | 'completed'

interface TileProgress {
  tileId: string                    // matches strategy tile ID from trainingEngine
  status: TileStatus
  practiceTrades: number
  replaySessions: number
  journalEntries: number
  quizzesPassed: number
  challengesCompleted: number
  lastActivity: number              // epoch seconds
  startedAt: number
  completedAt?: number
}

const TILE_COMPLETION_CRITERIA: Record<string, {
  minPracticeTrades: number
  minReplaySessions: number
  minJournalEntries: number
  minQuizzesPassed: number
  challengesRequired: string[]
}> = {
  'tile-ema-pullback': {
    minPracticeTrades: 5,
    minReplaySessions: 2,
    minJournalEntries: 3,
    minQuizzesPassed: 2,
    challengesRequired: ['ch-ema-pullback-1'],
  },
  'tile-simple-breakout': {
    minPracticeTrades: 5,
    minReplaySessions: 2,
    minJournalEntries: 3,
    minQuizzesPassed: 2,
    challengesRequired: ['ch-breakout-1'],
  },
  // ... each tile has its own criteria
}
```

### 2.2 Completion Criteria JSON

```typescript
const tileCompletionCriteria: Record<string, CompletionCriterion> = {
  'tile-ema-pullback': {
    practiceTrades: { min: 5, label: 'Practice Trades' },
    replaySessions: { min: 2, label: 'Replay Sessions' },
    journalEntries: { min: 3, label: 'Journal Entries' },
    quizzesPassed: { min: 2, label: 'Quizzes Passed' },
    disciplineScore: { min: 60, label: 'Discipline Score' },
  },
  'tile-rsi-mean-reversion': {
    practiceTrades: { min: 5 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 60 },
  },
  'tile-simple-breakout': {
    practiceTrades: { min: 8 },
    replaySessions: { min: 3 },
    journalEntries: { min: 4 },
    quizzesPassed: { min: 3 },
    disciplineScore: { min: 65 },
  },
  'tile-breakout-retest': {
    practiceTrades: { min: 8 },
    replaySessions: { min: 3 },
    journalEntries: { min: 4 },
    quizzesPassed: { min: 3 },
    disciplineScore: { min: 65 },
  },
  'tile-mtf-confluence': {
    practiceTrades: { min: 10 },
    replaySessions: { min: 3 },
    journalEntries: { min: 5 },
    quizzesPassed: { min: 3 },
    disciplineScore: { min: 70 },
  },
  'tile-flag-breakout': {
    practiceTrades: { min: 6 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 65 },
  },
  'tile-pennant-breakout': {
    practiceTrades: { min: 6 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 65 },
  },
  'tile-m-pattern-reversal': {
    practiceTrades: { min: 6 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 65 },
  },
  'tile-w-pattern-reversal': {
    practiceTrades: { min: 6 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 65 },
  },
  'tile-options-directional': {
    practiceTrades: { min: 5 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 60 },
  },
  'tile-options-spread': {
    practiceTrades: { min: 5 },
    replaySessions: { min: 2 },
    journalEntries: { min: 3 },
    quizzesPassed: { min: 2 },
    disciplineScore: { min: 60 },
  },
  'tile-volatility-breakout': {
    practiceTrades: { min: 8 },
    replaySessions: { min: 3 },
    journalEntries: { min: 4 },
    quizzesPassed: { min: 3 },
    disciplineScore: { min: 70 },
  },
  'tile-system-builder': {
    practiceTrades: { min: 20 },
    replaySessions: { min: 5 },
    journalEntries: { min: 10 },
    quizzesPassed: { min: 4 },
    disciplineScore: { min: 75 },
  },
}
```

### 2.3 UI Indicators

```
┌──────────────────────────────────────────────────────┐
│  [Tile Title]                  [✓  COMPLETED]        │
│  ━━━━━━▒▒▒▒▒ 60%                                    │
│  ●●●○○○○○○○ 5/8 practice trades                     │
│  ●●●○○○○○○○ 3/3 replay sessions                     │
│  ●●●○○○○○○○ 3/4 journal entries     [► Resume]     │
└──────────────────────────────────────────────────────┘
```

- Status badge: green ✓ / yellow ⏳ / gray ◻
- Progress bar per tile (filled fraction of all criteria)
- Per-criterion check marks with counters
- "Resume" CTA button when in-progress
- "Review" button when completed

### 2.4 Progress Bar Logic

```typescript
function getTileProgress(tileId: string, progress: TileProgress): number {
  const criteria = tileCompletionCriteria[tileId]
  if (!criteria) return 0

  const checks = [
    progress.practiceTrades / criteria.practiceTrades.min,
    progress.replaySessions / criteria.replaySessions.min,
    progress.journalEntries / criteria.journalEntries.min,
    progress.quizzesPassed / criteria.quizzesPassed.min,
  ]
  const capped = checks.map(v => Math.min(v, 1))
  const overall = capped.reduce((a, b) => a + b, 0) / capped.length
  return Math.round(overall * 100)
}

function isTileCompleted(tileId: string, progress: TileProgress): boolean {
  const c = tileCompletionCriteria[tileId]
  if (!c) return false
  return (
    progress.practiceTrades >= c.practiceTrades.min &&
    progress.replaySessions >= c.replaySessions.min &&
    progress.journalEntries >= c.journalEntries.min &&
    progress.quizzesPassed >= c.quizzesPassed.min &&
    (progress.disciplineScore ?? 0) >= c.disciplineScore.min
  )
}
```

---

## 3) MICRO-ASSESSMENTS (QUIZZES)

### 3.1 Question Types

```typescript
type QuestionType =
  | 'identify-pattern'          // "Which pattern is this?" from chart snippet data
  | 'choose-sl-placement'       // "Where should SL go?" multiple choice with price levels
  | 'choose-entry-candle'       // "Which candle is the correct entry?" candle index
  | 'spot-fake-breakout'        // "Is this a fake breakout?" yes/no
  | 'spot-trend-vs-chop'        // "Is this trending or choppy?" multiple choice
  | 'calculate-risk'            // "What is the R multiple?" numeric entry
  | 'choose-tp-level'           // "Where should TP go?" multiple choice
  | 'order-flow-analysis'       // "What does this order flow indicate?" multiple choice
  | 'phase-identification'      // "Which Wyckoff phase is this?" multiple choice
  | 'volume-analysis'           // "What does this volume pattern suggest?" multiple choice
```

### 3.2 Question Bank JSON

```typescript
interface QuizQuestion {
  id: string
  tileId: string
  type: QuestionType
  difficulty: 1 | 2 | 3
  prompt: string
  chartData?: number[][]   // optional: OHLC data for chart preview
  options?: string[]       // for multiple choice
  correctIndex?: number    // index into options
  correctValue?: number    // for numeric answers
  explanation: string
  relatedPattern?: string  // link to pattern engine
}

const questionBank: QuizQuestion[] = [
  // Foundation Level
  {
    id: 'q-ema-pullback-01',
    tileId: 'tile-ema-pullback',
    type: 'identify-pattern',
    difficulty: 1,
    prompt: 'The price just touched the EMA20 and reversed. Is this a valid pullback entry?',
    options: ['Yes, price respected EMA and reversed with momentum', 'No, need to wait for next candle close', 'Only if RSI > 70', 'Not enough information'],
    correctIndex: 0,
    explanation: 'A valid EMA pullback shows price touching the EMA and immediately reversing with increasing volume.',
    chartData: [[/* O,H,L,C data for 30 candles */]],
    relatedPattern: 'ema-pullback',
  },
  {
    id: 'q-ema-pullback-02',
    tileId: 'tile-ema-pullback',
    type: 'choose-sl-placement',
    difficulty: 1,
    prompt: 'Entry at 2850. Which SL placement is correct for an EMA pullback?',
    options: ['2848 (2 pts below entry)', '2820 (below recent swing low)', '2855 (above entry)', 'No SL needed on pullbacks'],
    correctIndex: 1,
    explanation: 'SL should go below the most recent swing low, not just below entry. This gives the trade room to breathe.',
    relatedPattern: 'ema-pullback',
  },
  {
    id: 'q-ema-pullback-03',
    tileId: 'tile-ema-pullback',
    type: 'spot-trend-vs-chop',
    difficulty: 1,
    prompt: 'Price is oscillating around EMA20 with no clear direction. Is this a pullback setup?',
    options: ['Yes, EMA is being tested', 'No, this is sideways/chop with no trend', 'Only on the 3rd touch', 'Wait for RSI divergence'],
    correctIndex: 1,
    explanation: 'Pullback strategy requires a clear uptrend first. Oscillating around EMA in chop is not a valid setup — wait for trend to establish.',
  },

  // Intermediate Level
  {
    id: 'q-flag-breakout-01',
    tileId: 'tile-flag-breakout',
    type: 'identify-pattern',
    difficulty: 2,
    prompt: 'A sharp rally is followed by a downward-sloping consolidation. What pattern is this?',
    options: ['Pennant (triangle)', 'Flag (parallel channel)', 'Double Top', 'Volume Compression'],
    correctIndex: 1,
    explanation: 'A flag is characterized by a sharp move (flagpole) followed by a parallel downward-sloping consolidation channel.',
    chartData: [[/* flag pattern OHLC */]],
    relatedPattern: 'flag',
  },
  {
    id: 'q-flag-breakout-02',
    tileId: 'tile-flag-breakout',
    type: 'choose-entry-candle',
    difficulty: 2,
    prompt: 'The flag channel has formed. Which candle is the correct entry?',
    options: ['As soon as price enters the flag', 'When price breaks above the flag upper trendline with volume', 'At the bottom of the flag', 'When RSI overshoots'],
    correctIndex: 1,
    explanation: 'Wait for a confirmed break above the flag upper trendline with increased volume. Premature entry inside the flag risks a false break.',
    relatedPattern: 'flag',
  },
  {
    id: 'q-flag-breakout-03',
    tileId: 'tile-flag-breakout',
    type: 'spot-fake-breakout',
    difficulty: 2,
    prompt: 'Price breaks above the flag but closes back inside. Is this a valid breakout?',
    options: ['Yes, any break counts', 'No, this is a fake breakout / failure', 'Only if next candle also breaks', 'It depends on volume'],
    correctIndex: 1,
    explanation: 'A valid breakout requires the candle to CLOSE above the flag structure. A close back inside signals a false breakout.',
    relatedPattern: 'flag',
  },

  // Professional Level
  {
    id: 'q-mtf-confluence-01',
    tileId: 'tile-mtf-confluence',
    type: 'phase-identification',
    difficulty: 3,
    prompt: 'On the 15m chart, price is in accumulation. On the 1h, it is in manipulation. What does this suggest?',
    options: ['Conflict — wait for alignment', 'Strong buy signal on 15m', 'Sell signal on 1h', 'Ignore lower timeframe'],
    correctIndex: 0,
    explanation: 'When timeframes disagree, wait for alignment. The 1h manipulation could break the 15m accumulation structure.',
    relatedPattern: 'mtf-confluence',
  },
  {
    id: 'q-mtf-confluence-02',
    tileId: 'tile-mtf-confluence',
    type: 'order-flow-analysis',
    difficulty: 3,
    prompt: 'Lower timeframe shows aggressive buying but higher timeframe shows distribution. What should you do?',
    options: ['Take the buy signal', 'Wait — lower TF buying could be distribution trap', 'Enter half position', 'Sell against the buying'],
    correctIndex: 1,
    explanation: 'When lower TF buying aligns with higher TF distribution, it is often a trap to lure late buyers before a breakdown.',
  },
  {
    id: 'q-volatility-breakout-01',
    tileId: 'tile-volatility-breakout',
    type: 'volume-analysis',
    difficulty: 3,
    prompt: 'Volume is compressing to 40% of average. Price range is narrowing. What does this typically precede?',
    options: ['Continuation of same range', 'An explosive breakout', 'Reversal to trend', 'Nothing significant'],
    correctIndex: 1,
    explanation: 'Volume compression + range contraction = volatility expansion. This is the squeeze setup for an explosive breakout.',
    relatedPattern: 'volume-compression',
  },

  // Master Level
  {
    id: 'q-system-builder-01',
    tileId: 'tile-system-builder',
    type: 'calculate-risk',
    difficulty: 3,
    prompt: 'Account equity: ₹4,00,000. Risk per trade: 1%. Entry: 3200, SL: 3100. What is the correct position size?',
    options: ['100 shares', '200 shares', '400 shares', '40 shares'],
    correctIndex: 2,
    explanation: '1% of ₹4,00,000 = ₹4,000 risk. Risk per share = 3200 − 3100 = ₹100. Position size = 4000/100 = 40 shares.',
  },
  {
    id: 'q-system-builder-02',
    tileId: 'tile-system-builder',
    type: 'choose-tp-level',
    difficulty: 3,
    prompt: 'In a trend-following system with 1:2 R:R, entry at 3200, SL at 3100. Where is the TP?',
    options: ['3250', '3300', '3400', '3200'],
    correctIndex: 2,
    explanation: 'R = 3200 − 3100 = 100. 1:2 R:R means TP is 2×100 = 200 pts above entry. 3200 + 200 = 3400.',
  },
]
```

### 3.3 Scoring Model

```typescript
interface QuizAttempt {
  quizId: string
  answers: Array<{
    questionId: string
    selectedIndex: number
    correct: boolean
    timeSpent: number // seconds
  }>
  score: number      // percentage 0-100
  passed: boolean    // score >= passingThreshold
  timestamp: number
}

const QUIZ_PASSING_THRESHOLD = 0.7  // 70%

function evaluateQuiz(attempt: Omit<QuizAttempt, 'score' | 'passed'>): QuizAttempt {
  const questions = questionBank.filter(q => attempt.answers.some(a => a.questionId === q.id))
  const correct = attempt.answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId)
    if (!q) return false
    if (q.correctIndex !== undefined) return a.selectedIndex === q.correctIndex
    return false
  }).length
  const score = questions.length > 0 ? correct / questions.length : 0
  return {
    ...attempt,
    score: score * 100,
    passed: score >= QUIZ_PASSING_THRESHOLD,
    timestamp: Date.now() / 1000,
  }
}
```

### 3.4 Passing Criteria

- Quiz passes when score ≥ 70%
- Failed quizzes can be retaken (infinite attempts, no penalty)
- Each retake logs a new `QuizAttempt` — analytics track improvement
- Quiz must be passed to mark tile as "completed"

### 3.5 UI Component

```
┌────────────────────────────────────────────┐
│  Quiz: EMA Pullback Fundamentals  [2/5]    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  [CANDLESTICK CHART PREVIEW]        │    │
│  │                                     │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Price just touched EMA20 and reversed.    │
│  Is this a valid pullback entry?           │
│                                            │
│  ○ Yes, price respected EMA                │
│  ● No, wait for next candle close          │
│  ○ Only if RSI > 70                        │
│  ○ Not enough information                  │
│                                            │
│  [< PREV]                        [NEXT >]  │
└────────────────────────────────────────────┘
```

---

## 4) STRATEGY CHALLENGES

### 4.1 Challenge Definitions

```typescript
interface StrategyChallenge {
  id: string
  tileId: string
  name: string
  description: string
  rules: string[]
  conditions: {
    minTrades: number
    minAverageR: number            // R multiple
    minWinRate: number             // 0-1
    requireJournaling: boolean
    maxMistakes: string[]          // mistake tags that disqualify
    requirePatternConfirm?: string  // pattern engine detection id
    disciplineMin?: number
  }
  reward: {
    label: string                  // e.g. "Pullback Pro Badge"
    xpPoints?: number
  }
}

const challenges: StrategyChallenge[] = [
  {
    id: 'ch-ema-pullback-1',
    tileId: 'tile-ema-pullback',
    name: 'Pullback Precision',
    description: 'Trade 5 EMA pullbacks with minimum 1.5R average',
    rules: [
      'Entry must be within 0.5% of EMA20',
      'SL must be below recent swing low',
      'TP at minimum 1:1.5 risk-reward',
      'Journal every trade with emotion and mistake tags',
    ],
    conditions: {
      minTrades: 5,
      minAverageR: 1.5,
      minWinRate: 0.4,
      requireJournaling: true,
      maxMistakes: ['no-sl', 'tight-sl', 'fomo'],
    },
    reward: { label: 'Pullback Pro Badge', xpPoints: 50 },
  },
  {
    id: 'ch-ema-pullback-2',
    tileId: 'tile-ema-pullback',
    name: 'EMA Master',
    description: 'Trade 10 EMA pullbacks with 70%+ win rate',
    conditions: {
      minTrades: 10,
      minAverageR: 1.0,
      minWinRate: 0.7,
      requireJournaling: true,
      maxMistakes: ['no-sl', 'revenge'],
    },
    reward: { label: 'EMA Master Badge', xpPoints: 100 },
  },
  {
    id: 'ch-breakout-1',
    tileId: 'tile-simple-breakout',
    name: 'Breakout Hunter',
    description: 'Trade 5 breakouts with correct retest identification',
    conditions: {
      minTrades: 5,
      minAverageR: 2.0,
      minWinRate: 0.5,
      requireJournaling: true,
      maxMistakes: ['fomo', 'chase'],
    },
    reward: { label: 'Breakout Hunter Badge', xpPoints: 50 },
  },
  {
    id: 'ch-breakout-retest-1',
    tileId: 'tile-breakout-retest',
    name: 'Retest Specialist',
    description: 'Trade 5 breakout-retest setups, all with proper confirmation candle',
    conditions: {
      minTrades: 5,
      minAverageR: 2.5,
      minWinRate: 0.6,
      requireJournaling: true,
      maxMistakes: ['fomo', 'no-confirmation', 'chase'],
    },
    reward: { label: 'Retest Specialist Badge', xpPoints: 75 },
  },
  {
    id: 'ch-flag-breakout-1',
    tileId: 'tile-flag-breakout',
    name: 'Flag Spotter',
    description: 'Trade 3 flag patterns with correct retest entry',
    conditions: {
      minTrades: 3,
      minAverageR: 2.0,
      minWinRate: 0.5,
      requireJournaling: true,
      maxMistakes: ['fomo', 'no-confirmation'],
      requirePatternConfirm: 'flag',
    },
    reward: { label: 'Flag Spotter Badge', xpPoints: 50 },
  },
  {
    id: 'ch-flag-breakout-2',
    tileId: 'tile-flag-breakout',
    name: 'Pennant Pro',
    description: 'Trade 3 pennant patterns with volume confirmation',
    conditions: {
      minTrades: 3,
      minAverageR: 2.5,
      minWinRate: 0.6,
      requireJournaling: true,
      maxMistakes: ['fomo', 'no-confirmation'],
      requirePatternConfirm: 'pennant',
    },
    reward: { label: 'Pennant Pro Badge', xpPoints: 50 },
  },
  {
    id: 'ch-m-w-pattern-1',
    tileId: 'tile-m-pattern-reversal',
    name: 'Reversal Catcher',
    description: 'Trade 2 M-pattern and 2 W-pattern reversals with proper SL',
    conditions: {
      minTrades: 4,
      minAverageR: 2.0,
      minWinRate: 0.5,
      requireJournaling: true,
      maxMistakes: ['no-sl', 'tight-sl', 'early-exit'],
    },
    reward: { label: 'Reversal Catcher Badge', xpPoints: 75 },
  },
  {
    id: 'ch-mtf-1',
    tileId: 'tile-mtf-confluence',
    name: 'Multi-Timeframe Master',
    description: 'Trade 5 setups with alignment across 2+ timeframes',
    conditions: {
      minTrades: 5,
      minAverageR: 2.0,
      minWinRate: 0.6,
      requireJournaling: true,
      maxMistakes: ['fomo', 'no-confirmation'],
    },
    reward: { label: 'MTF Master Badge', xpPoints: 100 },
  },
  {
    id: 'ch-volatility-1',
    tileId: 'tile-volatility-breakout',
    name: 'Vol Squeeze Trader',
    description: 'Trade 3 volatility squeeze breakouts',
    conditions: {
      minTrades: 3,
      minAverageR: 3.0,
      minWinRate: 0.5,
      requireJournaling: true,
      maxMistakes: ['fomo', 'chase'],
      requirePatternConfirm: 'volume-compression',
    },
    reward: { label: 'Vol Squeeze Pro Badge', xpPoints: 100 },
  },
  {
    id: 'ch-system-builder-1',
    tileId: 'tile-system-builder',
    name: 'System Architect',
    description: 'Build and backtest a custom strategy with ≥60% win rate',
    conditions: {
      minTrades: 20,
      minAverageR: 1.5,
      minWinRate: 0.6,
      requireJournaling: true,
      maxMistakes: [],
      disciplineMin: 80,
    },
    reward: { label: 'System Architect Badge', xpPoints: 200 },
  },
]
```

### 4.2 Challenge Tracking

```typescript
interface ChallengeProgress {
  challengeId: string
  status: 'not-started' | 'in-progress' | 'completed' | 'failed'
  eligibleTrades: string[]              // trade/journal IDs that count
  currentTrades: number
  currentWinRate: number
  currentAvgR: number
  mistakesIneligible: string[]          // mistakes that caused ineligibility
  startedAt: number
  completedAt?: number
  failedAt?: number
}
```

### 4.3 Challenge Completion Logic

```typescript
function evaluateChallenge(
  challenge: StrategyChallenge,
  trades: JournalEntry[],
  progress: ChallengeProgress,
): ChallengeProgress {
  const eligible = trades.filter(t => {
    // Filter by tile-linked strategies
    const hasTileStrategy = t.strategyTags.some(s => s.includes(challenge.tileId.replace('tile-', '')))
    // Filter out trades with disqualifying mistakes
    const hasBadMistake = t.mistakeTags.some(m => challenge.conditions.maxMistakes.includes(m))
    return hasTileStrategy && !hasBadMistake
  })

  // Check pattern confirmation if required
  const patternConfirmed = challenge.conditions.requirePatternConfirm
    ? eligible.filter(t => t.patternType === challenge.conditions.requirePatternConfirm)
    : eligible

  const wins = patternConfirmed.filter(t => t.pnl > 0)
  const avgR = patternConfirmed.length > 0
    ? patternConfirmed.reduce((s, t) => s + t.rMultiple, 0) / patternConfirmed.length
    : 0
  const winRate = patternConfirmed.length > 0 ? wins.length / patternConfirmed.length : 0
  const journaledAll = patternConfirmed.every(t => t.notes && t.notes.length > 5)

  return {
    ...progress,
    status: 'in-progress',
    eligibleTrades: patternConfirmed.map(t => t.id),
    currentTrades: patternConfirmed.length,
    currentWinRate: winRate,
    currentAvgR: avgR,
    mistakesIneligible: trades
      .filter(t => t.mistakeTags.some(m => challenge.conditions.maxMistakes.includes(m)))
      .flatMap(t => t.mistakeTags),
  }
}

function isChallengeCompleted(challenge: StrategyChallenge, progress: ChallengeProgress): boolean {
  if (progress.status === 'completed') return true
  const c = challenge.conditions
  const meetsTradeCount = progress.currentTrades >= c.minTrades
  const meetsAvgR = progress.currentAvgR >= c.minAverageR
  const meetsWinRate = progress.currentWinRate >= c.minWinRate
  const noBadMistakes = progress.mistakesIneligible.length === 0 ||
    (progress.eligibleTrades.length > 0 && progress.mistakesIneligible.length < 3)

  if (meetsTradeCount && meetsAvgR && meetsWinRate && noBadMistakes) {
    return true
  }
  return false
}
```

### 4.4 Integration with journalEngine and coachingEngine

```typescript
// Called when a new journal entry is added
function onNewJournalEntry(entry: JournalEntry): void {
  const challenges = loadChallengeProgress()
  const activeChallenges = Object.keys(challenges).filter(
    id => challenges[id].status === 'in-progress'
  )

  for (const challengeId of activeChallenges) {
    const challengeDef = challengesByTile[challengeId]  // lookup map
    if (!challengeDef) continue

    const tileIds = challengeDef.tileId
    const isRelevant = entry.strategyTags.some(s => tileIds.includes(s))
    if (!isRelevant) continue

    const progress = challenges[challengeId]
    const updated = evaluateChallenge(challengeDef, loadJournals(), progress)

    if (isChallengeCompleted(challengeDef, updated)) {
      updated.status = 'completed'
      updated.completedAt = Date.now() / 1000
      // Trigger certification check
      checkCertification()
    }
    saveChallengeProgress(challenges)
  }
}
```

---

## 5) CERTIFICATION SYSTEM

### 5.1 Certificate Definitions

```typescript
interface Certificate {
  id: string
  level: 'foundation' | 'intermediate' | 'advanced' | 'master'
  name: string
  title: string                // e.g. "Certified Foundation Trader"
  icon: string                 // emoji or badge icon path
  criteria: {
    requiredTileIds: string[]
    challengesRequired: string[]
    minDisciplineScore: number
    maxDrawdown: number         // percentage
    allQuizzesPassed: boolean
    replaySessionsRequired: number
    requireCustomStrategy?: boolean
    requireBacktest?: boolean
  }
  color: string                // for badge rendering
}

const CERTIFICATES: Certificate[] = [
  {
    id: 'cert-foundation',
    level: 'foundation',
    name: 'Foundation Trader',
    title: 'Certified Foundation Trader',
    icon: '🌱',
    criteria: {
      requiredTileIds: ['tile-ema-pullback', 'tile-rsi-mean-reversion', 'tile-simple-breakout'],
      challengesRequired: ['ch-ema-pullback-1', 'ch-breakout-1'],
      minDisciplineScore: 60,
      maxDrawdown: 20,
      allQuizzesPassed: true,
      replaySessionsRequired: 3,
    },
    color: 'emerald',
  },
  {
    id: 'cert-intermediate',
    level: 'intermediate',
    name: 'Pattern & Breakout Trader',
    title: 'Certified Pattern & Breakout Trader',
    icon: '🔍',
    criteria: {
      requiredTileIds: [
        'tile-breakout-retest', 'tile-mtf-confluence',
        'tile-flag-breakout', 'tile-pennant-breakout',
      ],
      challengesRequired: ['ch-breakout-retest-1', 'ch-flag-breakout-1', 'ch-flag-breakout-2'],
      minDisciplineScore: 65,
      maxDrawdown: 15,
      allQuizzesPassed: true,
      replaySessionsRequired: 5,
    },
    color: 'blue',
  },
  {
    id: 'cert-advanced',
    level: 'advanced',
    name: 'Professional Trader',
    title: 'Certified Professional Trader',
    icon: '⚡',
    criteria: {
      requiredTileIds: [
        'tile-m-pattern-reversal', 'tile-w-pattern-reversal',
        'tile-options-directional', 'tile-options-spread',
        'tile-volatility-breakout',
      ],
      challengesRequired: ['ch-m-w-pattern-1', 'ch-mtf-1', 'ch-volatility-1'],
      minDisciplineScore: 75,
      maxDrawdown: 12,
      allQuizzesPassed: true,
      replaySessionsRequired: 8,
    },
    color: 'purple',
  },
  {
    id: 'cert-master',
    level: 'master',
    name: 'System Builder',
    title: 'Certified System Builder — Master Trader',
    icon: '🏆',
    criteria: {
      requiredTileIds: ['tile-system-builder'],
      challengesRequired: ['ch-system-builder-1'],
      minDisciplineScore: 85,
      maxDrawdown: 10,
      allQuizzesPassed: true,
      replaySessionsRequired: 12,
      requireCustomStrategy: true,
      requireBacktest: true,
    },
    color: 'amber',
  },
]
```

### 5.2 Certificate JSON (Persisted)

```typescript
interface CertificateRecord {
  certificateId: string
  earned: boolean
  earnedAt?: number
  displayed: boolean   // has user seen the celebration modal?
  criteriaProgress: {
    tilesCompleted: string[]
    challengesCompleted: string[]
    disciplineScore: number
    maxDrawdown: number
    quizzesPassed: string[]
    replaysCompleted: number
    hasCustomStrategy: boolean
    hasBacktest: boolean
  }
}

const STORAGE_KEY_CERTS = 'tj_certificates'

function loadCertificates(): Record<string, CertificateRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CERTS)
    return raw ? JSON.parse(raw) : defaultCertificates()
  } catch { return defaultCertificates() }
}

function defaultCertificates(): Record<string, CertificateRecord> {
  const records: Record<string, CertificateRecord> = {}
  for (const cert of CERTIFICATES) {
    records[cert.id] = {
      certificateId: cert.id,
      earned: false,
      displayed: false,
      criteriaProgress: {
        tilesCompleted: [],
        challengesCompleted: [],
        disciplineScore: 0,
        maxDrawdown: 100,
        quizzesPassed: [],
        replaysCompleted: 0,
        hasCustomStrategy: false,
        hasBacktest: false,
      },
    }
  }
  return records
}
```

### 5.3 Certification Evaluation

```typescript
function checkCertification(): CertificateRecord[] {
  const certificates = loadCertificates()
  const newEarnings: CertificateRecord[] = []

  for (const cert of CERTIFICATES) {
    const record = certificates[cert.id]
    if (record.earned) continue

    const c = cert.criteria
    const tileProgress = loadTileProgress()
    const challengeProgress = loadChallengeProgress()
    const journals = loadJournals()
    const disciplineScore = calculateDisciplineScore(journals)
    const drawdown = calculateMaxDrawdownFromJournals(journals)
    const quizAttempts = loadQuizAttempts()
    const skillState = loadSkillState()
    const allQuizzesPassed = c.allQuizzesPassed
      ? cert.criteria.requiredTileIds.every(tileId =>
          quizAttempts
            .filter(q => q.passed)
            .some(q => questionBank.find(qb => qb.id === q.quizId)?.tileId === tileId)
        )
      : true

    const tilesCompleted = c.requiredTileIds.every(tid => tileProgress[tid]?.status === 'completed')
    const challengesDone = c.challengesRequired.every(cid => challengeProgress[cid]?.status === 'completed')
    const replaysDone = (record.criteriaProgress.replaysCompleted ?? 0) >= c.replaySessionsRequired
    const meetsDiscipline = disciplineScore >= c.minDisciplineScore
    const meetsDrawdown = drawdown <= c.maxDrawdown

    const earned = tilesCompleted && challengesDone && replaysDone && meetsDiscipline && meetsDrawdown && allQuizzesPassed

    const updatedRecord: CertificateRecord = {
      ...record,
      criteriaProgress: {
        tilesCompleted: c.requiredTileIds.filter(tid => tileProgress[tid]?.status === 'completed'),
        challengesCompleted: c.challengesRequired.filter(cid => challengeProgress[cid]?.status === 'completed'),
        disciplineScore,
        maxDrawdown: drawdown,
        quizzesPassed: quizAttempts.filter(q => q.passed).map(q => q.quizId),
        replaysCompleted: record.criteriaProgress.replaysCompleted,
        hasCustomStrategy: record.criteriaProgress.hasCustomStrategy,
        hasBacktest: record.criteriaProgress.hasBacktest,
      },
    }

    if (earned) {
      updatedRecord.earned = true
      updatedRecord.earnedAt = Date.now() / 1000
      newEarnings.push(updatedRecord)

      // Unlock next level
      const nextLevel = getNextLevel(cert.level)
      if (nextLevel) {
        const state = loadSkillState()
        if (!state.unlockedLevels.includes(nextLevel)) {
          state.unlockedLevels.push(nextLevel)
          state.unlockedAt[nextLevel] = Date.now() / 1000
          saveSkillState(state)
        }
      }
    }

    certificates[cert.id] = updatedRecord
  }

  saveCertificateRecords(certificates)
  return newEarnings
}

function getNextLevel(level: string): string | null {
  const order = ['foundation', 'intermediate', 'advanced', 'master']
  const idx = order.indexOf(level)
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null
}
```

### 5.4 Certificate UI Modal

```
┌───────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐      │
│  │                                     │      │
│  │          🏆 MASTER TRADER           │      │
│  │                                     │      │
│  │   Certified System Builder          │      │
│  │   Completed: July 16, 2026          │      │
│  │   Level: Master                     │      │
│  │                                     │      │
│  │   ┌────────────────────────┐        │      │
│  │   │  [DOWNLOAD PNG]       │        │      │
│  │   └────────────────────────┘        │      │
│  │                                     │      │
│  └─────────────────────────────────────┘      │
│                                               │
│  Requirements:                                 │
│  ✓ System Builder tile                         │
│  ✓ 12 replay sessions                          │
│  ✓ Discipline score ≥ 85                       │
│  ✓ Drawdown ≤ 10%                              │
│  ✓ Custom strategy built                        │
│  ✓ All challenges completed                    │
│                                               │
│  [  SHARE  ]  [  CLOSE  ]                     │
└───────────────────────────────────────────────┘
```

- Modal triggers automatically when a certificate is earned
- Canvas-generated PNG for download/share (offline, no server)
- Progress breakdown with checkmarks per criterion
- "View Next Certificate" button if not yet at master level

---

## 6) LEARNING ANALYTICS DASHBOARD

### 6.1 Metrics

```typescript
interface LearningAnalytics {
  totalTrades: number
  totalReplays: number
  tilesCompleted: number
  totalTiles: number
  patternsMastered: number         // unique pattern types from journal
  challengesCompleted: number
  totalChallenges: number
  currentLevel: string
  disciplineScore: number          // current
  disciplineTrend: number[]        // last 30 days
  mistakesReduced: number          // % reduction in mistakes over last 30 days
  bestStrategy: { name: string; winRate: number; avgR: number }
  worstStrategy: { name: string; winRate: number; avgR: number }
  emotionalStability: number       // 0-100 based on emotion tag distribution
  riskDiscipline: number           // 0-100 based on SL adherence
  weeklyProgress: Array<{
    week: string                   // ISO week
    trades: number
    winRate: number
    disciplineScore: number
    newMistakes: number
  }>
  mistakeBreakdown: Record<string, number>
  emotionBreakdown: Record<string, number>
  strategyPerformance: Array<{
    strategy: string
    trades: number
    winRate: number
    avgR: number
    totalPnl: number
  }>
}
```

### 6.2 Data Aggregation Logic

```typescript
function computeAnalytics(): LearningAnalytics {
  const journals = loadJournals()
  const tileProgress = loadTileProgress()
  const skillState = loadSkillState()
  const challengeProgress = loadChallengeProgress()
  const quizAttempts = loadQuizAttempts()

  const now = Date.now() / 1000
  const thirtyDaysAgo = now - 30 * 86400
  const recentJournals = journals.filter(j => j.exitTime >= thirtyDaysAgo)
  const olderJournals = journals.filter(j => j.exitTime < thirtyDaysAgo)

  // Discipline score
  const disciplineScore = calculateDisciplineScore(journals)
  const oldDiscipline = calculateDisciplineScore(olderJournals)

  // Mistakes reduced
  const recentMistakeCount = recentJournals.reduce((s, j) => s + j.mistakeTags.length, 0)
  const oldMistakeCount = olderJournals.reduce((s, j) => s + j.mistakeTags.length, 0)
  const mistakesReduced = oldMistakeCount > 0
    ? Math.round((1 - recentMistakeCount / Math.max(oldMistakeCount, 1)) * 100)
    : 0

  // Mistake breakdown
  const mistakeBreakdown: Record<string, number> = {}
  for (const j of journals) for (const m of j.mistakeTags) mistakeBreakdown[m] = (mistakeBreakdown[m] || 0) + 1

  // Emotion breakdown
  const emotionBreakdown: Record<string, number> = {}
  for (const j of journals) for (const e of j.emotionTags) emotionBreakdown[e] = (emotionBreakdown[e] || 0) + 1

  // Emotional stability: ratio of positive to negative emotions
  const positiveEmotions = ['confident', 'focused', 'neutral']
  const negativeEmotions = ['anxious', 'impatient', 'regret', 'fearful', 'greedy']
  const posCount = Object.entries(emotionBreakdown)
    .filter(([e]) => positiveEmotions.includes(e)).reduce((s, [, c]) => s + c, 0)
  const negCount = Object.entries(emotionBreakdown)
    .filter(([e]) => negativeEmotions.includes(e)).reduce((s, [, c]) => s + c, 0)
  const emotionalStability = posCount + negCount > 0
    ? Math.round(posCount / (posCount + negCount) * 100)
    : 50

  // Risk discipline: trades with SL vs without
  const withSL = journals.filter(j => j.mistakeTags.includes('no-sl')).length
  const riskDiscipline = journals.length > 0
    ? Math.round((1 - withSL / journals.length) * 100)
    : 100

  // Strategy performance
  const strategyStats: Record<string, { trades: number; wins: number; totalR: number; pnl: number }> = {}
  for (const j of journals) {
    for (const s of j.strategyTags) {
      if (!strategyStats[s]) strategyStats[s] = { trades: 0, wins: 0, totalR: 0, pnl: 0 }
      strategyStats[s].trades++
      if (j.pnl > 0) strategyStats[s].wins++
      strategyStats[s].totalR += j.rMultiple
      strategyStats[s].pnl += j.pnl
    }
  }

  const strategyPerformance = Object.entries(strategyStats)
    .map(([strategy, stats]) => ({
      strategy,
      trades: stats.trades,
      winRate: stats.trades > 0 ? stats.wins / stats.trades : 0,
      avgR: stats.trades > 0 ? stats.totalR / stats.trades : 0,
      totalPnl: stats.pnl,
    }))
    .sort((a, b) => b.trades - a.trades)

  const bestStrategy = strategyPerformance.length > 0
    ? strategyPerformance.reduce((best, s) => s.winRate > best.winRate ? s : best)
    : { strategy: 'N/A', winRate: 0, avgR: 0 }
  const worstStrategy = strategyPerformance.length > 0
    ? strategyPerformance.reduce((worst, s) => s.winRate < worst.winRate ? s : worst)
    : { strategy: 'N/A', winRate: 0, avgR: 0 }

  // Weekly progress
  const weeklyProgress: LearningAnalytics['weeklyProgress'] = []
  for (let i = 29; i >= 0; i--) {
    const dayStart = now - (i + 1) * 86400
    const dayEnd = now - i * 86400
    const dayTrades = journals.filter(j => j.exitTime >= dayStart && j.exitTime < dayEnd)
    if (dayTrades.length > 0) {
      const wins = dayTrades.filter(t => t.pnl > 0)
      weeklyProgress.push({
        week: new Date(dayStart * 1000).toISOString().slice(0, 10),
        trades: dayTrades.length,
        winRate: dayTrades.length > 0 ? wins.length / dayTrades.length : 0,
        disciplineScore: calculateDisciplineScore(dayTrades),
        newMistakes: dayTrades.reduce((s, t) => s + t.mistakeTags.length, 0),
      })
    }
  }

  // Patterns mastered
  const patternTypes = new Set(journals.filter(j => j.patternType).map(j => j.patternType))

  return {
    totalTrades: journals.length,
    totalReplays: Object.keys(loadReplayProgress()).filter(id => loadReplayProgress()[id]?.completed).length,
    tilesCompleted: Object.values(tileProgress).filter(t => t.status === 'completed').length,
    totalTiles: Object.keys(tileCompletionCriteria).length,
    patternsMastered: patternTypes.size,
    challengesCompleted: Object.values(challengeProgress).filter(c => c.status === 'completed').length,
    totalChallenges: challenges.length,
    currentLevel: skillState.level,
    disciplineScore,
    disciplineTrend: weeklyProgress.map(w => w.disciplineScore),
    mistakesReduced,
    bestStrategy: { name: bestStrategy.strategy, winRate: bestStrategy.winRate, avgR: bestStrategy.avgR },
    worstStrategy: { name: worstStrategy.strategy, winRate: worstStrategy.winRate, avgR: worstStrategy.avgR },
    emotionalStability,
    riskDiscipline,
    weeklyProgress,
    mistakeBreakdown,
    emotionBreakdown,
    strategyPerformance,
  }
}
```

### 6.3 Charts (via Recharts)

```
┌─────────────────────────────────────────────────────────┐
│  LEARNING ANALYTICS                                     │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ 245  │ │ 70%  │ │ 1.8  │ │ 82   │ │ 12   │          │
│  │Total │ │Win   │ │Avg R │ │Disc  │ │Mist. │          │
│  │Trades│ │Rate  │ │      │ │Score │ │Reduc.│          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  DISCIPLINE SCORE TREND (30 days)                  │  │
│  │  ╱╲   ╱╲_  ╱╲_╱╲_╱╲_╱╲                            │  │
│  │ ╱  ╲_╱  ╲_╱    ╲_/   ╲_/                           │  │
│  │────────────────────────────────────────────────     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │  MISTAKE BREAKDOWN     │  │  EMOTION BREAKDOWN     │  │
│  │  [ Bar chart ]         │  │  [ Donut chart ]       │  │
│  │                        │  │                        │  │
│  └────────────────────────┘  └────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  STRATEGY PERFORMANCE                              │  │
│  │  [Horizontal bar chart: win rate per strategy]     │  │
│  │                                                    │  │
│  │  EMA20 Pullback    ████████████ 72%   avgR 1.9    │  │
│  │  Simple Breakout   ██████████    65%   avgR 2.4    │  │
│  │  Flag Breakout     █████████████ 80%   avgR 2.1    │  │
│  │  RSI Reversal      ██████        40%   avgR 0.8    │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.4 UI Layout

```typescript
// LearningPage.tsx — add "Analytics" tab alongside tile grid
function LearningPage() {
  const [view, setView] = useState<'tiles' | 'analytics'>('tiles')

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setView('tiles')} className={view === 'tiles' ? 'text-tej-400 border-b-2 border-tej-400' : ''}>
          Strategy Tiles
        </button>
        <button onClick={() => setView('analytics')} className={view === 'analytics' ? 'text-tej-400 border-b-2 border-tej-400' : ''}>
          Analytics
        </button>
      </div>
      {view === 'tiles' ? <TileGrid /> : <AnalyticsDashboard />}
    </div>
  )
}
```

---

## 7) ADAPTIVE LEARNING ENGINE

### 7.1 Rule Engine

```typescript
interface Recommendation {
  id: string
  type: 'tile' | 'replay' | 'challenge' | 'quiz' | 'journal' | 'coaching'
  targetId: string             // what to recommend
  reason: string               // why
  priority: 1 | 2 | 3          // 1 = highest
  condition: (state: LearnerState) => boolean
}

interface LearnerState {
  journals: JournalEntry[]
  disciplineScore: number
  patternDetections: DetectedPattern[]
  mistakes: Record<string, number>
  emotions: Record<string, number>
  tileProgress: Record<string, TileProgress>
  challenges: Record<string, ChallengeProgress>
  quizzes: QuizAttempt[]
  skillState: SkillState
  replayHistory: Record<string, { completed: boolean; mistakes: string[] }>
}
```

### 7.2 Recommendation Rules

```typescript
const RECOMMENDATIONS: Recommendation[] = [
  // MISTAKE-BASED
  {
    id: 'rec-no-sl',
    type: 'coaching',
    targetId: 'no-sl-entry',
    priority: 1,
    reason: 'You placed {count} trades without SL. Review EMA Pullback SL rules.',
    condition: (s) => (s.mistakes['no-sl'] || 0) >= 2,
  },
  {
    id: 'rec-fomo',
    type: 'tile',
    targetId: 'tile-rsi-mean-reversion',
    priority: 2,
    reason: 'FOMO detected {count}x. Try RSI Mean-Reversion — it teaches patience.',
    condition: (s) => (s.mistakes['fomo'] || 0) >= 3,
  },
  {
    id: 'rec-chase',
    type: 'replay',
    targetId: 'replay-breakout-retest',
    priority: 2,
    reason: 'You chase breakouts. Practice Breakout+Retest in replay mode.',
    condition: (s) => (s.mistakes['chase'] || 0) >= 2,
  },
  {
    id: 'rec-no-confirmation',
    type: 'tile',
    targetId: 'tile-flag-breakout',
    priority: 2,
    reason: 'You enter without confirmation. Study flag/pennant breakout rules.',
    condition: (s) => (s.mistakes['no-confirmation'] || 0) >= 3,
  },
  {
    id: 'rec-early-exit',
    type: 'journal',
    targetId: 'review-tp-placement',
    priority: 3,
    reason: 'You exit trades early. Journal your TP placement rationale.',
    condition: (s) => (s.mistakes['early-exit'] || 0) >= 3,
  },

  // PERFORMANCE-BASED
  {
    id: 'rec-low-winrate',
    type: 'tile',
    targetId: 'tile-simple-breakout',
    priority: 2,
    reason: 'Win rate below 40%. Master Simple Breakout before advanced tiles.',
    condition: (s) => {
      const stats = computeStrategyStats(s.journals)
      const overallWR = stats.length > 0 ? stats.reduce((a, b) => a + b.winRate, 0) / stats.length : 1
      return overallWR < 0.4 && s.tileProgress['tile-simple-breakout']?.status !== 'completed'
    },
  },
  {
    id: 'rec-low-discipline',
    type: 'coaching',
    targetId: 'consecutive-losses',
    priority: 1,
    reason: 'Discipline score is {score}. Review risk rules before next trade.',
    condition: (s) => s.disciplineScore < 60,
  },

  // EMOTION-BASED
  {
    id: 'rec-revenge',
    type: 'coaching',
    targetId: 'revenge-trade',
    priority: 1,
    reason: 'Revenge trading pattern detected. Take a break and review M-Pattern module.',
    condition: (s) => s.journals.filter(j => j.emotionTags.includes('regret')).length >= 3,
  },
  {
    id: 'rec-anxiety',
    type: 'tile',
    targetId: 'tile-ema-pullback',
    priority: 3,
    reason: 'Anxiety detected in {count} trades. EMA Pullback has clear rules to build confidence.',
    condition: (s) => (s.emotions['anxious'] || 0) >= 3,
  },

  // PROGRESSION-BASED
  {
    id: 'rec-next-tile',
    type: 'tile',
    targetId: '',                // computed dynamically
    priority: 2,
    reason: 'Complete {tile} to unlock next level.',
    condition: (s) => {
      const next = getNextRecommendedTile(s)
      return next !== null
    },
  },
  {
    id: 'rec-replay-needed',
    type: 'replay',
    targetId: '',                // computed dynamically
    priority: 3,
    reason: 'You need {n} more replay sessions for certification.',
    condition: (s) => {
      const cert = getNextCertificate(s.skillState.level)
      if (!cert) return false
      const done = Object.values(s.replayHistory).filter(r => r.completed).length
      return done < cert.criteria.replaySessionsRequired
    },
  },
]
```

### 7.3 Recommendation Generator

```typescript
function generateRecommendations(
  learnerState: LearnerState,
  maxResults: number = 3,
): Array<Recommendation & { resolvedReason: string; targetLabel: string }> {
  const matched: Array<Recommendation & { resolvedReason: string; targetLabel: string }> = []

  for (const rec of RECOMMENDATIONS) {
    try {
      if (rec.condition(learnerState)) {
        const resolvedReason = rec.reason
          .replace('{count}', String((learnerState.mistakes[rec.targetId] || 0)))
          .replace('{score}', String(learnerState.disciplineScore))
          .replace('{n}', '3') // simplified

        const targetLabel = getLabelForTarget(rec)
        matched.push({ ...rec, resolvedReason, targetLabel })
      }
    } catch (e) {
      // skip invalid rules
    }
  }

  // Sort by priority, then by random shuffle within same priority
  matched.sort((a, b) => a.priority - b.priority || Math.random() - 0.5)
  return matched.slice(0, maxResults)
}
```

### 7.4 UI Panel

```
┌────────────────────────────────────────────┐
│  🧠 LEARNING COACH                        │
│                                            │
│  Based on your recent activity:            │
│                                            │
│  ⚠ You placed 3 trades without SL         │
│   └ [Review EMA Pullback SL Rules]        │
│                                            │
│  ⚠ Win rate below 40%                     │
│   └ [Master Simple Breakout]              │
│                                            │
│  ℹ Complete 3 more replay sessions         │
│     for certification                      │
│   └ [View Replays]                         │
│                                            │
│  [DISMISS ALL]                  [REFRESH]  │
└────────────────────────────────────────────┘
```

- Shown on `/learn` page as a sidebar or top card
- Dismiss individual recommendations or all
- Recommendations refresh on journal entry, quiz, replay, or manual refresh
- Click-to-navigate directly to target tile / replay / coaching topic

---

## 8) LEVEL UNLOCK LOGIC

### 8.1 Unlock Conditions Definition

```typescript
interface LevelUnlockCondition {
  level: string
  label: string
  requiredTiles: string[]           // tile IDs that must be completed
  requiredTileCount: number         // OR minimum count if list is empty
  requiredQuizzesPassed: number
  minDisciplineScore: number
  challengesCompleted: number
  patternAccuracy?: number           // from pattern engine
  requireCustomStrategy?: boolean
  requireBacktest?: boolean
  maxDrawdown?: number               // percentage
  tileCompletionsRequired?: Array<{ tileId: string; status: string }>
}

const LEVEL_UNLOCK_CONDITIONS: Record<string, LevelUnlockCondition> = {
  foundation: {
    level: 'foundation',
    label: 'Foundation Trader',
    requiredTiles: ['tile-ema-pullback', 'tile-rsi-mean-reversion', 'tile-simple-breakout'],
    requiredTileCount: 0,            // not used when specific tiles are listed
    requiredQuizzesPassed: 2,
    minDisciplineScore: 0,           // always unlocked (starting level)
    challengesCompleted: 0,
  },
  intermediate: {
    level: 'intermediate',
    label: 'Pattern & Breakout Trader',
    requiredTiles: [
      'tile-ema-pullback', 'tile-rsi-mean-reversion', 'tile-simple-breakout',
      'tile-breakout-retest', 'tile-mtf-confluence', 'tile-flag-breakout', 'tile-pennant-breakout',
    ],
    requiredTileCount: 0,
    requiredQuizzesPassed: 4,
    minDisciplineScore: 60,
    challengesCompleted: 2,
    patternAccuracy: 0.70,
  },
  advanced: {
    level: 'advanced',
    label: 'Professional Trader',
    requiredTiles: [
      // all foundation + all intermediate + professional tiles
      'tile-m-pattern-reversal', 'tile-w-pattern-reversal',
      'tile-options-directional', 'tile-options-spread', 'tile-volatility-breakout',
    ],
    requiredTileCount: 0,
    requiredQuizzesPassed: 7,
    minDisciplineScore: 70,
    challengesCompleted: 4,
    patternAccuracy: 0.75,
    maxDrawdown: 15,
  },
  master: {
    level: 'master',
    label: 'System Builder',
    requiredTiles: ['tile-system-builder'],
    requiredTileCount: 0,
    requiredQuizzesPassed: 9,
    minDisciplineScore: 80,
    challengesCompleted: 8,
    patternAccuracy: 0.80,
    requireCustomStrategy: true,
    requireBacktest: true,
    maxDrawdown: 10,
  },
}
```

### 8.2 Unlock Condition Evaluator

```typescript
function canUnlockLevel(
  targetLevel: string,
  state: LearnerState,
): { unlocked: boolean; progress: Record<string, { met: boolean; current: any; required: any }> } {
  const conditions = LEVEL_UNLOCK_CONDITIONS[targetLevel]
  if (!conditions) return { unlocked: false, progress: {} }

  const tileProgress = state.tileProgress
  const tilesCompleted = conditions.requiredTiles.every(tid => tileProgress[tid]?.status === 'completed')
  const quizzesPassed = state.quizzes.filter(q => q.passed).length
  const meetsDiscipline = state.disciplineScore >= conditions.minDisciplineScore
  const challengesDone = state.challenges ? Object.values(state.challenges).filter(c => c.status === 'completed').length : 0
  const meetsChallenges = challengesDone >= conditions.challengesCompleted

  // Pattern accuracy from pattern engine detections
  const patternAccuracy = calculatePatternAccuracy(state)
  const meetsPattern = conditions.patternAccuracy
    ? patternAccuracy >= conditions.patternAccuracy
    : true

  // Drawdown from risk engine
  const drawdown = calculateMaxDrawdownFromJournals(state.journals)
  const meetsDrawdown = conditions.maxDrawdown
    ? drawdown <= conditions.maxDrawdown
    : true

  const unlocked = tilesCompleted && (quizzesPassed >= conditions.requiredQuizzesPassed) &&
    meetsDiscipline && meetsChallenges && meetsPattern && meetsDrawdown

  return {
    unlocked,
    progress: {
      'Complete Required Tiles': {
        met: tilesCompleted,
        current: conditions.requiredTiles.filter(t => tileProgress[t]?.status === 'completed').length,
        required: conditions.requiredTiles.length,
      },
      'Quizzes Passed': {
        met: quizzesPassed >= conditions.requiredQuizzesPassed,
        current: quizzesPassed,
        required: conditions.requiredQuizzesPassed,
      },
      'Discipline Score': {
        met: meetsDiscipline,
        current: state.disciplineScore,
        required: conditions.minDisciplineScore,
      },
      'Challenges Completed': {
        met: meetsChallenges,
        current: challengesDone,
        required: conditions.challengesCompleted,
      },
      'Pattern Accuracy': {
        met: meetsPattern,
        current: patternAccuracy,
        required: conditions.patternAccuracy || '-',
      },
      'Max Drawdown': {
        met: meetsDrawdown,
        current: drawdown,
        required: conditions.maxDrawdown || '-',
      },
    },
  }
}
```

### 8.3 Pattern Accuracy Calculation

```typescript
function calculatePatternAccuracy(state: LearnerState): number {
  // Cross-reference journal pattern types with pattern engine detections
  const journaledPatterns = state.journals.filter(j => j.patternType)
  if (journaledPatterns.length === 0) return 0

  const correctConfirms = journaledPatterns.filter(j => {
    const detection = state.patternDetections.find(
      d => d.symbol === j.symbol &&
           Math.abs(d.timestamp - j.entryTime) < 3600 && // within 1 hour
           d.type === j.patternType
    )
    return detection && detection.confidence >= 0.6
  }).length

  return correctConfirms / journaledPatterns.length
}
```

### 8.4 Lock/Unlock Animations

```typescript
// On the level cards in Skill Progression UI:

const levelCardState = {
  locked: `
    filter: grayscale(100%) blur(0.5px)
    opacity: 0.5
    cursor: not-allowed
    position: relative
    // overlay with padlock icon
  `,
  unlocked: `
    filter: none
    opacity: 1
    cursor: pointer
    // subtle glow on first unlock
    animation: unlock-glow 1.5s ease-out
  `,
  current: `
    border: 2px solid theme('colors.tej.400')
    // pulsing border animation
    animation: pulse-border 2s infinite
  `,
}

@keyframes unlock-glow {
  0%   { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
  50%  { box-shadow: 0 0 20px 10px rgba(52, 211, 153, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

@keyframes pulse-border {
  0%, 100% { border-color: theme('colors.tej.400'); }
  50%      { border-color: theme('colors.tej.600'); }
}
```

### 8.5 Level Progression Hook

```typescript
function useLevelProgression() {
  const [showUnlock, setShowUnlock] = useState<string | null>(null)
  const state = computeLearnerState()

  useEffect(() => {
    const order = ['foundation', 'intermediate', 'advanced', 'master']
    const currentIdx = order.indexOf(state.skillState.level)

    for (let i = currentIdx + 1; i < order.length; i++) {
      const result = canUnlockLevel(order[i], state)
      if (result.unlocked) {
        const newState = loadSkillState()
        newState.level = order[i]
        newState.unlockedLevels.push(order[i])
        newState.unlockedAt[order[i]] = Date.now() / 1000
        saveSkillState(newState)
        setShowUnlock(order[i])
        break
      }
    }
  }, [state.journals.length, Object.values(state.tileProgress).filter(t => t.status === 'completed').length])

  return { showUnlock, dismissUnlock: () => setShowUnlock(null) }
}
```

---

## 9) MODULE INTEGRATION

### 9.1 Data Flow Diagram

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  CHART       │    │  PATTERN     │    │  REPLAY      │
│  TradingView │───►│  ENGINE      │    │  ENGINE      │
│              │    │  detections  │    │  sessions    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       │  trades           │  patternConfirms   │  replaysDone
       ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    JOURNAL ENGINE                        │
│  Stores: trades with strategyTags, emotionTags,         │
│          mistakeTags, patternType, pnl, rMultiple        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │  journals updated
                     ▼
┌─────────────────────────────────────────────────────────┐
│               LEARNING MODULE (New)                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  TILE    │  │ CHALLENGE│  │  QUIZ   │  │  ANALYTICS│ │
│  │ TRACKING │  │ EVAL     │  │ ENGINE  │  │  ENGINE  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │             │              │       │
│       ▼              ▼             ▼              ▼       │
│  ┌──────────────────────────────────────────────────┐   │
│  │           ADAPTIVE LEARNING ENGINE                │   │
│  │  Generates recommendations based on all signals   │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              CERTIFICATION ENGINE                  │   │
│  │  Evaluates criteria, unlocks levels, awards certs  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │  events
                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  COACHING    │    │  RISK        │    │  PINESCRIPT  │
│  AI          │◄───│  ENGINE      │    │  ENGINE      │
│  alerts      │    │  discipline  │    │  custom strat│
└──────────────┘    └──────────────┘    └──────────────┘
```

### 9.2 Event Triggers

```typescript
// Global event bus for module integration
type LearningEvent =
  | { type: 'JOURNAL_ADDED'; entry: JournalEntry }
  | { type: 'JOURNAL_UPDATED'; entry: JournalEntry }
  | { type: 'PATTERN_DETECTED'; pattern: DetectedPattern }
  | { type: 'REPLAY_COMPLETED'; replayId: string; mistakes: string[] }
  | { type: 'QUIZ_COMPLETED'; attempt: QuizAttempt }
  | { type: 'TRADE_CLOSED'; trade: any }           // from paper trading
  | { type: 'RISK_UPDATED'; risk: RiskConfig }
  | { type: 'PINESCRIPT_SAVED'; script: any }
  | { type: 'COACHING_ALERT'; alert: CoachingFeedback }

class LearningEventBus {
  private handlers: Map<string, Set<(event: LearningEvent) => void>> = new Map()

  on(eventType: string, handler: (event: LearningEvent) => void) {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, new Set())
    this.handlers.get(eventType)!.add(handler)
  }

  off(eventType: string, handler: (event: LearningEvent) => void) {
    this.handlers.get(eventType)?.delete(handler)
  }

  emit(event: LearningEvent) {
    for (const handler of this.handlers.get(event.type) || []) {
      try { handler(event) } catch (e) { console.error('[LearningEventBus]', e) }
    }
    // Also run global check
    this.runGlobalCheck()
  }

  private runGlobalCheck() {
    checkCertification()
    // update tile progress, challenge progress, analytics, etc.
  }
}

export const learningEventBus = new LearningEventBus()
```

### 9.3 Event Handlers

```typescript
// Hook into existing modules

// 1. When journal entry is added
learningEventBus.on('JOURNAL_ADDED', (event) => {
  if (event.type !== 'JOURNAL_ADDED') return

  const progress = loadTileProgress()
  const entry = event.entry

  // Update strategy tile progress
  for (const tag of entry.strategyTags) {
    const tileId = findTileIdByStrategyTag(tag)
    if (tileId && progress[tileId]) {
      progress[tileId].practiceTrades++
      progress[tileId].lastActivity = Date.now() / 1000

      if (isTileCompleted(tileId, progress[tileId])) {
        progress[tileId].status = 'completed'
        progress[tileId].completedAt = Date.now() / 1000
      }
    }
  }
  saveTileProgress(progress)

  // Update challenge progress
  const challenges = loadChallengeProgress()
  for (const challengeId of Object.keys(challenges)) {
    if (challenges[challengeId].status === 'in-progress') {
      const def = challengesByTile[challengeId]
      if (def) {
        const updated = evaluateChallenge(def, loadJournals(), challenges[challengeId])
        challenges[challengeId] = updated
        if (isChallengeCompleted(def, updated)) {
          challenges[challengeId].status = 'completed'
          challenges[challengeId].completedAt = Date.now() / 1000
        }
      }
    }
  }
  saveChallengeProgress(challenges)
})

// 2. When pattern is detected
learningEventBus.on('PATTERN_DETECTED', (event) => {
  if (event.type !== 'PATTERN_DETECTED') return
  // Track for pattern accuracy calculation
  appendPatternDetection(event.pattern)
})

// 3. When replay completes
learningEventBus.on('REPLAY_COMPLETED', (event) => {
  if (event.type !== 'REPLAY_COMPLETED') return
  const replays = loadReplayProgress()
  replays[event.replayId] = {
    completed: true,
    mistakes: event.mistakes,
    completedAt: Date.now() / 1000,
  }
  saveReplayProgress(replays)
})

// 4. When quiz completes
learningEventBus.on('QUIZ_COMPLETED', (event) => {
  if (event.type !== 'QUIZ_COMPLETED') return
  const attempts = loadQuizAttempts()
  attempts.push(event.attempt)
  saveQuizAttempts(attempts)
})

// 5. Wire up existing modules
function integrateExistingModules(): void {
  // Hook journalEngine addJournal
  const originalAddJournal = addJournal
  addJournal = (entry: JournalEntry) => {
    originalAddJournal(entry)
    learningEventBus.emit({ type: 'JOURNAL_ADDED', entry })
  }

  // Hook patternEngine on detection
  const originalOnDetect = onPatternDetected
  onPatternDetected = (pattern: DetectedPattern) => {
    originalOnDetect?.(pattern)
    learningEventBus.emit({ type: 'PATTERN_DETECTED', pattern })
  }
}
```

### 9.4 Sync Logic

```typescript
// Periodic sync — runs every 60 seconds and on app focus
function syncLearningState(): void {
  const tileProgress = loadTileProgress()
  const journals = loadJournals()
  const challenges = loadChallengeProgress()

  // Cross-validate: count journal entries per tile strategy
  for (const tileId of Object.keys(tileProgress)) {
    const criteria = tileCompletionCriteria[tileId]
    if (!criteria) continue

    const relevant = journals.filter(j =>
      j.strategyTags.some(s => tileId.includes(s) || s.includes(tileId.replace('tile-', '')))
    )
    tileProgress[tileId].journalEntries = relevant.length
    tileProgress[tileId].practiceTrades = relevant.filter(j => j.pnl !== 0).length

    // Auto-upgrade to completed if criteria met
    if (isTileCompleted(tileId, tileProgress[tileId])) {
      tileProgress[tileId].status = 'completed'
      tileProgress[tileId].completedAt = tileProgress[tileId].completedAt || Date.now() / 1000
    } else if (tileProgress[tileId].practiceTrades > 0 && tileProgress[tileId].status === 'not-started') {
      tileProgress[tileId].status = 'in-progress'
      tileProgress[tileId].startedAt = tileProgress[tileId].startedAt || Date.now() / 1000
    }
  }
  saveTileProgress(tileProgress)

  // Re-evaluate certification
  const newCerts = checkCertification()
  if (newCerts.length > 0) {
    // Show celebration modals for each new certificate
  }
}
```

### 9.5 LocalStorage Key Summary

```typescript
const STORAGE_KEYS = {
  // Existing
  JOURNALS: 'tj_journals',
  RISK_CONFIG: 'tj_risk_config',
  RISK_STATE: 'tj_risk_state',
  PINESCRIPTS: 'tj_pinescripts',

  // New — Learning Module
  SKILL_STATE: 'tj_skill_state',
  TILE_PROGRESS: 'tj_tile_progress',
  CHALLENGE_PROGRESS: 'tj_challenge_progress',
  CERTIFICATES: 'tj_certificates',
  QUIZ_ATTEMPTS: 'tj_quiz_attempts',
  PATTERN_DETECTIONS: 'tj_pattern_detections',
  REPLAY_PROGRESS: 'tj_replay_progress',
  RECOMMENDATION_DISMISSALS: 'tj_rec_dismissals',
}
```

---

## IMPLEMENTATION ORDER

| Phase | Module | Files | Dependencies |
|-------|--------|-------|-------------|
| 1 | Tile Progress Tracking + Storage | `learningEngine.ts`, `tileProgress.ts` | journalEngine |
| 2 | Quiz Engine + Question Bank | `quizEngine.ts`, `questionBank.ts` | trainingEngine |
| 3 | Challenge Engine | `challengeEngine.ts` | journalEngine, learningEngine |
| 4 | Skill Progression UI | `SkillProgression.tsx`, `LevelCard.tsx` | learningEngine |
| 5 | Analytics Dashboard | `AnalyticsDashboard.tsx` | recharts, all engines |
| 6 | Adaptive Recommendations | `adaptiveEngine.ts` | all engines |
| 7 | Certification System | `certificationEngine.ts`, `CertificateModal.tsx` | all engines |
| 8 | Event Bus Integration | `learningEventBus.ts` | all modules |
| 9 | Polish: animations, modals, edge cases | — | all of the above |

---

*End of Learning Module Architecture Document*
