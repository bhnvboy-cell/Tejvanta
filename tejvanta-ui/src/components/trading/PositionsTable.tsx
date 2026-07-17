import { useEffect, useRef } from 'react'
import { usePaperTrading } from '../../hooks/usePaperTrading'

export function PositionsTable() {
  const { positions, refreshPositions, closePosition, reversePosition, loading, error } = usePaperTrading()
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    refreshPositions()
    intervalRef.current = setInterval(refreshPositions, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading && positions.length === 0) {
    return <div className="text-center text-gray-500 py-8 text-sm">Loading positions...</div>
  }
  if (error && positions.length === 0) {
    return <div className="text-center text-red-400 py-8 text-sm">{error}</div>
  }
  if (positions.length === 0) {
    return <div className="text-center text-gray-500 py-8 text-sm">No open positions</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className="text-left px-3 py-2">Symbol</th>
            <th className="text-right px-3 py-2">Qty</th>
            <th className="text-right px-3 py-2">Avg</th>
            <th className="text-right px-3 py-2">LTP</th>
            <th className="text-right px-3 py-2">P&L</th>
            <th className="text-right px-3 py-2">P&L %</th>
            <th className="text-center px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(pos => (
            <tr key={pos.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="px-3 py-2 font-medium text-white">{pos.symbol}</td>
              <td className={`px-3 py-2 text-right font-mono ${pos.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pos.quantity > 0 ? '+' : ''}{pos.quantity}
              </td>
              <td className="px-3 py-2 text-right font-mono">{(pos.avgPrice ?? 0).toFixed(2)}</td>
              <td className="px-3 py-2 text-right font-mono">{(pos.currentPrice ?? 0).toFixed(2)}</td>
              <td className={`px-3 py-2 text-right font-mono ${(pos.unrealizedPnL ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{(pos.unrealizedPnL ?? 0).toFixed(2)}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${(pos.pnlPercent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(pos.pnlPercent ?? 0) >= 0 ? '+' : ''}{(pos.pnlPercent ?? 0).toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex gap-1 justify-center">
                  <button
                    onClick={() => closePosition(pos.symbol)}
                    className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/40"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => reversePosition(pos.symbol)}
                    className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600/40"
                  >
                    Reverse
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
