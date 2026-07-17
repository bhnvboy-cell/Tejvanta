import { useState, useMemo, useRef, useEffect } from 'react'
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts'
import type { StrategyTile } from '../../services/trainingEngine'
import { getPatternById, generatePatternData } from '../../services/trainingEngine'
import { TICKER_MAP } from '../../config/defaultWatchlist'
import { TILE_COMPLETION_CRITERIA, loadTileProgress, getTileProgress } from '../../services/learningEngine'
import { getChallengesForTile } from '../../services/challengeEngine'

export function TileDetailPanel({ tile, onClose }: { tile: StrategyTile; onClose: () => void }) {
  const [tab, setTab] = useState<'rules' | 'patterns' | 'replays' | 'progress'>('rules')
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null)

  const tileProgress = useMemo(() => loadTileProgress()[tile.id], [tile.id])
  const criteria = useMemo(() => TILE_COMPLETION_CRITERIA[tile.id], [tile.id])
  const challenges = useMemo(() => getChallengesForTile(tile.id), [tile.id])
  const progressPct = useMemo(() => getTileProgress(tile.id), [tile.id])

  const patterns = useMemo(
    () => tile.mockDataPatterns.map(id => getPatternById(id)).filter((p): p is NonNullable<typeof p> => p != null),
    [tile],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-gray-600 rounded-lg shadow-2xl w-[900px] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">{tile.title}</h2>
            <div className="flex gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                tile.level === 'Beginner' ? 'bg-green-700 text-green-200' :
                tile.level === 'Intermediate' ? 'bg-blue-700 text-blue-200' :
                tile.level === 'Advanced' ? 'bg-purple-700 text-purple-200' : 'bg-orange-700 text-orange-200'
              }`}>{tile.level}</span>
              <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{tile.category}</span>
              {tile.patternType && <span className="px-2 py-0.5 rounded text-xs bg-tej-700/30 text-tej-400">{tile.patternType}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="flex border-b border-gray-700 px-5">
          {(['rules', 'patterns', 'replays', 'progress'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === t ? 'border-tej-500 text-tej-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t === 'rules' ? 'Strategy Rules' : t === 'patterns' ? `Patterns (${patterns.length})` : t === 'replays' ? 'Replays' : `Progress ${progressPct}%`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'rules' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailSection title="Entry Rules" content={tile.entryRules} />
              <DetailSection title="Stop Loss" content={tile.stopLoss} />
              <DetailSection title="Take Profit" content={tile.takeProfit} />
              <DetailSection title="Filters" content={tile.filters} />
              <div className="col-span-2 grid grid-cols-3 gap-4 mt-2">
                <div>
                  <span className="text-gray-500 text-xs">Instruments</span>
                  <p className="text-white font-mono text-xs mt-0.5">{tile.instruments.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Timeframes</span>
                  <p className="text-white font-mono text-xs mt-0.5">{tile.timeframes.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Indicators</span>
                  <p className="text-white font-mono text-xs mt-0.5">{tile.indicators.join(', ')}</p>
                </div>
              </div>
              <div className="col-span-2 border-t border-gray-700 pt-3 mt-2">
                <span className="text-gray-500 text-xs">Evaluation</span>
                <p className="text-gray-300 text-xs mt-1">{tile.evaluationCriteria}</p>
                <p className="text-gray-500 text-xs mt-1">Suggested practice sessions: {tile.practiceSessions}</p>
              </div>
            </div>
          )}

          {tab === 'patterns' && (
            <div className="flex gap-4">
              <div className="w-48 shrink-0 space-y-1">
                {patterns.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatternId(p.id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                      selectedPatternId === p.id ? 'bg-tej-600/20 border border-tej-500 text-tej-400' : 'bg-surface-light text-gray-300 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="font-semibold">{p.id}</div>
                    <div className="text-gray-500 mt-0.5">{p.name}</div>
                  </button>
                ))}
              </div>
              <div className="flex-1">
                {selectedPatternId ? <PatternPreviewChart patternId={selectedPatternId} /> : (
                  <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Select a pattern to preview</div>
                )}
              </div>
            </div>
          )}

          {tab === 'replays' && (
            <div className="text-gray-400 text-sm">
              <p>Replay scenarios for this strategy:</p>
              <ul className="mt-3 space-y-2">
                {tile.replayScenarios.map(scId => (
                  <li key={scId} className="px-3 py-2 bg-surface-light rounded border border-gray-700 flex items-center justify-between">
                    <span className="text-white font-medium">{scId}</span>
                    <button
                      onClick={() => window.location.href = '/replay'}
                      className="px-3 py-1 text-xs bg-tej-600 hover:bg-tej-500 rounded text-white font-medium"
                    >
                      Open Replay
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'progress' && (
            <div className="space-y-4 text-sm">
              {criteria ? (
                <>
                  <div>
                    <h3 className="text-xs font-semibold text-white mb-3">Completion Criteria</h3>
                    <div className="space-y-2">
                      <ProgressRow label="Practice Trades" current={tileProgress?.practiceTrades ?? 0} required={criteria.practiceTrades} />
                      <ProgressRow label="Journal Entries" current={tileProgress?.journalEntries ?? 0} required={criteria.journalEntries} />
                      <ProgressRow label="Replay Sessions" current={tileProgress?.replaySessions ?? 0} required={criteria.replaySessions} />
                      <ProgressRow label="Quizzes Passed" current={tileProgress?.quizzesPassed ?? 0} required={criteria.quizzesPassed} />
                      <ProgressRow label="Discipline Score" current={0} required={criteria.disciplineScore} suffix="pts" />
                    </div>
                  </div>

                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-tej-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{progressPct}% complete — meet all criteria above to finish this module</p>
                </>
              ) : (
                <p className="text-gray-500 text-xs">No completion criteria defined for this module.</p>
              )}

              {challenges.length > 0 && (
                <div className="border-t border-gray-700 pt-3">
                  <h3 className="text-xs font-semibold text-white mb-2">Challenges ({challenges.length})</h3>
                  <div className="space-y-1.5">
                    {challenges.map(ch => (
                      <div key={ch.id} className="px-2 py-1.5 bg-surface-light rounded border border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-200 font-medium">{ch.name}</span>
                          <span className="text-[10px] text-amber-400">+{ch.xp} XP</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{ch.description}</p>
                        <div className="text-[9px] text-gray-600 mt-1">Rules: {ch.rules.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</span>
      <p className="text-gray-200 mt-1 text-xs leading-relaxed">{content}</p>
    </div>
  )
}

function ProgressRow({ label, current, required, suffix }: { label: string; current: number; required: number; suffix?: string }) {
  const pct = required > 0 ? Math.min(100, Math.round(current / required * 100)) : 0
  const met = current >= required
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${met ? 'bg-green-500' : 'bg-tej-500/60'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono w-20 text-right ${met ? 'text-green-400' : 'text-gray-500'}`}>
        {current}/{required}{suffix ? ` ${suffix}` : ''}
      </span>
      {met && <span className="text-green-400 text-[10px]">✓</span>}
    </div>
  )
}

function PatternPreviewChart({ patternId }: { patternId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (chartRef.current) { try { chartRef.current.remove() } catch {}; chartRef.current = null }

    const data = generatePatternData(patternId, TICKER_MAP.TICKER1, 80)
    if (data.length === 0) return

    const chart = createChart(el, {
      width: el.clientWidth || 500,
      height: 280,
      layout: { background: { type: ColorType.Solid, color: '#0f172a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      timeScale: { borderColor: '#334155', timeVisible: false },
      rightPriceScale: { borderColor: '#334155' },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })

    candleSeries.setData(data.map(d => ({ time: d.time as any, open: d.open, high: d.high, low: d.low, close: d.close })))
    chart.timeScale().fitContent()
    chartRef.current = chart

    return () => { try { chart.remove() } catch {} }
  }, [patternId])

  return <div ref={containerRef} className="w-full h-[280px] rounded border border-gray-700" />
}
