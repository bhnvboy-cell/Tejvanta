import { useState, useEffect, useMemo } from 'react'
import { loadJournals, deleteJournal, generateMonthlyReport } from '../../services/journalEngine'
import type { JournalEntry, MonthlyReport } from '../../services/journalEngine'
import { calculateDisciplineScore } from '../../services/journalEngine'

const EMOTION_OPTIONS = ['confident', 'focused', 'anxious', 'impatient', 'neutral', 'regret', 'fearful', 'greedy']
const MISTAKE_OPTIONS = ['fomo', 'no-sl', 'oversized', 'early-exit', 'revenge', 'chase', 'ignored-filter', 'no-confirmation', 'tight-sl']
const STRATEGY_OPTIONS = ['tile-ema-pullback', 'tile-rsi-mean-reversion', 'tile-simple-breakout', 'tile-breakout-retest', 'tile-mtf-confluence', 'tile-flag-breakout', 'tile-pennant-breakout', 'tile-m-pattern-reversal', 'tile-w-pattern-reversal', 'tile-options-directional', 'tile-options-spread', 'tile-volatility-breakout', 'tile-system-builder']

export function JournalPanel() {
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [editing, setEditing] = useState<Partial<JournalEntry> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'list' | 'report'>('list')
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => { setJournals(loadJournals()) }, [])

  const refresh = () => setJournals(loadJournals())

  const report = useMemo(() => generateMonthlyReport(reportYear, reportMonth), [reportYear, reportMonth, journals])
  const disciplineScore = useMemo(() => calculateDisciplineScore(journals), [journals])

  const handleDelete = (id: string) => {
    deleteJournal(id)
    refresh()
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex items-center border-b border-gray-700 bg-surface-light">
        <button onClick={() => setView('list')} className={`px-3 py-2 text-xs font-medium ${view === 'list' ? 'text-tej-400 border-b-2 border-tej-400' : 'text-gray-400'}`}>Journal</button>
        <button onClick={() => setView('report')} className={`px-3 py-2 text-xs font-medium ${view === 'report' ? 'text-tej-400 border-b-2 border-tej-400' : 'text-gray-400'}`}>Reports</button>
        <div className="flex-1" />
        <button onClick={() => { setEditing({}); setShowForm(true) }} className="px-2 py-1 mr-2 text-[10px] bg-tej-600 hover:bg-tej-500 rounded text-white font-medium">+ New</button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {view === 'list' ? (
          <>
            {journals.length === 0 && <div className="text-gray-500 text-center py-8">No journal entries yet</div>}
            {journals.map(j => (
              <div
                key={j.id}
                onClick={() => setSelected(selected?.id === j.id ? null : j)}
                className={`px-2 py-1.5 rounded cursor-pointer border ${selected?.id === j.id ? 'border-tej-500 bg-tej-600/10' : 'border-transparent hover:bg-gray-700/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 font-medium">{j.symbol}</span>
                  <span className={`font-mono ${j.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {j.pnl >= 0 ? '+' : ''}{j.pnl.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <span>{new Date(j.exitTime * 1000).toLocaleDateString()}</span>
                  <span>{j.side}</span>
                  <span>R:{j.rMultiple.toFixed(1)}</span>
                  {j.mistakeTags.length > 0 && <span className="text-red-400">⚠</span>}
                </div>
                {selected?.id === j.id && (
                  <div className="mt-2 pt-2 border-t border-gray-700 space-y-1.5">
                    <p className="text-gray-400 text-[10px]">{j.notes || 'No notes'}</p>
                    <div className="flex flex-wrap gap-1">
                      {j.strategyTags.map(t => <span key={t} className="px-1 py-0.5 bg-tej-600/20 text-tej-400 rounded text-[9px]">{t}</span>)}
                      {j.emotionTags.map(t => <span key={t} className="px-1 py-0.5 bg-blue-600/20 text-blue-400 rounded text-[9px]">{t}</span>)}
                      {j.mistakeTags.map(t => <span key={t} className="px-1 py-0.5 bg-red-600/20 text-red-400 rounded text-[9px]">{t}</span>)}
                    </div>
                    {j.lessonLearned && <p className="text-gray-500 text-[10px] italic">"{j.lessonLearned}"</p>}
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(j); setShowForm(true) }} className="text-[10px] text-tej-400 hover:text-tej-300">Edit</button>
                      <button onClick={() => handleDelete(j.id)} className="text-[10px] text-red-400 hover:text-red-300">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="p-2 space-y-3">
            <div className="flex gap-2">
              <select value={reportYear} onChange={e => setReportYear(Number(e.target.value))} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ReportStat label="Total Trades" value={report.summary.totalTrades.toString()} />
              <ReportStat label="Win Rate" value={`${(report.summary.winRate * 100).toFixed(0)}%`} color={report.summary.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'} />
              <ReportStat label="Avg R" value={report.summary.avgR.toFixed(2)} color={report.summary.avgR >= 1 ? 'text-green-400' : 'text-red-400'} />
              <ReportStat label="PnL" value={`${report.summary.totalPnl >= 0 ? '+' : ''}${report.summary.totalPnl.toFixed(0)}`} color={report.summary.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} />
              <ReportStat label="Profit Factor" value={report.summary.profitFactor > 100 ? '∞' : report.summary.profitFactor.toFixed(2)} color={report.summary.profitFactor >= 1.5 ? 'text-green-400' : 'text-yellow-400'} />
              <ReportStat label="Expectancy" value={`₹${report.summary.expectancy.toFixed(0)}`} color={report.summary.expectancy >= 0 ? 'text-green-400' : 'text-red-400'} />
            </div>

            <div>
              <div className="text-gray-500 text-[10px] font-medium mb-1">Discipline Score</div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" style={{ width: `${disciplineScore}%` }} />
              </div>
              <div className="text-right text-white font-mono text-[10px] mt-0.5">{disciplineScore.toFixed(0)}/100</div>
            </div>

            {Object.keys(report.byMistake).length > 0 && (
              <div>
                <div className="text-gray-500 text-[10px] font-medium mb-1">Top Mistakes</div>
                {Object.entries(report.byMistake).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, c]) => (
                  <div key={m} className="flex justify-between text-[10px] py-0.5">
                    <span className="text-red-400">{m}</span>
                    <span className="text-gray-400">{c}x</span>
                  </div>
                ))}
              </div>
            )}

            {report.topLessons.length > 0 && (
              <div>
                <div className="text-gray-500 text-[10px] font-medium mb-1">Top Lessons</div>
                {report.topLessons.slice(0, 3).map((l, i) => (
                  <div key={i} className="text-[10px] text-gray-400 py-0.5 italic">"{l.lesson}"</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <JournalForm
          initial={editing || {}}
          onSave={(data) => {
            const journals = loadJournals()
            if (editing?.id) {
              const idx = journals.findIndex(j => j.id === editing.id)
              if (idx !== -1) { journals[idx] = { ...journals[idx], ...data } as JournalEntry }
            } else {
              journals.unshift(data as JournalEntry)
            }
            localStorage.setItem('tj_journals', JSON.stringify(journals))
            setShowForm(false)
            setEditing(null)
            refresh()
          }}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function ReportStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="text-gray-500 text-[9px]">{label}</div>
      <div className={`font-mono text-xs font-bold mt-0.5 ${color || 'text-white'}`}>{value}</div>
    </div>
  )
}

function JournalForm({ initial, onSave, onClose }: { initial: Partial<JournalEntry>; onSave: (data: Partial<JournalEntry>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<JournalEntry>>({
    symbol: '', side: 'buy', entryPrice: 0, exitPrice: 0, quantity: 1, pnl: 0, rMultiple: 0,
    notes: '', strategyTags: [], emotionTags: [], mistakeTags: [],
    setupRating: 3, executionRating: 3, lessonLearned: '', patternType: null,
    ...initial,
    entryTime: initial.entryTime || Math.floor(Date.now() / 1000) - 3600,
    exitTime: initial.exitTime || Math.floor(Date.now() / 1000),
  })

  const toggleTag = (key: 'strategyTags' | 'emotionTags' | 'mistakeTags', value: string) => {
    const arr = form[key] || []
    setForm({ ...form, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] })
  }

  const handleSave = () => {
    if (!form.symbol) return
    onSave({
      ...form,
      id: form.id || `jrn-${Date.now()}`,
      entryTime: form.entryTime || Math.floor(Date.now() / 1000) - 3600,
      exitTime: form.exitTime || Math.floor(Date.now() / 1000),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-surface border border-gray-600 rounded-lg shadow-xl w-[450px] max-h-[85vh] flex flex-col text-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="font-semibold text-white">{form.id ? 'Edit' : 'New'} Journal Entry</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-gray-500 text-[10px]">Symbol</label><input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
            <div><label className="text-gray-500 text-[10px]">Side</label><select value={form.side} onChange={e => setForm({ ...form, side: e.target.value as any })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs">{['buy', 'sell'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}</select></div>
            <div><label className="text-gray-500 text-[10px]">Qty</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-gray-500 text-[10px]">Entry Price</label><input type="number" step="0.05" value={form.entryPrice} onChange={e => setForm({ ...form, entryPrice: Number(e.target.value) })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
            <div><label className="text-gray-500 text-[10px]">Exit Price</label><input type="number" step="0.05" value={form.exitPrice} onChange={e => setForm({ ...form, exitPrice: Number(e.target.value) })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-gray-500 text-[10px]">PnL</label><input type="number" value={form.pnl} onChange={e => setForm({ ...form, pnl: Number(e.target.value) })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
            <div><label className="text-gray-500 text-[10px]">R Multiple</label><input type="number" step="0.1" value={form.rMultiple} onChange={e => setForm({ ...form, rMultiple: Number(e.target.value) })} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs" /></div>
          </div>
          <div><label className="text-gray-500 text-[10px]">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs resize-none" /></div>
          <div><label className="text-gray-500 text-[10px]">Lesson Learned</label><textarea value={form.lessonLearned} onChange={e => setForm({ ...form, lessonLearned: e.target.value })} rows={1} className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs resize-none" /></div>

          <div><label className="text-gray-500 text-[10px]">Strategies</label><div className="flex flex-wrap gap-1 mt-1">{STRATEGY_OPTIONS.map(t => <TagButton key={t} active={form.strategyTags?.includes(t)} label={t} onClick={() => toggleTag('strategyTags', t)} />)}</div></div>
          <div><label className="text-gray-500 text-[10px]">Emotions</label><div className="flex flex-wrap gap-1 mt-1">{EMOTION_OPTIONS.map(t => <TagButton key={t} active={form.emotionTags?.includes(t)} label={t} onClick={() => toggleTag('emotionTags', t)} />)}</div></div>
          <div><label className="text-gray-500 text-[10px]">Mistakes</label><div className="flex flex-wrap gap-1 mt-1">{MISTAKE_OPTIONS.map(t => <TagButton key={t} active={form.mistakeTags?.includes(t)} label={t} onClick={() => toggleTag('mistakeTags', t)} />)}</div></div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-gray-500 text-[10px]">Setup Rating</label><div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map(v => <button key={v} onClick={() => setForm({ ...form, setupRating: v as any })} className={`px-2 py-1 rounded text-xs ${v <= (form.setupRating || 0) ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{v}</button>)}</div></div>
            <div><label className="text-gray-500 text-[10px]">Execution Rating</label><div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map(v => <button key={v} onClick={() => setForm({ ...form, executionRating: v as any })} className={`px-2 py-1 rounded text-xs ${v <= (form.executionRating || 0) ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{v}</button>)}</div></div>
          </div>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-gray-300">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-sm font-medium text-white">Save</button>
        </div>
      </div>
    </div>
  )
}

function TagButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-1.5 py-0.5 rounded text-[9px] border transition ${active ? 'bg-tej-600/30 border-tej-500 text-tej-400' : 'bg-gray-800 border-gray-600 text-gray-500 hover:border-gray-400'}`}>
      {label}
    </button>
  )
}
