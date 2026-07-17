import { useState, useEffect } from 'react'
import { LEVEL_ORDER, loadSkillState, checkLevelUnlock, checkCertificates, loadCertificates, loadTileProgress, CERTIFICATE_DEFS } from '../../services/learningEngine'
import type { LevelId } from '../../services/learningEngine'

const LEVEL_COLORS: Record<LevelId, string> = {
  foundation: 'emerald',
  intermediate: 'blue',
  advanced: 'purple',
  master: 'amber',
}

const LEVEL_LABELS: Record<LevelId, string> = {
  foundation: 'Foundation Trader',
  intermediate: 'Pattern & Breakout',
  advanced: 'Professional Trader',
  master: 'System Builder',
}

export function SkillProgression() {
  const skill = loadSkillState()
  const certs = loadCertificates()
  const tileP = loadTileProgress()
  const [unlockAnim, setUnlockAnim] = useState<LevelId | null>(null)
  const [expanded, setExpanded] = useState<LevelId | null>(null)

  useEffect(() => {
    for (const def of CERTIFICATE_DEFS) {
      const rec = certs[def.id]
      if (rec?.earned && !rec.displayed) {
        setUnlockAnim(def.level)
        rec.displayed = true
        break
      }
    }
  }, [])

  const levelIdx = LEVEL_ORDER.indexOf(skill.level)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-white">Skill Progression</h2>
      {LEVEL_ORDER.map((level, i) => {
        const isLocked = !skill.unlockedLevels.includes(level)
        const isCurrent = skill.level === level
        const isPast = levelIdx > i
        const certDef = CERTIFICATE_DEFS[i]
        const certRec = certs[certDef.id]
        const earned = certRec?.earned
        const result = checkLevelUnlock(level)
        const tilesForLevel = certDef.tileIds.map(tid => tileP[tid])

        return (
          <div
            key={level}
            className={`rounded-lg border transition-all ${isLocked ? 'opacity-50 grayscale' : ''} ${isCurrent ? 'border-tej-400 ring-1 ring-tej-400/30' : 'border-gray-700'} bg-surface-light`}
          >
            <button
              onClick={() => {
                if (!isLocked) setExpanded(expanded === level ? null : level)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                earned ? 'bg-tej-600 text-white' : isCurrent ? 'bg-tej-600/30 text-tej-400' : 'bg-gray-700 text-gray-500'
              }`}>
                {earned ? '✓' : i + 1}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-xs font-semibold text-white">{LEVEL_LABELS[level]}</div>
                <div className="text-[10px] text-gray-500">{isLocked ? '🔒 Locked' : isCurrent ? '◉ In Progress' : earned ? '✓ Completed' : '◉ In Progress'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 font-mono">
                  {tilesForLevel.filter(t => t?.status === 'completed').length}/{certDef.tileIds.length}
                </div>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full mt-0.5 overflow-hidden">
                  <div className={`h-full rounded-full ${earned ? 'bg-tej-500' : isCurrent ? 'bg-tej-500/50' : 'bg-gray-600'}`}
                    style={{ width: `${tilesForLevel.length > 0 ? tilesForLevel.filter(t => t?.status === 'completed').length / certDef.tileIds.length * 100 : 0}%` }} />
                </div>
              </div>
            </button>

            {expanded === level && !isLocked && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {Object.entries(result.progress).map(([key, val]) => (
                    <div key={key} className={`flex justify-between px-2 py-1 rounded ${val.met ? 'bg-tej-600/10 text-tej-400' : 'bg-gray-800 text-gray-500'}`}>
                      <span>{key}</span>
                      <span className="font-mono">{val.met ? '✓' : `${val.current}/${val.required}`}</span>
                    </div>
                  ))}
                </div>
                {i < LEVEL_ORDER.length - 1 && (
                  <div className="text-[9px] text-gray-600 text-center pt-1">
                    {isCurrent ? 'Complete all requirements to unlock next level' : earned ? 'Next level available' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {unlockAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setUnlockAnim(null)}>
          <div className="bg-surface border border-tej-500 rounded-xl shadow-2xl p-6 text-center max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-lg font-bold text-white mb-1">Level Unlocked!</h3>
            <p className="text-tej-400 font-semibold">{LEVEL_LABELS[unlockAnim]}</p>
            <p className="text-xs text-gray-400 mt-2">You've earned the next tier. Keep progressing!</p>
            <button onClick={() => setUnlockAnim(null)} className="mt-4 px-6 py-2 bg-tej-600 hover:bg-tej-500 rounded text-sm font-medium text-white">
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PhaseIcon({ phase, active }: { phase: string; active: boolean }) {
  const icons: Record<string, string> = { foundation: '🌱', intermediate: '🔍', advanced: '⚡', master: '🏆' }
  return <span className={`text-lg ${active ? '' : 'opacity-30'}`}>{icons[phase] || '○'}</span>
}
