import { OptionsChain } from '../components/options/OptionsChain'
import { PaperTradingPanel } from '../components/trading/PaperTradingPanel'

export function OptionsPage() {
  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0">
        <OptionsChain />
      </div>
      <div className="w-80 border-l border-gray-700 bg-surface-light flex-shrink-0">
        <PaperTradingPanel />
      </div>
    </div>
  )
}
