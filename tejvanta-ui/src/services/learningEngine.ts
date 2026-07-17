import type { StrategyTile } from './trainingEngine'
import { calculateDisciplineScore, loadJournals } from './journalEngine'
import type { JournalEntry } from './journalEngine'
import { getTotalXPEarned, getOverallChallengeProgress } from './challengeEngine'
import { getQuizStreak, getTotalQuestions } from './quizEngine'

const STORAGE_TILE = 'tj_tile_progress'
const STORAGE_SKILL = 'tj_skill_state'
const STORAGE_CERTS = 'tj_certificates'
const STORAGE_XP = 'tj_xp'
const STORAGE_ACHIEVEMENTS = 'tj_achievements'
const STORAGE_STREAK = 'tj_streak'

export type TileStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface TileProgress {
  tileId: string
  status: TileStatus
  practiceTrades: number
  replaySessions: number
  journalEntries: number
  quizzesPassed: number
  challengesCompleted: number
  lastActivity: number
  startedAt: number
  completedAt?: number
}

export type LevelId = 'foundation' | 'intermediate' | 'advanced' | 'master'

export interface SkillState {
  level: LevelId
  unlockedLevels: LevelId[]
  completedAt: Record<string, number>
  unlockedAt: Record<string, number>
}

export interface CertificateRecord {
  certificateId: string
  earned: boolean
  earnedAt?: number
  displayed: boolean
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

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (state: AchievementState) => boolean
  unlockedAt?: number
}

export interface AchievementState {
  tilesCompleted: string[]
  challengesCompleted: number
  journalEntries: number
  quizzesPassed: number
  disciplineScore: number
  totalTrades: number
  quizStreak: number
  totalXp: number
  strategyCount: number
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-first-trade', name: 'First Steps', description: 'Place your first trade', icon: '🎯', condition: s => s.totalTrades >= 1 },
  { id: 'ach-10-trades', name: 'Getting Started', description: 'Place 10 trades', icon: '📈', condition: s => s.totalTrades >= 10 },
  { id: 'ach-100-trades', name: 'Experienced Trader', description: 'Place 100 trades', icon: '💼', condition: s => s.totalTrades >= 100 },
  { id: 'ach-first-journal', name: 'Journal Keeper', description: 'Write your first journal entry', icon: '📝', condition: s => s.journalEntries >= 1 },
  { id: 'ach-10-journals', name: 'Diligent Recorder', description: 'Write 10 journal entries', icon: '📚', condition: s => s.journalEntries >= 10 },
  { id: 'ach-first-quiz', name: 'Scholar', description: 'Pass your first quiz', icon: '🎓', condition: s => s.quizzesPassed >= 1 },
  { id: 'ach-all-quizzes', name: 'Quiz Champion', description: 'Pass quizzes for all 13 tiles', icon: '🏅', condition: s => s.quizzesPassed >= 13 },
  { id: 'ach-first-challenge', name: 'Challenger', description: 'Complete your first challenge', icon: '⚔️', condition: s => s.challengesCompleted >= 1 },
  { id: 'ach-5-challenges', name: 'Challenge Seeker', description: 'Complete 5 challenges', icon: '🛡️', condition: s => s.challengesCompleted >= 5 },
  { id: 'ach-10-challenges', name: 'Challenge Master', description: 'Complete 10 challenges', icon: '👑', condition: s => s.challengesCompleted >= 10 },
  { id: 'ach-all-challenges', name: 'Completionist', description: 'Complete all challenges', icon: '💎', condition: s => s.challengesCompleted >= 27 },
  { id: 'ach-disc-70', name: 'Disciplined', description: 'Reach 70 discipline score', icon: '🧘', condition: s => s.disciplineScore >= 70 },
  { id: 'ach-disc-90', name: 'Master of Discipline', description: 'Reach 90 discipline score', icon: '🧠', condition: s => s.disciplineScore >= 90 },
  { id: 'ach-quiz-streak-3', name: 'Quiz Streak', description: 'Pass 3 quizzes in a row within 3 days each', icon: '🔥', condition: s => s.quizStreak >= 3 },
  { id: 'ach-quiz-streak-7', name: 'Learning Machine', description: '7 quiz passing streak', icon: '🤖', condition: s => s.quizStreak >= 7 },
  { id: 'ach-xp-500', name: 'XP Apprentice', description: 'Earn 500 XP from challenges', icon: '⭐', condition: s => s.totalXp >= 500 },
  { id: 'ach-xp-1000', name: 'XP Warrior', description: 'Earn 1000 XP from challenges', icon: '🌟', condition: s => s.totalXp >= 1000 },
  { id: 'ach-xp-2000', name: 'XP Legend', description: 'Earn 2000 XP from challenges', icon: '💫', condition: s => s.totalXp >= 2000 },
  { id: 'ach-foundation', name: 'Foundation Graduate', description: 'Earn Foundation certificate', icon: '🌱', condition: s => s.tilesCompleted.includes('tile-ema-pullback') && s.tilesCompleted.includes('tile-rsi-mean-reversion') && s.tilesCompleted.includes('tile-simple-breakout') },
  { id: 'ach-intermediate', name: 'Pattern Master', description: 'Earn Intermediate certificate', icon: '🔍', condition: s => s.tilesCompleted.includes('tile-breakout-retest') && s.tilesCompleted.includes('tile-mtf-confluence') },
  { id: 'ach-5-strategies', name: 'Strategy Collector', description: 'Trade using 5 different strategies', icon: '🗂️', condition: s => s.strategyCount >= 5 },
  { id: 'ach-10-strategies', name: 'Strategy Omnivore', description: 'Trade using 10 different strategies', icon: '📋', condition: s => s.strategyCount >= 10 },
]

