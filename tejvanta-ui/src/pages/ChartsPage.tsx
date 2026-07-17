import { useEffect } from 'react'
import { MultiChartLayout } from '../components/charts/MultiChartLayout'
import { PaperTradingPanel } from '../components/trading/PaperTradingPanel'
import { useAppSelector } from '../hooks/useAppDispatch'
import { signalRService } from '../services/signalRService'

export function ChartsPage() {
  const activeSymbol = useAppSelector(s => s.market.selectedSymbol)

  useEffect(() => {
    if (!activeSymbol) return
    signalRService.subscribeSymbol(activeSymbol)
    return () => { void signalRService.unsubscribeSymbol(activeSymbol) }
  }, [activeSymbol])

  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0">
        <MultiChartLayout />
      </div>
      <div className="w-80 border-l border-gray-700 bg-surface-light flex-shrink-0">
        <PaperTradingPanel />
      </div>
    </div>
  )
}
