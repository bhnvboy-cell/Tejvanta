import { useState } from 'react'
import { TradingViewChart } from '../components/charts/TradingViewChart'
import { PositionsTable } from '../components/trading/PositionsTable'
import { SearchTicker } from '../components/layout/SearchTicker'
import { useAppSelector } from '../hooks/useAppDispatch'
const TIMEFRAMES = ['5s', '1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W']

export function Dashboard() {
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const [timeframe, setTimeframe] = useState('15m')

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-1 bg-surface-light border-b border-gray-700 shrink-0">
          <span className="text-xs font-semibold text-tej-400 mr-2">{selectedSymbol}</span>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 text-xs rounded ${
                timeframe === tf
                  ? 'bg-tej-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
          <div className="ml-auto">
            <SearchTicker />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <TradingViewChart key={selectedSymbol} symbol={selectedSymbol} timeframe={timeframe} />
        </div>
      </div>
      <div className="w-80 border-l border-gray-700 bg-surface-light flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Positions</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <PositionsTable />
        </div>
      </div>
    </div>
  )
}