export interface StreakState {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string   // YYYY-MM-DD
  dailyActivity: Record<string, { trades: number; quizzes: number; journals: number }>
}

export interface LearningAnalytics {
  totalTrades: number
  totalReplays: number
  tilesCompleted: number
  totalTiles: number
  patternsMastered: number
  challengesCompleted: number
  totalChallenges: number
  currentLevel: string
  disciplineScore: number
  mistakesReduced: number
  emotionalStability: number
  riskDiscipline: number
  mistakeBreakdown: Record<string, number>
  emotionBreakdown: Record<string, number>
  strategyPerformance: Array<{ strategy: string; trades: number; winRate: number; avgR: number; totalPnl: number }>
  weeklyProgress: Array<{ week: string; trades: number; winRate: number; disciplineScore: number }>
  totalXp: number
  currentStreak: number
  longestStreak: number
}

export const TILE_COMPLETION_CRITERIA: Record<string, { practiceTrades: number; replaySessions: number; journalEntries: number; quizzesPassed: number; disciplineScore: number }> = {
  'tile-ema-pullback': { practiceTrades: 5, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 60 },
  'tile-rsi-mean-reversion': { practiceTrades: 5, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 60 },
  'tile-simple-breakout': { practiceTrades: 8, replaySessions: 3, journalEntries: 4, quizzesPassed: 3, disciplineScore: 65 },
  'tile-breakout-retest': { practiceTrades: 8, replaySessions: 3, journalEntries: 4, quizzesPassed: 3, disciplineScore: 65 },
  'tile-mtf-confluence': { practiceTrades: 10, replaySessions: 3, journalEntries: 5, quizzesPassed: 3, disciplineScore: 70 },
  'tile-flag-breakout': { practiceTrades: 6, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 65 },
  'tile-pennant-breakout': { practiceTrades: 6, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 65 },
  'tile-m-pattern-reversal': { practiceTrades: 6, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 65 },
  'tile-w-pattern-reversal': { practiceTrades: 6, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 65 },
  'tile-options-directional': { practiceTrades: 5, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 60 },
  'tile-options-spread': { practiceTrades: 5, replaySessions: 2, journalEntries: 3, quizzesPassed: 2, disciplineScore: 60 },
  'tile-volatility-breakout': { practiceTrades: 8, replaySessions: 3, journalEntries: 4, quizzesPassed: 3, disciplineScore: 70 },
  'tile-system-builder': { practiceTrades: 20, replaySessions: 5, journalEntries: 10, quizzesPassed: 4, disciplineScore: 75 },
}

export const CERTIFICATE_DEFS = [
  { id: 'cert-foundation', level: 'foundation' as LevelId, name: 'Foundation Trader', tileIds: ['tile-ema-pullback', 'tile-rsi-mean-reversion', 'tile-simple-breakout'], minDiscipline: 60, maxDrawdown: 20, replays: 3 },
  { id: 'cert-intermediate', level: 'intermediate' as LevelId, name: 'Pattern & Breakout Trader', tileIds: ['tile-breakout-retest', 'tile-mtf-confluence', 'tile-flag-breakout', 'tile-pennant-breakout'], minDiscipline: 65, maxDrawdown: 15, replays: 5 },
  { id: 'cert-advanced', level: 'advanced' as LevelId, name: 'Professional Trader', tileIds: ['tile-m-pattern-reversal', 'tile-w-pattern-reversal', 'tile-options-directional', 'tile-options-spread', 'tile-volatility-breakout'], minDiscipline: 75, maxDrawdown: 12, replays: 8 },
  { id: 'cert-master', level: 'master' as LevelId, name: 'System Builder', tileIds: ['tile-system-builder'], minDiscipline: 85, maxDrawdown: 10, replays: 12 },
]

