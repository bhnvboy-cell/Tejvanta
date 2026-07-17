import { useMemo } from 'react'
import type { StrategyTile } from '../../services/trainingEngine'
import { getTileProgress, isTileCompleted, loadTileProgress, TILE_COMPLETION_CRITERIA } from '../../services/learningEngine'
import { getChallengesForTile } from '../../services/challengeEngine'

const LEVEL_GRADIENT: Record<string, string> = {
  Beginner: 'from-green-600/20 to-green-900/20 border-green-700 hover:border-green-500',
  Intermediate: 'from-blue-600/20 to-blue-900/20 border-blue-700 hover:border-blue-500',
  Advanced: 'from-purple-600/20 to-purple-900/20 border-purple-700 hover:border-purple-500',
  Master: 'from-orange-600/20 to-orange-900/20 border-orange-700 hover:border-orange-500',
}

const LEVEL_BADGE: Record<string, string> = {
  Beginner: 'bg-green-700 text-green-200',
  Intermediate: 'bg-blue-700 text-blue-200',
  Advanced: 'bg-purple-700 text-purple-200',
  Master: 'bg-orange-700 text-orange-200',
}

const CATEGORY_BADGE: Record<string, string> = {
  Trend: 'bg-cyan-700/50 text-cyan-300',
  Breakout: 'bg-yellow-700/50 text-yellow-300',
  Pattern: 'bg-pink-700/50 text-pink-300',
  Options: 'bg-indigo-700/50 text-indigo-300',
  'Mean-Reversion': 'bg-teal-700/50 text-teal-300',
  System: 'bg-gray-700/50 text-gray-300',
}

export function StrategyTileCard({
  tile,
  onSelect,
  onQuiz,
  onChallenge,
}: {
  tile: StrategyTile
  onSelect: (id: string) => void
  onQuiz?: (tileId: string) => void
  onChallenge?: (tileId: string) => void
}) {
  const progress = getTileProgress(tile.id)
  const completed = isTileCompleted(tile.id)
  const tileP = loadTileProgress()[tile.id]
  const challenges = getChallengesForTile(tile.id)
  const criteria = TILE_COMPLETION_CRITERIA[tile.id]

  return (
    <div className={`relative flex flex-col gap-2 p-4 rounded-lg border bg-gradient-to-br ${LEVEL_GRADIENT[tile.level]} transition-all ${completed ? 'border-tej-500/50' : ''}`}>
      {completed && <div className="absolute top-2 right-2 text-[9px] bg-tej-600 text-white px-1.5 py-0.5 rounded font-medium">✓ Done</div>}

      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${LEVEL_BADGE[tile.level]}`}>{tile.level}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_BADGE[tile.category]}`}>{tile.category}</span>
      </div>

      <button onClick={() => onSelect(tile.id)} className="text-left">
        <h3 className="text-sm font-bold text-white hover:text-tej-400 transition">{tile.title}</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mt-0.5">{tile.description}</p>
      </button>

      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${completed ? 'bg-tej-500' : 'bg-tej-500/50'}`} style={{ width: `${progress}%` }} />
      </div>

      {tileP && !completed && criteria && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-gray-500">
          <span>📊 {tileP.practiceTrades}/{criteria.practiceTrades} trades</span>
          <span>📝 {tileP.journalEntries}/{criteria.journalEntries} journals</span>
          <span>🔁 {tileP.replaySessions}/{criteria.replaySessions} replays</span>
          <span>🎯 {tileP.quizzesPassed}/{criteria.quizzesPassed} quizzes</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-auto">
        {tile.instruments.map(inst => (
          <span key={inst} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">{inst}</span>
        ))}
        {tile.timeframes.slice(0, 2).map(tf => (
          <span key={tf} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">{tf}</span>
        ))}
        {tile.patternType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-tej-700/30 text-tej-400">{tile.patternType}</span>}
      </div>

      <div className="flex gap-1.5 mt-1">
        <button onClick={() => onSelect(tile.id)} className="flex-1 px-2 py-1 text-[10px] bg-tej-600/30 hover:bg-tej-600/50 text-tej-400 rounded font-medium transition">Details</button>
        {onQuiz && <button onClick={() => onQuiz(tile.id)} className="px-2 py-1 text-[10px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 rounded font-medium transition">Quiz</button>}
        {onChallenge && challenges.length > 0 && <button onClick={() => onChallenge(tile.id)} className="px-2 py-1 text-[10px] bg-amber-600/30 hover:bg-amber-600/50 text-amber-400 rounded font-medium transition">🏆</button>}
      </div>
    </div>
  )
}

export const LEVELS: Array<{ key: string; label: string }> = [
  { key: 'Beginner', label: 'Foundation' },
  { key: 'Intermediate', label: 'Pattern & Breakout' },
  { key: 'Advanced', label: 'Professional' },
  { key: 'Master', label: 'System Builder' },
]
