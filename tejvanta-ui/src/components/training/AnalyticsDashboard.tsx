import { useState, useEffect } from 'react'
import { computeAnalytics, loadAchievements, ACHIEVEMENTS, loadStreak, loadXP } from '../../services/learningEngine'
import type { LearningAnalytics, Achievement } from '../../services/learningEngine'
import { getTotalXPEarned, getOverallChallengeProgress } from '../../services/challengeEngine'

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null)

  useEffect(() => {
    setAnalytics(computeAnalytics())
  }, [])

  const achievements = loadAchievements()
  const unlockedCount = Object.values(achievements).filter(a => a.unlockedAt).length
  const streak = loadStreak()
  const xp = loadXP() + getTotalXPEarned()
  const challengeProg = getOverallChallengeProgress()

  if (!analytics) return <div className="text-center text-gray-500 py-8 text-sm">Loading analytics...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-white">Learning Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Trades" value={analytics.totalTrades.toString()} />
        <StatCard label="Discipline" value={`${analytics.disciplineScore}`} color={analytics.disciplineScore >= 70 ? 'text-green-400' : analytics.disciplineScore >= 50 ? 'text-yellow-400' : 'text-red-400'} />
        <StatCard label="Tiles Done" value={`${analytics.tilesCompleted}/${analytics.totalTiles}`} />
        <StatCard label="XP" value={xp.toString()} color="text-cyan-400" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Streak" value={`${streak.currentStreak}🔥`} color={streak.currentStreak >= 7 ? 'text-orange-400' : 'text-yellow-400'} />
        <StatCard label="Longest" value={`${streak.longestStreak}d`} color="text-gray-400" />
        <StatCard label="Challenges" value={`${challengeProg.completed}/${challengeProg.total}`} color={challengeProg.completed > 0 ? 'text-green-400' : 'text-gray-400'} />
        <StatCard label="Achievements" value={`${unlockedCount}/${ACHIEVEMENTS.length}`} color={unlockedCount > 0 ? 'text-purple-400' : 'text-gray-400'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-light rounded-lg p-3 border border-gray-700">
          <h3 className="text-[10px] text-gray-500 font-medium mb-2 uppercase">Mistake Breakdown</h3>
          {Object.keys(analytics.mistakeBreakdown).length === 0 && <p className="text-gray-600 text-[10px]">No mistakes recorded</p>}
          {Object.entries(analytics.mistakeBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([m, c]) => (
            <div key={m} className="flex items-center gap-2 py-1">
              <span className="text-[10px] text-red-400 w-20 truncate">{m}</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${Math.min(100, c * 20)}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 font-mono w-6 text-right">{c}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface-light rounded-lg p-3 border border-gray-700">
          <h3 className="text-[10px] text-gray-500 font-medium mb-2 uppercase">Emotion Breakdown</h3>
          {Object.keys(analytics.emotionBreakdown).length === 0 && <p className="text-gray-600 text-[10px]">No emotions recorded</p>}
          {Object.entries(analytics.emotionBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e, c]) => {
            const isPos = ['confident', 'focused', 'neutral'].includes(e)
            return (
              <div key={e} className="flex items-center gap-2 py-1">
                <span className={`text-[10px] w-20 truncate ${isPos ? 'text-green-400' : 'text-yellow-400'}`}>{e}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${isPos ? 'bg-green-500/60' : 'bg-yellow-500/60'}`} style={{ width: `${Math.min(100, c * 20)}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 font-mono w-6 text-right">{c}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-surface-light rounded-lg p-3 border border-gray-700">
        <h3 className="text-[10px] text-gray-500 font-medium mb-2 uppercase">Strategy Performance</h3>
        {analytics.strategyPerformance.length === 0 && <p className="text-gray-600 text-[10px]">No strategy data yet</p>}
        <div className="space-y-1.5">
          {analytics.strategyPerformance.slice(0, 8).map(s => (
            <div key={s.strategy} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-300 w-24 truncate">{s.strategy}</span>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden relative">
                <div className={`h-full rounded-full ${s.winRate >= 0.5 ? 'bg-green-500/50' : 'bg-red-500/50'}`} style={{ width: `${s.winRate * 100}%` }} />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-mono">{s.trades} trades</span>
              </div>
              <span className={`text-[10px] font-mono w-12 text-right ${s.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>{(s.winRate * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-light rounded-lg p-3 border border-gray-700">
        <h3 className="text-[10px] text-gray-500 font-medium mb-2 uppercase">30-Day Progress</h3>
        {analytics.weeklyProgress.length === 0 && <p className="text-gray-600 text-[10px]">No activity this month</p>}
        <div className="flex items-end gap-1 h-16">
          {analytics.weeklyProgress.slice(-20).map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className={`w-full rounded-sm ${w.winRate >= 0.5 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                style={{ height: `${Math.max(4, w.winRate * 100)}%` }} />
              <span className="text-[6px] text-gray-600">{w.trades}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-light rounded-lg p-3 border border-gray-700 text-center">
          <div className="text-[9px] text-gray-500">Emotional Stability</div>
          <div className={`text-lg font-bold font-mono ${analytics.emotionalStability >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>{analytics.emotionalStability}%</div>
        </div>
        <div className="bg-surface-light rounded-lg p-3 border border-gray-700 text-center">
          <div className="text-[9px] text-gray-500">Risk Discipline</div>
          <div className={`text-lg font-bold font-mono ${analytics.riskDiscipline >= 70 ? 'text-green-400' : 'text-red-400'}`}>{analytics.riskDiscipline}%</div>
        </div>
      </div>

      <div className="bg-surface-light rounded-lg p-3 border border-gray-700">
        <h3 className="text-[10px] text-gray-500 font-medium mb-2 uppercase">Achievements ({unlockedCount}/{ACHIEVEMENTS.length})</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {ACHIEVEMENTS.slice(0, 20).map(ach => {
            const unlocked = achievements[ach.id]?.unlockedAt
            return (
              <div key={ach.id} className={`rounded p-1.5 text-center border ${unlocked ? 'bg-gray-700/50 border-yellow-600/40' : 'bg-gray-800/50 border-gray-700/30 opacity-40'}`}>
                <div className="text-sm">{ach.icon}</div>
                <div className={`text-[7px] font-medium leading-tight mt-0.5 ${unlocked ? 'text-yellow-400' : 'text-gray-600'}`}>{ach.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-light rounded-lg p-2.5 border border-gray-700 text-center">
      <div className={`text-xs font-bold font-mono ${color || 'text-white'}`}>{value}</div>
      <div className="text-[9px] text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
