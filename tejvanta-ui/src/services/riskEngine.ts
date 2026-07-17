export interface RiskConfig {
  dailyLossLimit: number
  maxDrawdownLimit: number
  defaultRiskPerTrade: number
  maxPositionSize: number
  maxConsecutiveLosses: number
  minRR: number
}

export interface DailyRiskState {
  date: string
  startingEquity: number
  currentEquity: number
  pnl: number
  pnlPercent: number
  trades: number
  losses: number
  wins: number
  breached: boolean
}

export interface DrawdownState {
  peakEquity: number
  currentDrawdown: number
  maxDrawdown: number
  maxDrawdownDate: string | null
}

export interface PositionSizeResult {
  riskCapital: number
  stopDistance: number
  stopDistancePercent: number
  quantity: number
  marginRequired: number
}

export interface StrategyRiskScore {
  strategyId: string
  strategyName: string
  winRate: number
  avgR: number
  maxDrawdown: number
  profitFactor: number
  tradesCount: number
  scoreNumeric: number
  scoreLetter: string
}

const DEFAULT_RISK_CONFIG: RiskConfig = {
  dailyLossLimit: 0.03,
  maxDrawdownLimit: 0.15,
  defaultRiskPerTrade: 0.01,
  maxPositionSize: 0.25,
  maxConsecutiveLosses: 3,
  minRR: 1.5,
}

const STORAGE_KEYS = {
  riskConfig: 'tj_risk_config',
  dailyState: 'tj_risk_daily',
  drawdown: 'tj_risk_drawdown',
}

export function loadRiskConfig(): RiskConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.riskConfig)
    return saved ? { ...DEFAULT_RISK_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_RISK_CONFIG }
  } catch { return { ...DEFAULT_RISK_CONFIG } }
}

export function saveRiskConfig(config: RiskConfig): void {
  localStorage.setItem(STORAGE_KEYS.riskConfig, JSON.stringify(config))
}

export function loadDailyState(): DailyRiskState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.dailyState)
    if (saved) {
      const state = JSON.parse(saved) as DailyRiskState
      const today = new Date().toISOString().split('T')[0]
      if (state.date === today) return state
    }
  } catch {}
  return {
    date: new Date().toISOString().split('T')[0],
    startingEquity: 1000000,
    currentEquity: 1000000,
    pnl: 0,
    pnlPercent: 0,
    trades: 0,
    losses: 0,
    wins: 0,
    breached: false,
  }
}

export function saveDailyState(state: DailyRiskState): void {
  localStorage.setItem(STORAGE_KEYS.dailyState, JSON.stringify(state))
}

export function loadDrawdownState(equity: number): DrawdownState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.drawdown)
    if (saved) {
      const state = JSON.parse(saved) as DrawdownState
      const dd = state.peakEquity > 0 ? (state.peakEquity - equity) / state.peakEquity : 0
      return { ...state, currentDrawdown: dd }
    }
  } catch {}
  return { peakEquity: equity, currentDrawdown: 0, maxDrawdown: 0, maxDrawdownDate: null }
}

export function saveDrawdownState(state: DrawdownState): void {
  localStorage.setItem(STORAGE_KEYS.drawdown, JSON.stringify(state))
}

export function calculatePositionSize(
  accountEquity: number,
  entryPrice: number,
  stopPrice: number,
  riskPerTrade: number = DEFAULT_RISK_CONFIG.defaultRiskPerTrade,
): PositionSizeResult {
  const riskCapital = accountEquity * riskPerTrade
  const stopDistance = Math.abs(entryPrice - stopPrice)
  const stopDistancePercent = stopDistance / entryPrice
  const quantity = Math.max(1, Math.floor(riskCapital / stopDistance))
  const marginRequired = quantity * entryPrice

  return { riskCapital, stopDistance, stopDistancePercent, quantity, marginRequired }
}

export function updateAfterTrade(
  dailyState: DailyRiskState,
  drawdownState: DrawdownState,
  pnl: number,
  currentEquity: number,
  config: RiskConfig,
): { daily: DailyRiskState; drawdown: DrawdownState } {
  const updatedDaily = { ...dailyState }
  updatedDaily.currentEquity = currentEquity
  updatedDaily.pnl += pnl
  updatedDaily.pnlPercent = updatedDaily.startingEquity > 0 ? (updatedDaily.pnl / updatedDaily.startingEquity) * 100 : 0
  updatedDaily.trades++
  if (pnl >= 0) updatedDaily.wins++
  else updatedDaily.losses++
  updatedDaily.breached = Math.abs(updatedDaily.pnlPercent) >= config.dailyLossLimit * 100

  const updatedDD = { ...drawdownState }
  if (currentEquity > updatedDD.peakEquity) {
    updatedDD.peakEquity = currentEquity
  }
  updatedDD.currentDrawdown = updatedDD.peakEquity > 0 ? (updatedDD.peakEquity - currentEquity) / updatedDD.peakEquity : 0
  if (updatedDD.currentDrawdown > updatedDD.maxDrawdown) {
    updatedDD.maxDrawdown = updatedDD.currentDrawdown
    updatedDD.maxDrawdownDate = new Date().toISOString()
  }

  return { daily: updatedDaily, drawdown: updatedDD }
}

export function calculateStrategyRiskScore(
  winRate: number,
  avgR: number,
  maxDrawdown: number,
  profitFactor: number,
  tradesCount: number,
): StrategyRiskScore {
  const wrScore = 50 * (1 - winRate)
  const rScore = 20 * (1 - Math.min(avgR / 3, 1))
  const ddScore = 30 * Math.min(maxDrawdown / 0.15, 1)
  const scoreNumeric = Math.max(0, Math.min(100, 100 - (wrScore + rScore + ddScore)))
  const scoreLetter = scoreNumeric >= 90 ? 'A+' : scoreNumeric >= 80 ? 'A' : scoreNumeric >= 70 ? 'B+' : scoreNumeric >= 60 ? 'B' : scoreNumeric >= 50 ? 'B-' : scoreNumeric >= 40 ? 'C+' : scoreNumeric >= 30 ? 'C' : scoreNumeric >= 20 ? 'D' : 'F'

  return {
    strategyId: '',
    strategyName: '',
    winRate,
    avgR,
    maxDrawdown,
    profitFactor,
    tradesCount,
    scoreNumeric,
    scoreLetter,
  }
}

export function getAdaptiveRiskPerTrade(
  consecutiveLosses: number,
  defaultRisk: number,
): number {
  if (consecutiveLosses >= 5) return defaultRisk * 0.25
  if (consecutiveLosses >= 3) return defaultRisk * 0.5
  return defaultRisk
}

export function checkTradeAllowed(
  dailyState: DailyRiskState,
  config: RiskConfig,
): { allowed: boolean; reason: string } {
  if (dailyState.breached) return { allowed: false, reason: 'Daily loss limit reached' }
  const remainingLossPct = config.dailyLossLimit * 100 - Math.abs(dailyState.pnlPercent)
  if (remainingLossPct <= 0) return { allowed: false, reason: 'No remaining daily risk budget' }
  return { allowed: true, reason: '' }
}
