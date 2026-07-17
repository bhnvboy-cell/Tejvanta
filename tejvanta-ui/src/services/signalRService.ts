import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr'
import type { Tick, DataConnectionStatus } from '../types/Instrument'
import type { Order, Position } from '../types/Order'
import type { OptionsContract } from '../types/OptionsContract'
import type { ReplayState, ReplayCandle } from '../types/OptionsContract'

class SignalRService {
  private marketHub: HubConnection | null = null
  private tradingHub: HubConnection | null = null
  private optionsHub: HubConnection | null = null
  private replayHub: HubConnection | null = null

  tickHandlers: ((tick: Tick) => void)[] = []
  orderHandlers: ((order: Order) => void)[] = []
  positionHandlers: ((position: Position) => void)[] = []
  optionsHandlers: ((contracts: OptionsContract[]) => void)[] = []
  replayTickHandlers: ((tick: Tick) => void)[] = []
  replayStateHandlers: ((state: ReplayState) => void)[] = []
  replayCandleHandlers: ((candle: ReplayCandle) => void)[] = []

  dataStatusHandlers: ((status: DataConnectionStatus) => void)[] = []

  private subscribedSymbols: Set<string> = new Set()
  private reconnectCallbacks: (() => void)[] = []
  private started = false

  onReconnect(cb: () => void) {
    this.reconnectCallbacks.push(cb)
    return () => { this.reconnectCallbacks = this.reconnectCallbacks.filter(c => c !== cb) }
  }

  private async ensureConnected(hub: HubConnection | null): Promise<void> {
    if (!hub) throw new Error('Hub not initialized')
    if (hub.state === 'Connected') return
    if (hub.state === 'Disconnected') {
      await hub.start()
      return
    }
    // Don't hang forever on reconnecting — caller can retry later
    return
  }

  async subscribeSymbol(symbol: string) {
    this.subscribedSymbols.add(symbol)
    if (this.marketHub?.state === 'Connected') {
      try { await this.marketHub.invoke('SubscribeSymbol', symbol) } catch (e) { console.warn('subscribeSymbol failed:', e) }
    }
  }

  async unsubscribeSymbol(symbol: string) {
    this.subscribedSymbols.delete(symbol)
    if (this.marketHub?.state === 'Connected') {
      try { await this.marketHub.invoke('UnsubscribeSymbol', symbol) } catch {}
    }
  }

  async resubscribeAll() {
    if (this.marketHub?.state !== 'Connected') return
    for (const symbol of this.subscribedSymbols) {
      try { await this.marketHub.invoke('SubscribeSymbol', symbol) } catch {}
    }
    this.reconnectCallbacks.forEach(cb => cb())
  }

  private buildHub(baseUrl: string): HubConnection {
    const hub = new HubConnectionBuilder()
      .withUrl(baseUrl)
      .withAutomaticReconnect()
      .build()

    hub.onreconnected(() => {
      this.resubscribeAll()
    })

    return hub
  }

  async connectMarket() {
    this.marketHub = this.buildHub('/ws/market/ticks')

    this.marketHub.on('Tick', (tick: Tick) => {
      this.tickHandlers.forEach(h => h(tick))
    })

    this.marketHub.on('DataConnectionStatus', (status: DataConnectionStatus) => {
      this.dataStatusHandlers.forEach(h => h(status))
    })

    return this.marketHub
  }

  async connectTrading() {
    this.tradingHub = this.buildHub('/ws/trading')

    this.tradingHub.on('OrderUpdated', (order: Order) => {
      this.orderHandlers.forEach(h => h(order))
    })

    this.tradingHub.on('PositionUpdated', (position: Position) => {
      this.positionHandlers.forEach(h => h(position))
    })

    return this.tradingHub
  }

  async connectOptions() {
    this.optionsHub = this.buildHub('/ws/options')

    this.optionsHub.on('OptionsChainUpdated', (contracts: OptionsContract[]) => {
      this.optionsHandlers.forEach(h => h(contracts))
    })

    return this.optionsHub
  }

  async connectReplay() {
    this.replayHub = this.buildHub('/ws/replay')

    this.replayHub.on('ReplayTick', (tick: Tick) => {
      this.replayTickHandlers.forEach(h => h(tick))
    })

    this.replayHub.on('ReplayState', (state: ReplayState) => {
      this.replayStateHandlers.forEach(h => h(state))
    })

    this.replayHub.on('ReplayCandleCompleted', (candle: ReplayCandle) => {
      this.replayCandleHandlers.forEach(h => h(candle))
    })

    return this.replayHub
  }

  async startAll() {
    if (this.started) return
    this.started = true

    const hubs = [this.marketHub, this.tradingHub, this.optionsHub, this.replayHub].filter(Boolean) as HubConnection[]
    for (const hub of hubs) {
      try {
        await hub.start()
      } catch (e) {
        console.warn('Hub start failed, will retry on next invoke:', e)
      }
    }
  }

  async subscribeReplay(instrumentId: number) {
    await this.ensureConnected(this.replayHub)
    return this.replayHub?.invoke('SubscribeReplay', instrumentId)
  }

  async unsubscribeReplay(instrumentId: number) {
    await this.ensureConnected(this.replayHub)
    return this.replayHub?.invoke('UnsubscribeReplay', instrumentId)
  }

  onTick(handler: (tick: Tick) => void) {
    this.tickHandlers.push(handler)
    return () => { this.tickHandlers = this.tickHandlers.filter(h => h !== handler) }
  }

  onOrder(handler: (order: Order) => void) {
    this.orderHandlers.push(handler)
    return () => { this.orderHandlers = this.orderHandlers.filter(h => h !== handler) }
  }

  onPosition(handler: (position: Position) => void) {
    this.positionHandlers.push(handler)
    return () => { this.positionHandlers = this.positionHandlers.filter(h => h !== handler) }
  }

  onOptions(handler: (contracts: OptionsContract[]) => void) {
    this.optionsHandlers.push(handler)
    return () => { this.optionsHandlers = this.optionsHandlers.filter(h => h !== handler) }
  }

  onReplayTick(handler: (tick: Tick) => void) {
    this.replayTickHandlers.push(handler)
    return () => { this.replayTickHandlers = this.replayTickHandlers.filter(h => h !== handler) }
  }

  onReplayState(handler: (state: ReplayState) => void) {
    this.replayStateHandlers.push(handler)
    return () => { this.replayStateHandlers = this.replayStateHandlers.filter(h => h !== handler) }
  }

  onDataConnectionStatus(handler: (status: DataConnectionStatus) => void) {
    this.dataStatusHandlers.push(handler)
    return () => { this.dataStatusHandlers = this.dataStatusHandlers.filter(h => h !== handler) }
  }

  async fetchDataStatus(): Promise<DataConnectionStatus | null> {
    try {
      const res = await fetch('/api/market/data-status')
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  onReplayCandleCompleted(handler: (candle: ReplayCandle) => void) {
    this.replayCandleHandlers.push(handler)
    return () => { this.replayCandleHandlers = this.replayCandleHandlers.filter(h => h !== handler) }
  }

  disconnect() {
    this.started = false
    this.marketHub?.stop()
    this.tradingHub?.stop()
    this.optionsHub?.stop()
    this.replayHub?.stop()
  }
}

export const signalRService = new SignalRService()
