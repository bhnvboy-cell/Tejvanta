export type TimezoneId =
  | 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles'
  | 'Europe/London' | 'Europe/Berlin' | 'Europe/Moscow'
  | 'Asia/Tokyo' | 'Asia/Hong_Kong' | 'Asia/Kolkata' | 'Asia/Singapore' | 'Asia/Shanghai'
  | 'Australia/Sydney' | 'Pacific/Auckland'
  | 'Africa/Cairo' | 'Africa/Johannesburg'
  | 'UTC'

export type Precision = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type CrosshairStyle = 'cross' | 'vertical' | 'horizontal'

export type DrawingToolId =
  | 'trend-line' | 'horizontal-line' | 'vertical-line' | 'ray' | 'extended-line'
  | 'parallel-channel' | 'fib-retracement' | 'fib-extension'
  | 'rectangle' | 'ellipse' | 'brush' | 'text' | 'measure'
  | 'move' | 'delete'

export interface DrawingToolConfig {
  id: DrawingToolId
  name: string
  icon: string
  shortcut?: string
  persistent: boolean
  magnet: boolean
}

export interface TrendLine {
  id: string
  type: 'trend-line' | 'horizontal-line' | 'vertical-line' | 'ray' | 'extended-line'
  start: { time: number; price: number }
  end: { time: number; price: number }
  color: string
  width: number
  style: 'solid' | 'dashed' | 'dotted'
  extendLeft: boolean
  extendRight: boolean
  text?: string
}

export interface Channel {
  id: string
  type: 'parallel-channel'
  points: Array<{ time: number; price: number }>
  color: string
  width: number
  style: 'solid' | 'dashed'
}

export interface FibLevel {
  level: number
  color: string
  visible: boolean
}

export interface FibRetracement {
  id: string
  type: 'fib-retracement' | 'fib-extension'
  start: { time: number; price: number }
  end: { time: number; price: number }
  levels: FibLevel[]
  color: string
  width: number
  style: 'solid' | 'dashed'
  trend: 'up' | 'down'
}

export interface Rectangle {
  id: string
  type: 'rectangle' | 'ellipse'
  start: { time: number; price: number }
  end: { time: number; price: number }
  color: string
  fillColor: string
  width: number
}

export interface TextLabel {
  id: string
  type: 'text'
  position: { time: number; price: number }
  text: string
  color: string
  fontSize: number
}

export interface BrushStroke {
  id: string
  type: 'brush'
  points: Array<{ time: number; price: number }>
  color: string
  width: number
}

export type AdvancedDrawing = TrendLine | Channel | FibRetracement | Rectangle | TextLabel | BrushStroke

export interface ChartTemplate {
  id: string
  name: string
  description: string
  settings: AdvancedChartSettings
  indicators: IndicatorConfig[]
  drawings: AdvancedDrawing[]
  chartType: string
  timeframe: string
  createdAt: number
  updatedAt: number
}

export interface AdvancedChartSettings {
  upColor: string
  downColor: string
  borderUpColor: string
  borderDownColor: string
  wickUpColor: string
  wickDownColor: string
  colorBarsBasedOnPreviousClose: boolean
  dividendAdjustment: boolean
  precision: Precision
  timezone: TimezoneId
  background: string
  gridVertLines: boolean
  gridVertColor: string
  gridHorzLines: boolean
  gridHorzColor: string
  crosshairStyle: CrosshairStyle
  crosshairColor: string
  crosshairWidth: number
  sessionBreaks: boolean
  sessionBreakColor: string
  watermark: string
  watermarkEnabled: boolean
  watermarkColor: string
  watermarkFontSize: number
}

export const DEFAULT_ADVANCED_SETTINGS: AdvancedChartSettings = {
  upColor: '#22c55e',
  downColor: '#ef4444',
  borderUpColor: '#22c55e',
  borderDownColor: '#ef4444',
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
  colorBarsBasedOnPreviousClose: false,
  dividendAdjustment: false,
  precision: 2,
  timezone: 'Asia/Kolkata',
  background: '#ffffff',
  gridVertLines: true,
  gridVertColor: '#e5e7eb',
  gridHorzLines: true,
  gridHorzColor: '#e5e7eb',
  crosshairStyle: 'cross',
  crosshairColor: '#6366f1',
  crosshairWidth: 1,
  sessionBreaks: false,
  sessionBreakColor: '#374151',
  watermark: 'Tejvanta',
  watermarkEnabled: false,
  watermarkColor: '#d1d5db',
  watermarkFontSize: 48,
}

export interface IndicatorConfig {
  id: string
  name: string
  type: 'builtin' | 'pine'
  enabled: boolean
  params: Record<string, number | string | boolean>
  style: {
    color: string
    width: number
    style: 'line' | 'dashed' | 'dotted'
    visible: boolean
  }
  outputIndex: number
  pane: 'main' | 'separate'
  pineCode?: string
}

export interface AlertCondition {
  id: string
  symbol: string
  type: 'price' | 'indicator' | 'condition'
  operator: 'crosses' | 'crosses-above' | 'crosses-below' | 'greater-than' | 'less-than' | 'equals'
  value1: number
  value2?: number
  indicator?: string
  source?: 'close' | 'open' | 'high' | 'low' | 'volume'
  message: string
  sound: string
  once: boolean
  expiration: number | null
  createdAt: number
  triggeredCount: number
  lastTriggered: number | null
  enabled: boolean
}

export interface OrderMarker {
  id: string
  type: 'entry' | 'exit' | 'sl' | 'tp'
  side: 'buy' | 'sell'
  time: number
  price: number
  quantity: number
  label: string
  color: string
  tradeId?: string
}

export interface CompareSymbol {
  symbol: string
  color: string
  lineWidth: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  normalizeTo100: boolean
  percentageMode: boolean
  visible: boolean
  data: Array<{ time: number; value: number }>
}

export interface RiskOverlay {
  entryPrice: number
  stopLoss: number
  takeProfit: number
  quantity: number
  direction: 'long' | 'short'
  visible: boolean
  color: string
}

export interface CoachingAnnotation {
  id: string
  type: 'mistake' | 'pattern' | 'risk' | 'coaching'
  time: number
  price: number
  message: string
  severity: 'info' | 'warning' | 'critical'
  color: string
  dismissed: boolean
}
