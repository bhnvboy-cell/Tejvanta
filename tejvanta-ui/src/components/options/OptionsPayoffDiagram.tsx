import { useState, useMemo } from 'react'

interface Leg {
  type: 'call' | 'put'
  side: 'buy' | 'sell'
  strike: number
  premium: number
  quantity: number
}

function payoffAt(legs: Leg[], price: number): number {
  return legs.reduce((total, leg) => {
    const intrinsic = leg.type === 'call' ? Math.max(0, price - leg.strike) : Math.max(0, leg.strike - price)
    const legPnl = leg.side === 'buy' ? intrinsic - leg.premium : leg.premium - intrinsic
    return total + legPnl * leg.quantity
  }, 0)
}

export function OptionsPayoffDiagram() {
  const [legs, setLegs] = useState<Leg[]>([
    { type: 'call', side: 'buy', strike: 25000, premium: 150, quantity: 1 },
    { type: 'put', side: 'sell', strike: 24500, premium: 100, quantity: 1 },
  ])

  const chart = useMemo(() => {
    if (legs.length === 0) return { min: 0, max: 0, points: [] }
    const strikes = legs.map(l => l.strike)
    const minS = Math.min(...strikes) - 1000, maxS = Math.max(...strikes) + 1000
    const step = 20
    const points: Array<{ price: number; pnl: number }> = []
    for (let p = minS; p <= maxS; p += step) points.push({ price: p, pnl: payoffAt(legs, p) })
    const pnls = points.map(p => p.pnl)
    return { min: Math.min(...pnls, -500), max: Math.max(...pnls, 500), points }
  }, [legs])

  const addLeg = () => setLegs(l => [...l, { type: 'call', side: 'buy', strike: 25000, premium: 100, quantity: 1 }])
  const removeLeg = (i: number) => setLegs(l => l.filter((_, idx) => idx !== i))
  const updateLeg = (i: number, changes: Partial<Leg>) => setLegs(l => l.map((leg, idx) => idx === i ? { ...leg, ...changes } : leg))

  const w = 300, h = 160, px = 40, py = 10, cw = w - px * 2, ch = h - py * 2
  const range = chart.max - chart.min || 1

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-white">Payoff Diagram</h3>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] bg-gray-800/50 rounded px-2 py-1">
            <select value={leg.type} onChange={e => updateLeg(i, { type: e.target.value as 'call' | 'put' })} className="bg-gray-700 text-white text-[10px] px-1 rounded border border-gray-600">{['call', 'put'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select>
            <select value={leg.side} onChange={e => updateLeg(i, { side: e.target.value as 'buy' | 'sell' })} className="bg-gray-700 text-white text-[10px] px-1 rounded border border-gray-600">{['buy', 'sell'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select>
            <input type="number" value={leg.strike} onChange={e => updateLeg(i, { strike: parseFloat(e.target.value) })} className="w-16 bg-gray-700 text-white text-[10px] px-1 rounded border border-gray-600" placeholder="Strike" />
            <input type="number" value={leg.premium} onChange={e => updateLeg(i, { premium: parseFloat(e.target.value) })} className="w-14 bg-gray-700 text-white text-[10px] px-1 rounded border border-gray-600" placeholder="Premium" />
            <input type="number" value={leg.quantity} onChange={e => updateLeg(i, { quantity: parseInt(e.target.value) })} className="w-10 bg-gray-700 text-white text-[10px] px-1 rounded border border-gray-600" placeholder="Qty" />
            <button onClick={() => removeLeg(i)} className="text-gray-500 hover:text-red-400 px-1">✕</button>
          </div>
        ))}
        <button onClick={addLeg} className="text-[10px] text-tej-400 hover:text-tej-300">+ Add Leg</button>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full bg-white rounded border border-gray-300" style={{ maxHeight: '180px' }}>
        {/* grid */}
        {[-1, 0, 1].map(i => {
          const y = py + ch * (0.5 + i * 0.3)
          return <line key={`g${i}`} x1={px} y1={y} x2={px + cw} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
        })}
        {[-2, -1, 0, 1, 2].map(i => {
          const x = px + cw * (0.5 + i * 0.2)
          return <line key={`v${i}`} x1={x} y1={py} x2={x} y2={py + ch} stroke="#e5e7eb" strokeWidth="0.5" />
        })}
        {/* zero line */}
        <line x1={px} y1={py + ch / 2} x2={px + cw} y2={py + ch / 2} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="3,3" />
        {/* payoff curve */}
        {chart.points.length > 1 && (
          <polyline
            fill="none" stroke="#6366f1" strokeWidth="1.5"
            points={chart.points.map(p => `${px + (p.price - chart.points[0].price) / (chart.points[chart.points.length - 1].price - chart.points[0].price || 1) * cw},${py + ch - (p.pnl - chart.min) / range * ch}`).join(' ')}
          />
        )}
        {/* axes */}
        <line x1={px} y1={py} x2={px} y2={py + ch} stroke="#6b7280" strokeWidth="0.5" />
        <line x1={px} y1={py + ch} x2={px + cw} y2={py + ch} stroke="#6b7280" strokeWidth="0.5" />
      </svg>
    </div>
  )
}