export const LEVEL_ORDER: LevelId[] = ['foundation', 'intermediate', 'advanced', 'master']

// --- Tile Progress ---

export function loadTileProgress(): Record<string, TileProgress> {
  try { return JSON.parse(localStorage.getItem(STORAGE_TILE) || '{}') } catch { return {} }
}

export function saveTileProgress(p: Record<string, TileProgress>): void {
  localStorage.setItem(STORAGE_TILE, JSON.stringify(p))
}

export function ensureTileProgress(tiles: StrategyTile[]): Record<string, TileProgress> {
  const p = loadTileProgress()
  let changed = false
  for (const t of tiles) {
    if (!p[t.id]) {
      p[t.id] = { tileId: t.id, status: 'available', practiceTrades: 0, replaySessions: 0, journalEntries: 0, quizzesPassed: 0, challengesCompleted: 0, lastActivity: 0, startedAt: 0 }
      changed = true
    }
  }
  if (changed) saveTileProgress(p)
  return p
}

export function getTileProgress(tileId: string): number {
  const p = loadTileProgress()[tileId]
  if (!p) return 0
  const c = TILE_COMPLETION_CRITERIA[tileId]
  if (!c) return p.status === 'completed' ? 100 : 0
  const checks = [
    p.practiceTrades / c.practiceTrades,
    p.replaySessions / c.replaySessions,
    p.journalEntries / c.journalEntries,
    p.quizzesPassed / c.quizzesPassed,
  ].map(v => Math.min(v, 1))
  return Math.round(checks.reduce((a, b) => a + b, 0) / checks.length * 100)
}

export function isTileCompleted(tileId: string): boolean {
  const p = loadTileProgress()[tileId]
  if (!p) return false
  if (p.status === 'completed') return true
  const c = TILE_COMPLETION_CRITERIA[tileId]
  if (!c) return false
  const disc = calculateDisciplineScore(loadJournals())
  const done = p.practiceTrades >= c.practiceTrades && p.replaySessions >= c.replaySessions &&
    p.journalEntries >= c.journalEntries && p.quizzesPassed >= c.quizzesPassed && disc >= c.disciplineScore
  if (done) {
    p.status = 'completed'
    p.completedAt = Date.now() / 1000
    saveTileProgress({ ...loadTileProgress(), [tileId]: p })
  }
  return done
}

export function updateTileProgress(tileId: string, changes: Partial<TileProgress>): void {
  const all = loadTileProgress()
  const p = all[tileId]
  if (!p) return
  all[tileId] = { ...p, ...changes, lastActivity: Date.now() / 1000 }
  if (!p.startedAt && (changes.practiceTrades || changes.replaySessions)) all[tileId].startedAt = Date.now() / 1000
  saveTileProgress(all)
}

// --- Skill State ---

export function loadSkillState(): SkillState {
  try {
    const raw = localStorage.getItem(STORAGE_SKILL)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { level: 'foundation', unlockedLevels: ['foundation'], completedAt: {}, unlockedAt: { foundation: Date.now() / 1000 } }
}

export function saveSkillState(s: SkillState): void {
  localStorage.setItem(STORAGE_SKILL, JSON.stringify(s))
}

// --- Streak ---

export function getDefaultStreak(): StreakState {
  return { currentStreak: 0, longestStreak: 0, lastActivityDate: '', dailyActivity: {} }
}

export function loadStreak(): StreakState {
  try { return JSON.parse(localStorage.getItem(STORAGE_STREAK) || JSON.stringify(getDefaultStreak())) } catch { return getDefaultStreak() }
}

export function saveStreak(s: StreakState): void {
  localStorage.setItem(STORAGE_STREAK, JSON.stringify(s))
}

export function addDailyActivity(type: 'trades' | 'quizzes' | 'journals', count = 1): void {
  const s = loadStreak()
  const today = new Date().toISOString().slice(0, 10)
  if (!s.dailyActivity[today]) s.dailyActivity[today] = { trades: 0, quizzes: 0, journals: 0 }
  s.dailyActivity[today][type] += count

  if (!s.lastActivityDate) {
    s.currentStreak = 1
  } else {
    const last = new Date(s.lastActivityDate)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (86400000))
    if (diffDays === 0) {
      // same day, no change
    } else if (diffDays === 1) {
      s.currentStreak += 1
    } else {
      s.currentStreak = 1
    }
  }
  s.lastActivityDate = today
  if (s.currentStreak > s.longestStreak) s.longestStreak = s.currentStreak
  saveStreak(s)
}

