import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { placeReplayOrder } from '../../state/replayTradingSlice'
import { setReplayTrade, squareOff } from '../../state/replaySlice'

export function ReplayTradingPanel() {
  const dispatch = useAppDispatch()
  const currentPrice = useAppSelector(s => s.replay.currentPrice)
  const currentSymbol = useAppSelector(s => s.replay.currentSymbol)
  const isActive = useAppSelector(s => s.replay.isActive)
  const loading = useAppSelector(s => s.replayTrading.loading)
  const entryPrice = useAppSelector(s => s.replay.entryPrice)
  const side = useAppSelector(s => s.replay.side)
  const quantity = useAppSelector(s => s.replay.quantity)
  const replayPnL = useAppSelector(s => s.replay.replayPnL)
  const lastRealizedPnL = useAppSelector(s => s.replay.lastRealizedPnL)
  const sessionPnL = useAppSelector(s => s.replay.sessionPnL)
  const [qty, setQty] = useState(1)
  const hasPosition = entryPrice != null && side && quantity
  const disabled = !isActive || currentPrice == null || loading

  const handleBuy = async () => {
    if (!currentSymbol || currentPrice == null) return
    const result = await dispatch(placeReplayOrder({ symbol: currentSymbol, side: 'BUY', quantity: qty, price: currentPrice }))
    if (placeReplayOrder.fulfilled.match(result)) {
      dispatch(setReplayTrade({ side: 'BUY', quantity: qty, price: currentPrice }))
    }
  }

  const handleSell = async () => {
    if (!currentSymbol || currentPrice == null) return
    const result = await dispatch(placeReplayOrder({ symbol: currentSymbol, side: 'SELL', quantity: qty, price: currentPrice }))
    if (placeReplayOrder.fulfilled.match(result)) {
      dispatch(setReplayTrade({ side: 'SELL', quantity: qty, price: currentPrice }))
    }
  }

  const handleSquareOff = async () => {
    if (!currentSymbol || currentPrice == null || !side || !quantity) return
    const oppositeSide = side === 'BUY' ? 'SELL' : 'BUY'
    const result = await dispatch(placeReplayOrder({ symbol: currentSymbol, side: oppositeSide, quantity, price: currentPrice }))
    if (placeReplayOrder.fulfilled.match(result)) {
      dispatch(squareOff())
    }
  }

  return (
    <div className="bg-surface-light border-t border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">
          {currentSymbol ? (
            <><span className="text-gray-500">Symbol:</span> <span className="text-white font-semibold">{currentSymbol}</span></>
          ) : (
            <span className="text-gray-500">No replay active</span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {currentPrice != null ? (
            <><span className="text-gray-500">Price:</span> <span className="text-tej-400 font-mono font-semibold">₹{currentPrice.toFixed(2)}</span></>
          ) : (
            <span className="text-gray-500">--</span>
          )}
        </div>
      </div>
      {hasPosition && (
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500">
            {side === 'BUY' ? 'Bought' : 'Sold'} {quantity} @ ₹{entryPrice!.toFixed(2)}
          </span>
          <span className={`font-mono font-semibold ${replayPnL != null && replayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {replayPnL != null ? `₹${replayPnL.toFixed(2)}` : ''}
          </span>
        </div>
      )}
      {!hasPosition && lastRealizedPnL != null && (
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500">Last Trade PnL</span>
          <span className={`font-mono font-semibold ${lastRealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{lastRealizedPnL.toFixed(2)}
          </span>
        </div>
      )}
      {sessionPnL !== 0 && (
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-gray-500">Session PnL</span>
          <span className={`font-mono font-semibold ${sessionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{sessionPnL.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-400">Qty:</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={!isActive}
            className="w-16 px-2 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white text-center [appearance:textfield]"
          />
        </div>
        <button
          onClick={handleBuy}
          disabled={disabled}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition"
        >
          BUY
        </button>
        <button
          onClick={handleSell}
          disabled={disabled}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition"
        >
          SELL
        </button>
        {hasPosition && (
          <button
            onClick={handleSquareOff}
            disabled={disabled}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition"
          >
            SQUARE OFF
          </button>
        )}
      </div>
    </div>
  )
}
