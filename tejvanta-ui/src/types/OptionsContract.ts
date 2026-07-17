export interface OptionsContract {
  id: number
  underlyingInstrumentId: number
  strike: number
  expiry: string
  optionType: 'CE' | 'PE'
  ltp: number
  bid: number
  ask: number
  openInterest: number
  volume: number
  iv: number
  change: number
  changePercent: number
}

export interface OptionsChainResponse {
  symbol: string
  expiry: string
  contracts: OptionsContract[]
}

export interface ReplayCandle {
  instrumentId: number
  timestamp: string
  open: number
  high: number
  low: number
  close: number
}

export interface ReplayState {
  instrumentId: number
  isPlaying: boolean
  currentTime: string
  from: string
  to: string
  speed: number
  tickCount: number
  progressPercent: number
}
