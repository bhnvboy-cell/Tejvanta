import { useState, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { selectSymbol } from '../../state/marketSlice'
import { ALL_SYMBOLS } from '../../config/defaultWatchlist'
import { InstrumentSearch } from './InstrumentSearch'
import type { Instrument } from '../../types/Instrument'

export function WatchList() {
  const dispatch = useAppDispatch()
  const livePrices = useAppSelector(s => s.market.livePrices)
  const ticks = useAppSelector(s => s.market.ticks)
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_SYMBOLS
    const q = search.toLowerCase()
    return ALL_SYMBOLS.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [search])

  const handleSymbolClick = (symbol: string) => {
    dispatch(selectSymbol(symbol))
  }

  const handleSearchSelect = (inst: Instrument) => {
    dispatch(selectSymbol(inst.symbol))
    setShowSearch(false)
    setSearch('')
  }

  const formatPrice = (price: number | undefined, symbol: string): string => {
    if (price === undefined || price === null || isNaN(price)) return '—'
    if (symbol.includes('BTC') || symbol.includes('USD')) return price.toFixed(2)
    return price.toFixed(2)
  }

  const formatChange = (tick: any): { text: string; isPositive: boolean } | null => {
    if (!tick || tick.change === undefined || tick.change === null || isNaN(tick.change)) return null
    const isPositive = tick.change >= 0
    const sign = isPositive ? '+' : ''
    return { text: `${sign}${tick.change.toFixed(2)} (${sign}${(tick.changePercent || 0).toFixed(2)}%)`, isPositive }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-700">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Watchlist</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-gray-500 hover:text-white text-[10px] px-1.5 py-0.5 rounded hover:bg-gray-700 transition"
        >
          {showSearch ? '✕' : '+ Add'}
        </button>
      </div>

      {showSearch && (
        <div className="p-2 border-b border-gray-700">
          <InstrumentSearch onSelect={handleSearchSelect} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.map(sym => {
          const tick = ticks[sym.symbol]
          const price = livePrices[sym.symbol]
          const changeInfo = formatChange(tick)
          const isSelected = selectedSymbol === sym.symbol
          const exchange = sym.exchange === 'NSE' ? 'N' : sym.exchange === 'NASDAQ' ? 'US' : sym.exchange === 'CRYPTO' ? 'C' : sym.exchange

          return (
            <button
              key={sym.symbol}
              onClick={() => handleSymbolClick(sym.symbol)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition hover:bg-gray-700/50 ${
                isSelected ? 'bg-tej-600/15 border-l-2 border-tej-500' : 'border-l-2 border-transparent'
              }`}
            >
              <span className="text-[9px] text-gray-600 font-mono w-5 shrink-0">{exchange}</span>
              <div className="flex-1 text-left min-w-0">
                <div className="text-gray-200 font-medium truncate">{sym.symbol}</div>
                <div className="text-[9px] text-gray-500 truncate">{sym.name}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-200 font-mono text-[11px]">{formatPrice(price, sym.symbol)}</div>
                {changeInfo && (
                  <div className={`text-[9px] font-mono ${changeInfo.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {changeInfo.text}
                  </div>
                )}
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-gray-600 text-[10px] text-center py-4">No symbols match</div>
        )}
      </div>
    </div>
  )
}
