export interface TraderAction {
  type: 'entry' | 'exit' | 'sl-placed' | 'cancelled'
  time: number
  symbol: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  stopLoss?: number
  takeProfit?: number
}

export interface TraderState {
  currentPosition: { symbol: string; side: string; quantity: number; entryPrice: number } | null
  dailyTrades: number
  dailyPnl: number
  consecutiveLosses: number
  equity: number
  peakEquity: number
  dailyLossLimit: number
  openOrders: number
  lastTradeTime: number
}

export interface CoachingFeedback {
  ruleId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
  timestamp: number
}

interface CoachingRule {
  id: string
  name: string
  condition: (action: TraderAction, state: TraderState) => boolean
  severity: 'info' | 'warning' | 'critical'
  message: (action: TraderAction, state: TraderState) => string
  suggestion: (action: TraderAction, state: TraderState) => string
}

const RULES: CoachingRule[] = [
  {
    id: 'no-sl-entry',
    name: 'No Stop Loss',
    condition: (a) => a.type === 'entry' && (!a.stopLoss || a.stopLoss === 0),
    severity: 'critical',
    message: () => 'Entry without Stop Loss!',
    suggestion: (a) => `Set SL below recent swing low (approx ${(a.price * 0.99).toFixed(2)})`,
  },
  {
    id: 'fomo-detected',
    name: 'FOMO Detection',
    condition: (a, s) => a.type === 'entry' && s.lastTradeTime > 0 && (a.time - s.lastTradeTime) < 300,
    severity: 'warning',
    message: () => 'Rapid re-entry detected — possible FOMO',
    suggestion: () => 'Wait for a fresh setup. Take a 5-minute break between trades.',
  },
  {
    id: 'revenge-trade',
    name: 'Revenge Trade',
    condition: (a, s) => a.type === 'entry' && s.dailyPnl < -10000 && s.consecutiveLosses >= 2,
    severity: 'critical',
    message: () => 'Revenge trading detected after consecutive losses',
    suggestion: () => 'Step away for 15 minutes. Review your journal before the next trade.',
  },
  {
    id: 'daily-loss-near',
    name: 'Daily Loss Near Limit',
    condition: (a, s) => a.type === 'entry' && s.dailyPnl < 0 && Math.abs(s.dailyPnl / s.equity) > s.dailyLossLimit * 0.8,
    severity: 'warning',
    message: (a, s) => `Daily loss at ${(Math.abs(s.dailyPnl) / s.equity * 100).toFixed(1)}% — approaching ${(s.dailyLossLimit * 100).toFixed(0)}% limit`,
    suggestion: () => 'Only take highest-probability setups. Consider stopping for the day.',
  },
  {
    id: 'daily-loss-hit',
    name: 'Daily Loss Limit Hit',
    condition: (a, s) => a.type === 'entry' && s.dailyPnl < 0 && Math.abs(s.dailyPnl / s.equity) >= s.dailyLossLimit,
    severity: 'critical',
    message: () => 'Daily loss limit reached! No more trades today.',
    suggestion: () => 'Stop trading. Review your session and journal your emotions.',
  },
  {
    id: 'consecutive-losses',
    name: 'Consecutive Losses',
    condition: (a, s) => a.type === 'entry' && s.consecutiveLosses >= 3,
    severity: 'warning',
    message: (a, s) => `${s.consecutiveLosses} consecutive losses — risk halved`,
    suggestion: () => 'Scale down position size. Focus on high-conviction setups only.',
  },
  {
    id: 'tight-stop',
    name: 'Tight Stop Loss',
    condition: (a) => a.type === 'entry' && !!a.stopLoss && Math.abs(a.price - a.stopLoss) / a.price < 0.002,
    severity: 'info',
    message: () => 'Stop Loss may be too tight',
    suggestion: (a) => `Consider widening SL to 1× ATR (approx ${(a.price * 0.01).toFixed(2)})`,
  },
  {
    id: 'no-confirmation',
    name: 'No Confirmation Candle',
    condition: (a) => a.type === 'entry' && true,
    severity: 'info',
    message: () => 'Did you wait for the confirmation candle?',
    suggestion: () => 'Most strategies require the candle AFTER the signal to close.',
  },
]

export function evaluateAction(action: TraderAction, state: TraderState): CoachingFeedback[] {
  const feedback: CoachingFeedback[] = []
  const now = Date.now()

  for (const rule of RULES) {
    try {
      if (rule.condition(action, state)) {
        feedback.push({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message(action, state),
          suggestion: rule.suggestion(action, state),
          timestamp: now,
        })
      }
    } catch {}
  }

  return feedback
}

export function getCoachingStyle(severity: 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'info': return 'bg-blue-600/20 border-blue-700 text-blue-300'
    case 'warning': return 'bg-yellow-600/20 border-yellow-700 text-yellow-300'
    case 'critical': return 'bg-red-600/20 border-red-700 text-red-300'
  }
}
