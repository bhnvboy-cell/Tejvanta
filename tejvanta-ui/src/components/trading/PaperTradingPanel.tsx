import { useState } from 'react'
import { usePaperTrading } from '../../hooks/usePaperTrading'
import { useAppSelector } from '../../hooks/useAppDispatch'
import { OrderPanel } from './OrderPanel'
import { PositionsTable } from './PositionsTable'
import { OrdersTable } from './OrdersTable'
import { BasketOrders } from './BasketOrders'
import { RiskDashboard } from './RiskDashboard'
import { JournalPanel } from './JournalPanel'
import { CoachingPanel } from './CoachingPanel'

export function PaperTradingPanel() {
  const [activeTab, setActiveTab] = useState<'order' | 'positions' | 'orders' | 'basket' | 'risk' | 'journal' | 'coach'>('order')
  const selectedSymbol = useAppSelector(s => s.market.selectedSymbol) || 'NIFTY'
  const instruments = useAppSelector(s => s.market.instruments)
  const ticks = useAppSelector(s => s.market.ticks)

  const instrument = instruments.find(i => i.symbol === selectedSymbol)
  const tick = ticks[selectedSymbol]

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-700 bg-surface-light overflow-x-auto">
        {(['order', 'positions', 'orders', 'basket', 'risk', 'journal', 'coach'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs capitalize whitespace-nowrap transition ${
              activeTab === tab
                ? 'text-tej-400 border-b-2 border-tej-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'order' ? 'New Order' : tab === 'coach' ? 'AI Coach' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'order' && instrument && (
          <OrderPanel
            symbol={selectedSymbol}
            instrumentId={instrument.id}
          />
        )}
        {activeTab === 'order' && !instrument && (
          <div className="text-center text-gray-500 py-8">
            Select a symbol to place an order
          </div>
        )}
        {activeTab === 'positions' && <PositionsTable />}
        {activeTab === 'orders' && <OrdersTable />}
        {activeTab === 'basket' && <BasketOrders />}
        {activeTab === 'risk' && <RiskDashboard />}
        {activeTab === 'journal' && <JournalPanel />}
        {activeTab === 'coach' && <CoachingPanel />}
      </div>
    </div>
  )
}