// --- XP ---

export function loadXP(): number {
  try { return parseInt(localStorage.getItem(STORAGE_XP) || '0') } catch { return 0 }
}

export function addXP(amount: number): void {
  const cur = loadXP()
  localStorage.setItem(STORAGE_XP, String(cur + amount))
}

// --- Achievements ---

export function loadAchievements(): Record<string, Achievement> {
  try { return JSON.parse(localStorage.getItem(STORAGE_ACHIEVEMENTS) || '{}') } catch { return {} }
}

export function saveAchievements(a: Record<string, Achievement>): void {
  localStorage.setItem(STORAGE_ACHIEVEMENTS, JSON.stringify(a))
}

export function checkAndAwardAchievements(): Achievement[] {
  const all = loadAchievements()
  const tileProgress = loadTileProgress()
  const journals = loadJournals()
  const challengeProgress = getOverallChallengeProgress()
  const streak = loadStreak()
  const totalXp = loadXP() + getTotalXPEarned()

  const completedTiles = Object.values(tileProgress).filter(t => t.status === 'completed').map(t => t.tileId)
  const usedStrategies = [...new Set(journals.flatMap(j => j.strategyTags))]

  const state: AchievementState = {
    tilesCompleted: completedTiles,
    challengesCompleted: challengeProgress.completed,
    journalEntries: journals.length,
    quizzesPassed: completedTiles.length,
    disciplineScore: calculateDisciplineScore(loadJournals()),
    totalTrades: journals.length,
    quizStreak: getQuizStreak(),
    totalXp,
    strategyCount: usedStrategies.length,
  }

  const newlyUnlocked: Achievement[] = []
  for (const ach of ACHIEVEMENTS) {
    if (all[ach.id]?.unlockedAt) continue
    if (ach.condition(state)) {
      ach.unlockedAt = Date.now() / 1000
      all[ach.id] = ach
      newlyUnlocked.push(ach)
      const bonus = ach.id.startsWith('ach-xp-') ? 100 : ach.id.startsWith('ach-10-challenges') ? 200 : 50
      addXP(bonus)
    }
  }
  saveAchievements(all)
  return newlyUnlocked
}

// --- Level Unlock ---

export function checkLevelUnlock(targetLevel: LevelId): { unlocked: boolean; progress: Record<string, { met: boolean; current: number; required: number | string }> } {
  const allTiles = loadTileProgress()
  const disc = calculateDisciplineScore(loadJournals())
  const certs = loadCertificates()
  const prevIdx = LEVEL_ORDER.indexOf(targetLevel) - 1
  if (prevIdx < 0) return { unlocked: true, progress: {} }
  const prevCert = CERTIFICATE_DEFS[prevIdx]
  const prevRecord = certs[prevCert.id]
  const tilesDone = prevCert.tileIds.every(tid => allTiles[tid]?.status === 'completed')
  const meetsDisc = disc >= prevCert.minDiscipline
  const certEarned = prevRecord?.earned || false
  const unlocked = tilesDone && meetsDisc && certEarned
  return {
    unlocked,
    progress: {
      'Required Tiles': { met: tilesDone, current: prevCert.tileIds.filter(t => allTiles[t]?.status === 'completed').length, required: prevCert.tileIds.length },
      'Discipline Score': { met: meetsDisc, current: disc, required: prevCert.minDiscipline },
      'Previous Certificate': { met: certEarned, current: certEarned ? 1 : 0, required: 1 },
    },
  }
}

// --- Certificates ---

export function loadCertificates(): Record<string, CertificateRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_CERTS)
    if (raw) return JSON.parse(raw)
  } catch {}
  const r: Record<string, CertificateRecord> = {}
  for (const c of CERTIFICATE_DEFS) r[c.id] = { certificateId: c.id, earned: false, displayed: false, criteriaProgress: { tilesCompleted: [], challengesCompleted: [], disciplineScore: 0, maxDrawdown: 100, quizzesPassed: [], replaysCompleted: 0, hasCustomStrategy: false, hasBacktest: false } }
  return r
}

export function saveCertificates(c: Record<string, CertificateRecord>): void {
  localStorage.setItem(STORAGE_CERTS, JSON.stringify(c))
}

