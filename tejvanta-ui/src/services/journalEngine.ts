export interface JournalEntry {
  id: string
  tradeId: string
  symbol: string
  side: 'buy' | 'sell'
  entryTime: number
  exitTime: number
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  rMultiple: number
  notes: string
  strategyTags: string[]
  emotionTags: string[]
  mistakeTags: string[]
  patternType: string | null
  screenshotDataUrl: string | null
  setupRating: 1 | 2 | 3 | 4 | 5
  executionRating: 1 | 2 | 3 | 4 | 5
  lessonLearned: string
}

export interface MonthlyReport {
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
  byStrategy: Record<string, { trades: number; winRate: number; avgR: number; pnl: number }>
  byEmotion: Record<string, number>
  byMistake: Record<string, number>
  topLessons: Array<{ lesson: string; count: number }>
}

const STORAGE_KEY = 'tj_journals'

let journalIdCounter = Date.now()

export function generateJournalId(): string {
  return `jrn-${++journalIdCounter}`
}

export function loadJournals(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveJournals(journals: JournalEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journals))
}

export function addJournal(entry: JournalEntry): void {
  const journals = loadJournals()
  journals.unshift(entry)
  saveJournals(journals)
}

export function updateJournal(id: string, changes: Partial<JournalEntry>): void {
  const journals = loadJournals()
  const idx = journals.findIndex(j => j.id === id)
  if (idx !== -1) {
    journals[idx] = { ...journals[idx], ...changes }
    saveJournals(journals)
  }
}

export function deleteJournal(id: string): void {
  saveJournals(loadJournals().filter(j => j.id !== id))
}

export function getJournalsByDateRange(start: number, end: number): JournalEntry[] {
  return loadJournals().filter(j => j.exitTime >= start && j.exitTime <= end)
}

export function generateMonthlyReport(year: number, month: number): MonthlyReport {
  const start = new Date(year, month - 1, 1).getTime() / 1000
  const end = new Date(year, month, 0, 23, 59, 59).getTime() / 1000
  const trades = getJournalsByDateRange(start, end)

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl < 0)
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const avgR = trades.length > 0 ? trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length : 0

  const byStrategy: Record<string, { trades: number; winRate: number; avgR: number; pnl: number }> = {}
  for (const t of trades) {
    for (const tag of t.strategyTags) {
      if (!byStrategy[tag]) byStrategy[tag] = { trades: 0, winRate: 0, avgR: 0, pnl: 0 }
      byStrategy[tag].trades++
      byStrategy[tag].pnl += t.pnl
      byStrategy[tag].avgR += t.rMultiple
    }
  }
  for (const key of Object.keys(byStrategy)) {
    const s = byStrategy[key]
    s.winRate = s.trades > 0 ? trades.filter(t => t.strategyTags.includes(key) && t.pnl > 0).length / s.trades : 0
    s.avgR = s.trades > 0 ? s.avgR / s.trades : 0
  }

  const byEmotion: Record<string, number> = {}
  for (const t of trades) for (const e of t.emotionTags) byEmotion[e] = (byEmotion[e] || 0) + 1

  const byMistake: Record<string, number> = {}
  for (const t of trades) for (const m of t.mistakeTags) byMistake[m] = (byMistake[m] || 0) + 1

  const lessonCounts: Record<string, number> = {}
  for (const t of trades) {
    if (t.lessonLearned) lessonCounts[t.lessonLearned] = (lessonCounts[t.lessonLearned] || 0) + 1
  }
  const topLessons = Object.entries(lessonCounts)
    .map(([lesson, count]) => ({ lesson, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    year, month,
    summary: {
      totalTrades: trades.length,
      winRate: trades.length > 0 ? wins.length / trades.length : 0,
      avgR,
      totalPnl,
      maxDrawdown: 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
      expectancy: trades.length > 0 ? totalPnl / trades.length : 0,
    },
    byStrategy,
    byEmotion,
    byMistake,
    topLessons,
  }
}

export function calculateDisciplineScore(journals: JournalEntry[]): number {
  let score = 100
  const penalties: Record<string, number> = {
    fomo: 10, 'no-sl': 15, oversized: 15, 'early-exit': 8, revenge: 20,
    chase: 10, 'ignored-filter': 12, 'no-confirmation': 8, 'tight-sl': 5,
  }
  for (const j of journals) {
    for (const m of j.mistakeTags) score -= penalties[m] || 5
  }
  const goodPct = journals.filter(j => j.mistakeTags.length === 0 && j.executionRating >= 4).length / Math.max(journals.length, 1)
  score += goodPct * 10
  return Math.max(0, Math.min(100, score))
}
