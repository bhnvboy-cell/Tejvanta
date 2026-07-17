import { useState, useMemo, useEffect } from 'react'
import { STRATEGY_TILES, type TileLevel, type StrategyTile } from '../services/trainingEngine'
import { StrategyTileCard, LEVELS } from '../components/training/StrategyTileCard'
import { TileDetailPanel } from '../components/training/TileDetailPanel'
import { AnalyticsDashboard } from '../components/training/AnalyticsDashboard'
import { SkillProgression } from '../components/training/SkillProgression'
import { QuizModal } from '../components/training/QuizModal'
import { ensureTileProgress, updateTileProgress, addXP, addDailyActivity, checkAndAwardAchievements, loadXP, loadStreak, loadTileProgress } from '../services/learningEngine'
import { evaluateChallenge, getChallengesForTile } from '../services/challengeEngine'

type ViewMode = 'tiles' | 'analytics' | 'progression'

const LEVEL_DESC: Record<string, string> = {
  Beginner: 'Chart literacy, basic indicators, simple execution discipline.',
  Intermediate: 'Pattern mastery, breakout logic, multi-timeframe confluence.',
  Advanced: 'Price action, options, volatility, scenario-based trading.',
  Master: 'Build and refine personal trading systems.',
}

export function LearningPage() {
  const [view, setView] = useState<ViewMode>('tiles')
  const [activeLevel, setActiveLevel] = useState<TileLevel | null>(null)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)
  const [quizTileId, setQuizTileId] = useState<string | null>(null)
  const [challengeTileId, setChallengeTileId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { ensureTileProgress(STRATEGY_TILES) }, [])

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t) }
  }, [toast])

  const selectedTile = useMemo(
    () => selectedTileId ? STRATEGY_TILES.find(t => t.id === selectedTileId) ?? null : null,
    [selectedTileId],
  )

  const filteredTiles = useMemo(
    () => activeLevel ? STRATEGY_TILES.filter(t => t.level === activeLevel) : STRATEGY_TILES,
    [activeLevel],
  )

  const groupedByLevel = useMemo(() => {
    const map: Record<string, typeof STRATEGY_TILES> = {}
    for (const tile of STRATEGY_TILES) {
      if (!map[tile.level]) map[tile.level] = []
      map[tile.level].push(tile)
    }
    return map
  }, [])

  const xp = loadXP()
  const streak = loadStreak()
  const allTileProgress = loadTileProgress()
  const completedCount = Object.values(allTileProgress).filter(t => t.status === 'completed').length
  const totalTiles = STRATEGY_TILES.length

  const recommendedTile = useMemo<StrategyTile | null>(() => {
    const incomplete = STRATEGY_TILES.filter(t => {
      const p = allTileProgress[t.id]
      return !p || p.status !== 'completed'
    })
    if (incomplete.length === 0) return null
    const levelOrder: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Master: 3 }
    incomplete.sort((a, b) => (levelOrder[a.level] ?? 0) - (levelOrder[b.level] ?? 0))
    return incomplete[0]
  }, [allTileProgress])

  const showToast = (msg: string) => setToast(msg)

  const handleQuizComplete = (passed: boolean, xp: number, achievements: string[]) => {
    if (quizTileId) {
      if (passed) {
        updateTileProgress(quizTileId, { quizzesPassed: (loadTileProgressVal(quizTileId)?.quizzesPassed ?? 0) + 1 })
        let msg = `✓ Quiz passed! +${xp} XP`
        if (achievements.length > 0) msg += ` 🏅 ${achievements.join(', ')}`
        showToast(msg)
      } else {
        showToast('✗ Quiz not passed. Review and try again.')
      }
    }
    setQuizTileId(null)
  }

  const handleChallenge = (tileId: string) => {
    const challenges = getChallengesForTile(tileId)
    if (challenges.length === 0) return
    const results = challenges.map(c => evaluateChallenge(c.id))
    const completed = results.filter(r => r.status === 'completed')
    if (completed.length > 0) {
      const totalXp = challenges.filter(c => completed.find(r => r.challengeId === c.id)).reduce((s, c) => s + c.xp, 0)
      addXP(totalXp)
      addDailyActivity('trades')
      const newAchs = checkAndAwardAchievements()
      let msg = `🏆 Challenge${completed.length > 1 ? 's' : ''} completed! +${totalXp} XP`
      if (newAchs.length > 0) msg += ` 🏅 ${newAchs.map(a => a.name).join(', ')}`
      showToast(msg)
      updateTileProgress(tileId, { challengesCompleted: completed.length })
    } else {
      const prog = results[0]
      showToast(`Challenge: ${prog.currentTrades}/${challenges[0].minTrades} trades, ${(prog.currentAvgR).toFixed(1)} avg R`)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Learning Hub</h1>
              <p className="text-sm text-gray-400 mt-1">Master trading through strategy modules, quizzes, and challenges</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className="text-cyan-400 font-bold text-lg">{xp}</div>
                <div className="text-gray-500">XP</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold text-lg">{completedCount}/{totalTiles}</div>
                <div className="text-gray-500">Tiles</div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-bold text-lg">{streak.currentStreak}</div>
                <div className="text-gray-500">🔥 Streak</div>
              </div>
            </div>
          </div>

          {recommendedTile && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-tej-600/10 border border-tej-600/30 rounded-lg">
              <span className="text-tej-400 text-sm">▶</span>
              <span className="text-gray-300 text-xs">Next up:</span>
              <button onClick={() => setSelectedTileId(recommendedTile.id)} className="text-tej-400 text-xs font-medium hover:underline">
                {recommendedTile.title}
              </button>
              <span className={`ml-1 px-1 py-0.5 rounded text-[9px] font-semibold ${
                recommendedTile.level === 'Beginner' ? 'bg-green-700 text-green-200' :
                recommendedTile.level === 'Intermediate' ? 'bg-blue-700 text-blue-200' :
                recommendedTile.level === 'Advanced' ? 'bg-purple-700 text-purple-200' : 'bg-orange-700 text-orange-200'
              }`}>{recommendedTile.level}</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 mb-6 bg-surface-light rounded-lg p-1 border border-gray-700">
          {(['tiles', 'analytics', 'progression'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded text-sm font-medium transition capitalize ${view === v ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {v === 'progression' ? 'Progress' : v}
            </button>
          ))}
        </div>

        {view === 'tiles' && (
          <>
            <div className="flex gap-1 mb-6 bg-surface-light rounded-lg p-1 border border-gray-700">
              <button onClick={() => setActiveLevel(null)}
                className={`px-4 py-2 rounded text-sm font-medium transition ${!activeLevel ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                All Levels
              </button>
              {LEVELS.map(l => (
                <button key={l.key} onClick={() => setActiveLevel(l.key as TileLevel)}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${activeLevel === l.key ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {l.label}
                </button>
              ))}
            </div>

            {activeLevel ? (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white">{activeLevel}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{LEVEL_DESC[activeLevel]}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredTiles.map(tile => (
                    <StrategyTileCard key={tile.id} tile={tile} onSelect={setSelectedTileId} onQuiz={setQuizTileId} onChallenge={handleChallenge} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {LEVELS.map(l => {
                  const tiles = groupedByLevel[l.key] || []
                  return (
                    <section key={l.key}>
                      <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-bold text-white">{l.key}</h2>
                        <span className="text-xs text-gray-500">{tiles.length} modules</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {tiles.map(tile => (
                          <StrategyTileCard key={tile.id} tile={tile} onSelect={setSelectedTileId} onQuiz={setQuizTileId} onChallenge={handleChallenge} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </>
        )}

        {view === 'analytics' && <AnalyticsDashboard />}
        {view === 'progression' && <SkillProgression />}
      </div>

      {selectedTile && (
        <TileDetailPanel tile={selectedTile} onClose={() => setSelectedTileId(null)} />
      )}

      {quizTileId && (
        <QuizModal tileId={quizTileId} onClose={() => setQuizTileId(null)} onComplete={handleQuizComplete} />
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2 bg-gray-800 border border-gray-600 rounded shadow-xl text-xs text-white font-medium">
          {toast}
        </div>
      )}
    </div>
  )
}

function loadTileProgressVal(tileId: string) {
  try {
    const all = JSON.parse(localStorage.getItem('tj_tile_progress') || '{}')
    return all[tileId] || null
  } catch { return null }
}
