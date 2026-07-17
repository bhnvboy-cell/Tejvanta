import { useState } from 'react'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { usePaperTrading } from '../../hooks/usePaperTrading'
import type { PlaceOrderRequest } from '../../types/Order'

interface BasketItem {
  instrumentId: number
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
}

export function BasketOrders() {
  const { placeOrder } = usePaperTrading()
  const { instruments, ticks } = useAppSelector(s => s.market)
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [basketName, setBasketName] = useState('')

  const addToBasket = (symbol: string) => {
    const inst = instruments.find(i => i.symbol === symbol)
    if (!inst || basket.find(b => b.symbol === symbol)) return
    setBasket([...basket, {
      instrumentId: inst.id,
      symbol,
      side: 'BUY',
      quantity: 1,
      price: ticks[symbol]?.price || 0,
    }])
  }

  const removeFromBasket = (symbol: string) => {
    setBasket(basket.filter(b => b.symbol !== symbol))
  }

  const updateItem = (symbol: string, field: keyof BasketItem, value: any) => {
    setBasket(basket.map(b => b.symbol === symbol ? { ...b, [field]: value } : b))
  }

  const placeBasket = async () => {
    const orders: PlaceOrderRequest[] = basket.map(b => ({
      instrumentId: b.instrumentId,
      side: b.side,
      orderType: 'MARKET' as const,
      price: b.price,
      quantity: b.quantity,
      stopLoss: 0,
      takeProfit: 0,
      basketId: basketName || undefined,
    }))

    for (const order of orders) {
      await placeOrder(order)
    }

    setBasket([])
    setBasketName('')
  }

  const totalValue = basket.reduce((sum, b) => sum + b.price * b.quantity, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={basketName}
          onChange={e => setBasketName(e.target.value)}
          placeholder="Basket name (optional)"
          className="flex-1 px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-tej-500 text-white"
        />
        <select
          onChange={e => { if (e.target.value) addToBasket(e.target.value); e.target.value = '' }}
          className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white"
        >
          <option value="">+ Add Symbol</option>
          {instruments.slice(0, 30).map(i => (
            <option key={i.id} value={i.symbol} disabled={!!basket.find(b => b.symbol === i.symbol)}>
              {i.symbol}
            </option>
          ))}
        </select>
      </div>

      {basket.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                  <th className="text-left px-2 py-1">Symbol</th>
                  <th className="text-left px-2 py-1">Side</th>
                  <th className="text-right px-2 py-1">Qty</th>
                  <th className="text-right px-2 py-1">Price</th>
                  <th className="text-right px-2 py-1">Value</th>
                  <th className="w-8 px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {basket.map(item => (
                  <tr key={item.symbol} className="border-b border-gray-800">
                    <td className="px-2 py-1 font-medium">{item.symbol}</td>
                    <td className="px-2 py-1">
                      <select
                        value={item.side}
                        onChange={e => updateItem(item.symbol, 'side', e.target.value)}
                        className="bg-gray-800 text-xs border border-gray-600 rounded px-1"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item.symbol, 'quantity', Number(e.target.value))}
                        min={1}
                        className="w-16 text-right bg-gray-800 text-xs border border-gray-600 rounded px-1"
                      />
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{item.price.toFixed(2)}</td>
                    <td className="px-2 py-1 text-right font-mono">₹{(item.price * item.quantity).toFixed(0)}</td>
                    <td className="px-2 py-1 text-center">
                      <button onClick={() => removeFromBasket(item.symbol)} className="text-red-400 text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700 font-medium">
                  <td colSpan={4} className="px-2 py-1 text-right text-gray-400">Total:</td>
                  <td className="px-2 py-1 text-right font-mono text-tej-400">₹{totalValue.toFixed(0)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            onClick={placeBasket}
            className="w-full py-2 bg-tej-600 hover:bg-tej-500 text-white rounded font-medium text-sm transition"
          >
            Place Basket ({basket.length} orders)
          </button>
        </>
      )}

      {basket.length === 0 && (
        <div className="text-center text-gray-500 py-8 text-sm">
          Add symbols to create a basket order
        </div>
      )}
    </div>
  )
}
