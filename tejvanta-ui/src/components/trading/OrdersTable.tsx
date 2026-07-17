import { useEffect } from 'react'
import { usePaperTrading } from '../../hooks/usePaperTrading'

export function OrdersTable() {
  const { orders, refreshOrders, cancelOrder } = usePaperTrading()

  useEffect(() => { refreshOrders() }, [])

  if (orders.length === 0) {
    return <div className="text-center text-gray-500 py-8 text-sm">No orders placed yet</div>
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'FILLED': return 'text-green-400'
      case 'PENDING':
      case 'OPEN': return 'text-yellow-400'
      case 'CANCELLED':
      case 'REJECTED': return 'text-red-400'
      case 'PARTIALLY_FILLED': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="overflow-x-auto max-h-80 overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className="text-left px-3 py-2">Time</th>
            <th className="text-left px-3 py-2">Symbol</th>
            <th className="text-left px-3 py-2">Side</th>
            <th className="text-right px-3 py-2">Qty</th>
            <th className="text-right px-3 py-2">Price</th>
            <th className="text-left px-3 py-2">Type</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-center px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="px-3 py-2 text-xs text-gray-400">
                {new Date(order.createdAt).toLocaleTimeString()}
              </td>
              <td className="px-3 py-2 font-medium">{order.symbol}</td>
              <td className={`px-3 py-2 ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                {order.side}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {order.filledQuantity || order.quantity}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {order.avgFillPrice || order.price}
              </td>
              <td className="px-3 py-2 text-gray-400">{order.orderType}</td>
              <td className={`px-3 py-2 ${statusColor(order.status)}`}>{order.status}</td>
              <td className="px-3 py-2 text-center">
                {(order.status === 'OPEN' || order.status === 'PENDING') && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