export function checkCertificates(): CertificateRecord[] {
  const certs = loadCertificates()
  const allTiles = loadTileProgress()
  const journals = loadJournals()
  const disc = calculateDisciplineScore(journals)
  const newEarnings: CertificateRecord[] = []
  for (const def of CERTIFICATE_DEFS) {
    const rec = certs[def.id]
    if (!rec || rec.earned) continue
    const tilesDone = def.tileIds.every(tid => allTiles[tid]?.status === 'completed')
    const meetsDisc = disc >= def.minDiscipline
    if (tilesDone && meetsDisc) {
      rec.earned = true
      rec.earnedAt = Date.now() / 1000
      rec.criteriaProgress = { ...rec.criteriaProgress, disciplineScore: disc }
      newEarnings.push(rec)
    }
  }
  saveCertificates(certs)
  return newEarnings
}

// --- Analytics ---

export function computeAnalytics(): LearningAnalytics {
  const journals = loadJournals()
  const tileP = loadTileProgress()
  const skill = loadSkillState()
  const disc = calculateDisciplineScore(journals)

  const now = Date.now() / 1000
  const d30 = now - 30 * 86400
  const recent = journals.filter(j => j.exitTime >= d30)
  const older = journals.filter(j => j.exitTime < d30)
  const oldDisc = calculateDisciplineScore(older)
  const recentMistakes = recent.reduce((s, j) => s + j.mistakeTags.length, 0)
  const oldMistakes = older.reduce((s, j) => s + j.mistakeTags.length, 0)
  const mistakesReduced = oldMistakes > 0 ? Math.round((1 - recentMistakes / Math.max(oldMistakes, 1)) * 100) : 0

  const mb: Record<string, number> = {}
  for (const j of journals) for (const m of j.mistakeTags) mb[m] = (mb[m] || 0) + 1
  const eb: Record<string, number> = {}
  for (const j of journals) for (const e of j.emotionTags) eb[e] = (eb[e] || 0) + 1

  const posEm = ['confident', 'focused', 'neutral']
  const negEm = ['anxious', 'impatient', 'regret', 'fearful', 'greedy']
  const posC = Object.entries(eb).filter(([e]) => posEm.includes(e)).reduce((s, [, c]) => s + c, 0)
  const negC = Object.entries(eb).filter(([e]) => negEm.includes(e)).reduce((s, [, c]) => s + c, 0)
  const emStability = posC + negC > 0 ? Math.round(posC / (posC + negC) * 100) : 50
  const withSL = journals.filter(j => j.mistakeTags.includes('no-sl')).length
  const riskDisc = journals.length > 0 ? Math.round((1 - withSL / journals.length) * 100) : 100

  const stratStats: Record<string, { trades: number; wins: number; totalR: number; pnl: number }> = {}
  for (const j of journals) for (const s of j.strategyTags) {
    if (!stratStats[s]) stratStats[s] = { trades: 0, wins: 0, totalR: 0, pnl: 0 }
    stratStats[s].trades++
    if (j.pnl > 0) stratStats[s].wins++
    stratStats[s].totalR += j.rMultiple
    stratStats[s].pnl += j.pnl
  }
  const sp = Object.entries(stratStats).map(([s, st]) => ({ strategy: s, trades: st.trades, winRate: st.trades > 0 ? st.wins / st.trades : 0, avgR: st.trades > 0 ? st.totalR / st.trades : 0, totalPnl: st.pnl })).sort((a, b) => b.trades - a.trades)

  const wp: LearningAnalytics['weeklyProgress'] = []
  for (let i = 29; i >= 0; i--) {
    const ds = now - (i + 1) * 86400
    const de = now - i * 86400
    const dt = journals.filter(j => j.exitTime >= ds && j.exitTime < de)
    if (dt.length > 0) wp.push({ week: new Date(ds * 1000).toISOString().slice(0, 10), trades: dt.length, winRate: dt.filter(t => t.pnl > 0).length / dt.length, disciplineScore: calculateDisciplineScore(dt) })
  }

  const patterns = new Set(journals.filter(j => j.patternType).map(j => j.patternType))
  const challengeProgress = getOverallChallengeProgress()
  const streak = loadStreak()
  const xp = loadXP() + getTotalXPEarned()
  return {
    totalTrades: journals.length,
    totalReplays: 0,
    tilesCompleted: Object.values(tileP).filter(t => t.status === 'completed').length,
    totalTiles: Object.keys(TILE_COMPLETION_CRITERIA).length,
    patternsMastered: patterns.size,
    challengesCompleted: challengeProgress.completed,
    totalChallenges: challengeProgress.total,
    currentLevel: skill.level,
    disciplineScore: disc,
    mistakesReduced,
    emotionalStability: emStability,
    riskDiscipline: riskDisc,
    mistakeBreakdown: mb,
    emotionBreakdown: eb,
    strategyPerformance: sp,
    weeklyProgress: wp,
    totalXp: xp,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
  }
}
