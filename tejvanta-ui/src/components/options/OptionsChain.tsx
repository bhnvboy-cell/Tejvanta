import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { fetchOptionsChain, fetchExpiries, setSelectedExpiry } from '../../state/optionsSlice'
import { usePaperTrading } from '../../hooks/usePaperTrading'
import { Loader } from '../common/Loader'

interface QuickOrderState {
  contract: { id: number; symbol: string; ltp: number }
  side: 'BUY' | 'SELL'
  qty: number
}

export function OptionsChain() {
  const dispatch = useAppDispatch()
  const { contracts, expiries, selectedExpiry, loading } = useAppSelector(s => s.options)
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const underlyingPrice = useAppSelector(s => s.market.livePrices[selectedSymbol]) || 0
  const { placeOrder, loading: tradingLoading } = usePaperTrading()
  const [quickOrder, setQuickOrder] = useState<QuickOrderState | null>(null)

  useEffect(() => {
    if (selectedSymbol) dispatch(fetchExpiries(selectedSymbol))
  }, [selectedSymbol, dispatch])

  useEffect(() => {
    if (selectedSymbol && expiries.length > 0) {
      const expiry = selectedExpiry || expiries[0]
      dispatch(fetchOptionsChain({ symbol: selectedSymbol, expiry }))
    }
  }, [selectedSymbol, expiries, selectedExpiry, dispatch])

  const calls = useMemo(() => contracts.filter(c => c.optionType === 'CE').sort((a, b) => a.strike - b.strike), [contracts])
  const puts = useMemo(() => contracts.filter(c => c.optionType === 'PE').sort((a, b) => a.strike - b.strike), [contracts])
  const strikes = useMemo(() => [...new Set(contracts.map(c => c.strike))].sort((a, b) => a - b), [contracts])

  const maxOi = useMemo(() => Math.max(1, ...contracts.map(c => c.openInterest)), [contracts])

  const atmStrike = useMemo(() => {
    if (!underlyingPrice || strikes.length === 0) return null
    return strikes.reduce((prev, curr) => Math.abs(curr - underlyingPrice) < Math.abs(prev - underlyingPrice) ? curr : prev)
  }, [underlyingPrice, strikes])

  const visibleStrikes = useMemo(() => {
    if (!atmStrike) return strikes
    const idx = strikes.indexOf(atmStrike)
    if (idx === -1) return strikes
    return strikes.slice(Math.max(0, idx - 8), Math.min(strikes.length, idx + 9))
  }, [strikes, atmStrike])

  const handleQuickOrder = useCallback(async (o: QuickOrderState) => {
    if (!o) return
    await placeOrder({
      instrumentId: o.contract.id,
      side: o.side,
      orderType: 'MARKET',
      price: 0,
      quantity: o.qty,
      stopLoss: 0,
      takeProfit: 0,
    })
    setQuickOrder(null)
  }, [placeOrder])

  if (loading) return <Loader message="Loading options chain..." />
  if (contracts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No options data available. Select a different symbol.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-700 bg-surface-light shrink-0">
        <span className="text-sm font-semibold text-white">{selectedSymbol}</span>
        <span className="text-xs font-mono text-gray-400">Spot: <span className="text-tej-400">{underlyingPrice.toFixed(2)}</span></span>
        <select
          value={selectedExpiry || ''}
          onChange={e => dispatch(setSelectedExpiry(e.target.value))}
          className="px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
        >
          {expiries.map(e => (
            <option key={e} value={e}>{new Date(e).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</option>
          ))}
        </select>
      </div>

      {/* Chain table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-[10px] uppercase bg-surface-light sticky top-0 z-10">
              <th colSpan={2} className="px-1.5 py-1 text-left border-r border-gray-700/50 w-[35%]">CALLS</th>
              <th className="px-1.5 py-1 text-center border-x border-gray-700/50 w-[10%]">STRIKE</th>
              <th colSpan={2} className="px-1.5 py-1 text-right border-l border-gray-700/50 w-[35%]">PUTS</th>
              <th className="w-12"></th>
            </tr>
            <tr className="text-gray-500 text-[10px] bg-surface-light sticky top-5 z-10">
              <th className="px-1.5 py-0.5 text-left font-normal">LTP / Chg%</th>
              <th className="px-1.5 py-0.5 text-right font-normal border-r border-gray-700/50">OI</th>
              <th className="px-1.5 py-0.5 text-center border-x border-gray-700/50 font-normal"></th>
              <th className="px-1.5 py-0.5 text-left font-normal border-l border-gray-700/50">OI</th>
              <th className="px-1.5 py-0.5 text-right font-normal">LTP / Chg%</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {visibleStrikes.map(strike => {
              const call = calls.find(c => c.strike === strike)
              const put = puts.find(c => c.strike === strike)
              const isAtm = strike === atmStrike
              return (
                <tr key={strike} className={`border-b border-gray-800/50 hover:bg-gray-800/30 text-[11px] ${isAtm ? 'bg-tej-500/5' : ''}`}>
                  {/* CALLS */}
                  <td className={`px-1.5 py-1 font-mono ${call ? (call.changePercent >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                    {call ? (
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">{call.ltp.toFixed(2)}</span>
                        <span className={`text-[10px] ${call.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {call.changePercent >= 0 ? '+' : ''}{call.changePercent.toFixed(1)}%
                        </span>
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-1.5 py-1 border-r border-gray-700/50 relative">
                    {call && (
                      <div className="flex items-center justify-end gap-1 h-full">
                        <span className="text-gray-300 font-mono text-[10px] relative z-10">{(call.openInterest / 100000).toFixed(1)}L</span>
                        <div className="absolute right-0 top-0 bottom-0 bg-tej-500/20" style={{ width: `${(call.openInterest / maxOi) * 100}%` }} />
                      </div>
                    )}
                  </td>

                  {/* STRIKE */}
                  <td className={`px-1.5 py-1 text-center font-bold border-x border-gray-700/50 ${isAtm ? 'text-yellow-400' : 'text-gray-400'}`}>
                    <span className="flex items-center justify-center gap-1">
                      {strike.toFixed(0)}
                    </span>
                  </td>

                  {/* PUTS */}
                  <td className="px-1.5 py-1 border-l border-gray-700/50 relative">
                    {put && (
                      <div className="flex items-center gap-1 h-full">
                        <div className="absolute left-0 top-0 bottom-0 bg-red-500/20" style={{ width: `${(put.openInterest / maxOi) * 100}%` }} />
                        <span className="text-gray-300 font-mono text-[10px] relative z-10">{(put.openInterest / 100000).toFixed(1)}L</span>
                      </div>
                    )}
                  </td>
                  <td className={`px-1.5 py-1 font-mono text-right ${put ? (put.changePercent >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                    {put ? (
                      <span className="flex items-center justify-end gap-1">
                        <span className={`text-[10px] ${put.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {put.changePercent >= 0 ? '+' : ''}{put.changePercent.toFixed(1)}%
                        </span>
                        <span className="font-semibold">{put.ltp.toFixed(2)}</span>
                      </span>
                    ) : '—'}
                  </td>

                  {/* Quick Trade */}
                  <td className="py-1">
                    <div className="flex gap-0.5">
                      {call && (
                        <button
                          onClick={() => setQuickOrder({ contract: { id: call.id, symbol: `${selectedSymbol} ${call.strike} CE`, ltp: call.ltp }, side: 'BUY', qty: 1 })}
                          className="px-1 py-0.5 text-[9px] font-bold bg-tej-600/60 hover:bg-tej-500 text-white rounded"
                          title={`Buy ${selectedSymbol} ${call.strike} CE`}
                        >B</button>
                      )}
                      {put && (
                        <button
                          onClick={() => setQuickOrder({ contract: { id: put.id, symbol: `${selectedSymbol} ${put.strike} PE`, ltp: put.ltp }, side: 'SELL', qty: 1 })}
                          className="px-1 py-0.5 text-[9px] font-bold bg-red-600/60 hover:bg-red-500 text-white rounded"
                          title={`Sell ${selectedSymbol} ${put.strike} PE`}
                        >S</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Order Modal */}
      {quickOrder && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setQuickOrder(null)}>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-1">{quickOrder.contract.symbol}</div>
            <div className="text-[11px] text-gray-400 mb-3">LTP: <span className="font-mono text-white">₹{quickOrder.contract.ltp.toFixed(2)}</span></div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => quickOrder && setQuickOrder({ ...quickOrder, side: 'BUY' })}
                className={`flex-1 py-2 rounded font-bold text-sm ${quickOrder.side === 'BUY' ? 'bg-tej-500 text-white' : 'bg-gray-700 text-gray-400'}`}
              >BUY</button>
              <button
                onClick={() => quickOrder && setQuickOrder({ ...quickOrder, side: 'SELL' })}
                className={`flex-1 py-2 rounded font-bold text-sm ${quickOrder.side === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}
              >SELL</button>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] text-gray-500 uppercase mb-1">Qty</label>
              <div className="flex gap-1">
                <input type="number" min={1} value={quickOrder.qty}
                  onChange={e => quickOrder && setQuickOrder({ ...quickOrder, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="flex-1 px-2 py-1.5 text-xs bg-gray-900 border border-gray-600 rounded text-white" />
                <button onClick={() => quickOrder && setQuickOrder({ ...quickOrder, qty: quickOrder.qty + 1 })} className="px-2 bg-gray-700 rounded text-white">+</button>
                <button onClick={() => quickOrder && setQuickOrder({ ...quickOrder, qty: Math.max(1, quickOrder.qty - 1) })} className="px-2 bg-gray-700 rounded text-white">-</button>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 mb-3">
              Est. Value: <span className="text-white font-mono">₹{(quickOrder.contract.ltp * quickOrder.qty).toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setQuickOrder(null)} className="flex-1 py-2 text-xs bg-gray-700 rounded text-gray-300 hover:bg-gray-600">Cancel</button>
              <button onClick={() => handleQuickOrder(quickOrder)} disabled={tradingLoading}
                className={`flex-1 py-2 rounded text-xs font-bold text-white ${
                  quickOrder.side === 'BUY' ? 'bg-tej-500 hover:bg-tej-400' : 'bg-red-600 hover:bg-red-500'
                } disabled:opacity-50`}>
                {tradingLoading ? 'Placing...' : `${quickOrder.side} ${quickOrder.qty}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
