interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

export interface BacktestOrder {
  id: string
  entryTime: number
  exitTime: number | null
  side: 'buy' | 'sell'
  entryPrice: number
  exitPrice: number | null
  quantity: number
  stopLoss: number
  takeProfit: number
  pnl: number
  rMultiple: number
  status: 'open' | 'closed' | 'sl-hit' | 'tp-hit'
  reason?: string
}

export interface BacktestResult {
  orders: BacktestOrder[]
  netProfit: number
  grossProfit: number
  grossLoss: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  profitFactor: number
  expectancy: number
  avgR: number
  maxDrawdown: number
  maxDrawdownPct: number
  equityCurve: Array<{ time: number; equity: number }>
  sharpeRatio: number
}

export interface BacktestStrategy {
  id: string
  name: string
  entryRule: (candle: Candle, index: number, data: Candle[]) => 'buy' | 'sell' | null
  exitRule: (candle: Candle, index: number, data: Candle[], order: BacktestOrder) => 'exit' | 'sl' | 'tp' | null
  stopLoss: number
  takeProfit: number
  useTrailingSL: boolean
  trailingSLActivation: number
  trailingSLDistance: number
}

export function runBacktest(data: Candle[], strategy: BacktestStrategy, initialCapital: number): BacktestResult {
  const orders: BacktestOrder[] = []
  const equityCurve: Array<{ time: number; equity: number }> = []
  let capital = initialCapital
  let peak = initialCapital
  let maxDD = 0
  let grossProfit = 0, grossLoss = 0
  let openOrder: BacktestOrder | null = null
  let orderId = 0
  let entryPriceForOrder = 0

  for (let i = 0; i < data.length; i++) {
    const c = data[i]

    if (!openOrder) {
      const signal = strategy.entryRule(c, i, data)
      if (signal) {
        entryPriceForOrder = c.close
        const qty = Math.floor(capital * 0.02 / c.close) || 1
        const sl = signal === 'buy' ? c.close * (1 - strategy.stopLoss / 100) : c.close * (1 + strategy.stopLoss / 100)
        const tp = signal === 'buy' ? c.close * (1 + strategy.takeProfit / 100) : c.close * (1 - strategy.takeProfit / 100)
        openOrder = {
          id: `bt_${orderId++}`, entryTime: c.time, exitTime: null,
          side: signal, entryPrice: c.close, exitPrice: null,
          quantity: qty, stopLoss: sl, takeProfit: tp,
          pnl: 0, rMultiple: 0, status: 'open',
        }
      }
    } else {
      const exit = strategy.exitRule(c, i, data, openOrder)
      if (exit || (openOrder.side === 'buy' && c.low <= openOrder.stopLoss) || (openOrder.side === 'sell' && c.high >= openOrder.stopLoss) ||
          (openOrder.side === 'buy' && c.high >= openOrder.takeProfit) || (openOrder.side === 'sell' && c.low <= openOrder.takeProfit)) {
        let exitPrice: number, reason: string
        if ((openOrder.side === 'buy' && c.low <= openOrder.stopLoss) || (openOrder.side === 'sell' && c.high >= openOrder.stopLoss)) {
          exitPrice = openOrder.stopLoss; reason = 'SL'; openOrder.status = 'sl-hit'
        } else if ((openOrder.side === 'buy' && c.high >= openOrder.takeProfit) || (openOrder.side === 'sell' && c.low <= openOrder.takeProfit)) {
          exitPrice = openOrder.takeProfit; reason = 'TP'; openOrder.status = 'tp-hit'
        } else {
          exitPrice = c.close; reason = exit || 'exit'; openOrder.status = 'closed'
        }

        const multiplier = openOrder.side === 'buy' ? 1 : -1
        openOrder.pnl = (exitPrice - openOrder.entryPrice) * multiplier * openOrder.quantity
        openOrder.rMultiple = Math.abs((exitPrice - openOrder.entryPrice) / (openOrder.stopLoss - openOrder.entryPrice || 1))
        openOrder.exitPrice = exitPrice
        openOrder.exitTime = c.time
        openOrder.reason = reason

        capital += openOrder.pnl
        if (openOrder.pnl > 0) grossProfit += openOrder.pnl; else grossLoss += Math.abs(openOrder.pnl)
        orders.push(openOrder)
        openOrder = null
      }

      // trailing SL
      if (strategy.useTrailingSL && openOrder && openOrder.side === 'buy') {
        const activationPrice = entryPriceForOrder * (1 + strategy.trailingSLActivation / 100)
        if (c.high >= activationPrice) {
          const newSl = c.high * (1 - strategy.trailingSLDistance / 100)
          if (newSl > openOrder.stopLoss) openOrder.stopLoss = newSl
        }
      }
    }

    if (capital > peak) peak = capital
    const dd = (peak - capital) / peak * 100
    if (dd > maxDD) maxDD = dd
    if (i % 5 === 0) equityCurve.push({ time: c.time, equity: capital })
  }

  const total = orders.length
  const wins = orders.filter(o => o.pnl > 0).length
  const losses = orders.filter(o => o.pnl < 0).length
  const winRate = total > 0 ? wins / total : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  const totalR = orders.reduce((s, o) => s + o.rMultiple, 0)
  const avgR = total > 0 ? totalR / total : 0
  const returns = orders.map(o => o.pnl / initialCapital)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / Math.max(returns.length, 1))
  const sharpe = stdDev > 0 ? avgReturn / stdDev * Math.sqrt(252) : 0

  return {
    orders, netProfit: capital - initialCapital, grossProfit, grossLoss,
    totalTrades: total, winningTrades: wins, losingTrades: losses,
    winRate, profitFactor, expectancy: avgR, avgR, maxDrawdown: maxDD,
    maxDrawdownPct: maxDD, equityCurve, sharpeRatio: sharpe,
  }
}

export function generateBacktestReport(result: BacktestResult): string {
  return [
    `=== Backtest Report ===`,
    `Net Profit: ${result.netProfit.toFixed(2)}`,
    `Gross Profit: ${result.grossProfit.toFixed(2)} | Gross Loss: ${result.grossLoss.toFixed(2)}`,
    `Total Trades: ${result.totalTrades}`,
    `Win Rate: ${(result.winRate * 100).toFixed(1)}%`,
    `Profit Factor: ${result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)}`,
    `Avg R: ${result.avgR.toFixed(2)}`,
    `Expectancy: ${result.expectancy.toFixed(2)}`,
    `Max Drawdown: ${result.maxDrawdown.toFixed(2)}%`,
    `Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`,
    `--- Equity Curve: ${result.equityCurve.length} points ---`,
  ].join('\n')
}
