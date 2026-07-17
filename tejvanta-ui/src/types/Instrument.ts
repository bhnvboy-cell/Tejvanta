export interface Instrument {
  id: number
  symbol: string
  name: string
  exchange: string
  tickSize: number
  lotSize: number
  segment: string
  series: string
}

export interface Candle {
  id: number
  instrumentId: number
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timeframe: string
}

export type DataSourceType = 'simulation'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface DataConnectionStatus {
  source: DataSourceType
  state: ConnectionState
  message?: string
}

export interface Tick {
  instrumentId: number
  symbol?: string
  timestamp: string
  price: number
  volume: number
  bid: number
  ask: number
  open: number
  high: number
  low: number
  prevClose: number
  change: number
  changePercent: number
}
