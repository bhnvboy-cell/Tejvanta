import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { usePaperTrading } from '../../hooks/usePaperTrading'
import { initForm, setSide, setOrderType, setQuantity, setPrice, setStopLoss, setTakeProfit, resetForm } from '../../state/orderSlice'
import type { OrderSide, OrderFormType } from '../../types/orderTypes'

interface OrderPanelProps {
  symbol: string
  instrumentId: number
  onClose?: () => void
}

const SPREAD_BPS = 5

export function OrderPanel({ symbol, instrumentId, onClose }: OrderPanelProps) {
  const dispatch = useAppDispatch()
  const { placeOrder, virtualBalance, loading } = usePaperTrading()
  const form = useAppSelector(s => s.order.forms[symbol])
  const lastPrice = useAppSelector(s => s.market.livePrices[symbol] ?? 0)

  const bid = +(lastPrice * (1 - SPREAD_BPS / 10000)).toFixed(2)
  const ask = +(lastPrice * (1 + SPREAD_BPS / 10000)).toFixed(2)
  const spread = +(ask - bid).toFixed(2)

  if (!form) {
    dispatch(initForm({ symbol, price: lastPrice }))
    return null
  }

  const execPrice = form.type === 'MARKET' ? (form.side === 'BUY' ? ask : bid) : form.price
  const orderValue = execPrice * form.quantity
  const slValue = form.stopLoss ? form.stopLoss * form.quantity : 0
  const tpValue = form.takeProfit ? form.takeProfit * form.quantity : 0

  const canPlace = form.quantity > 0 && !loading

  const handlePlace = useCallback(async () => {
    await placeOrder({
      instrumentId,
      side: form.side,
      orderType: form.type,
      price: form.type === 'MARKET' ? 0 : form.price,
      quantity: form.quantity,
      stopLoss: form.stopLoss || 0,
      takeProfit: form.takeProfit || 0,
    })
    dispatch(resetForm(symbol))
    onClose?.()
  }, [form, instrumentId, symbol, placeOrder, dispatch, onClose])

  const quickQty = (pct: number) => {
    const budget = virtualBalance * (pct / 100)
    const qty = Math.max(1, Math.floor(budget / execPrice))
    dispatch(setQuantity({ symbol, quantity: qty }))
  }

  return (
    <div className="w-full bg-surface-light border border-gray-700 rounded-lg overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-gray-300 font-semibold text-sm">{symbol}</span>
        <span className="text-gray-500 text-[10px] uppercase">Order Panel</span>
      </div>

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => dispatch(setSide({ symbol, side: 'SELL' }))}
          className={`flex-1 py-3 text-center font-bold text-lg transition ${
            form.side === 'SELL'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800/50 text-gray-500 hover:text-red-400'
          }`}
        >
          SELL<br /><span className="text-sm font-mono">{bid.toFixed(2)}</span>
        </button>
        <div className="flex flex-col items-center justify-center px-2 bg-gray-800/30 text-gray-400">
          <span className="text-[10px]">{spread.toFixed(2)}</span>
          <span className="text-[9px] leading-tight">SPRD</span>
        </div>
        <button
          onClick={() => dispatch(setSide({ symbol, side: 'BUY' }))}
          className={`flex-1 py-3 text-center font-bold text-lg transition ${
            form.side === 'BUY'
              ? 'bg-tej-500 text-white'
              : 'bg-gray-800/50 text-gray-500 hover:text-tej-400'
          }`}
        >
          BUY<br /><span className="text-sm font-mono">{ask.toFixed(2)}</span>
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex gap-1 bg-gray-800 rounded p-0.5">
          {(['MARKET', 'LIMIT'] as OrderFormType[]).map(t => (
            <button
              key={t}
              onClick={() => dispatch(setOrderType({ symbol, type: t }))}
              className={`flex-1 py-1 rounded text-xs font-medium transition ${
                form.type === t
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {form.type === 'LIMIT' && (
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 uppercase">Limit Price</label>
            <input
              type="number"
              step="0.05"
              value={form.price || ''}
              onChange={e => dispatch(setPrice({ symbol, price: parseFloat(e.target.value) || 0 }))}
              className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-tej-500 text-white"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] text-gray-500 mb-1 uppercase">Quantity</label>
          <div className="flex gap-1">
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={e => dispatch(setQuantity({ symbol, quantity: parseInt(e.target.value) || 1 }))}
              className="flex-1 px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-tej-500 text-white"
            />
            <button onClick={() => dispatch(setQuantity({ symbol, quantity: form.quantity + 1 }))} className="px-2 bg-gray-700 rounded hover:bg-gray-600 text-gray-300">+</button>
            <button onClick={() => dispatch(setQuantity({ symbol, quantity: Math.max(1, form.quantity - 1) }))} className="px-2 bg-gray-700 rounded hover:bg-gray-600 text-gray-300">-</button>
          </div>
          <div className="flex gap-1 mt-1">
            {[10, 25, 50, 100].map(pct => (
              <button
                key={pct}
                onClick={() => quickQty(pct)}
                className="flex-1 py-0.5 text-[10px] bg-gray-800 rounded hover:bg-gray-700 text-gray-400"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 uppercase">Stop Loss</label>
            <input
              type="number"
              step="0.05"
              value={form.stopLoss || ''}
              onChange={e => dispatch(setStopLoss({ symbol, value: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-red-500 text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 uppercase">Take Profit</label>
            <input
              type="number"
              step="0.05"
              value={form.takeProfit || ''}
              onChange={e => dispatch(setTakeProfit({ symbol, value: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-green-500 text-white"
            />
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Order Value</span>
            <span className="text-white font-mono">₹{orderValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Available</span>
            <span className="text-white font-mono">₹{virtualBalance.toFixed(2)}</span>
          </div>
          {form.stopLoss > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Stop Loss Value</span>
              <span className="text-red-400 font-mono">₹{slValue.toFixed(2)}</span>
            </div>
          )}
          {form.takeProfit > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Take Profit Value</span>
              <span className="text-green-400 font-mono">₹{tpValue.toFixed(2)}</span>
            </div>
          )}
        </div>

        <button
          onClick={handlePlace}
          disabled={!canPlace}
          className={`w-full py-2.5 rounded font-bold text-sm transition ${
            form.side === 'BUY'
              ? 'bg-tej-500 hover:bg-tej-400 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loading ? 'Placing...' : `${form.side} ${form.quantity} @ ${form.type === 'MARKET' ? 'Market' : '₹' + form.price.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
