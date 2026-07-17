import { useEffect } from 'react'
import { signalRService } from '../services/signalRService'
import type { Tick } from '../types/Instrument'
import type { Order, Position } from '../types/Order'
import type { OptionsContract } from '../types/OptionsContract'
import { useAppDispatch } from './useAppDispatch'
import { updateTick } from '../state/marketSlice'
import { updateOrder, updatePosition } from '../state/tradingSlice'
import { updateContracts } from '../state/optionsSlice'

export function useWebSocket() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const connect = async () => {
      try {
        await signalRService.connectMarket()
        await signalRService.connectTrading()
        await signalRService.connectOptions()
        await signalRService.connectReplay()
        await signalRService.startAll()
      } catch (err) {
        console.error('WebSocket connection failed:', err)
      }
    }

    connect()

    const unsubTick = signalRService.onTick((tick: Tick) => {
      dispatch(updateTick(tick))
    })

    const unsubOrder = signalRService.onOrder((order: Order) => {
      dispatch(updateOrder(order))
    })

    const unsubPos = signalRService.onPosition((position: Position) => {
      dispatch(updatePosition(position))
    })

    const unsubOpt = signalRService.onOptions((contracts: OptionsContract[]) => {
      dispatch(updateContracts(contracts))
    })

    return () => {
      unsubTick(); unsubOrder(); unsubPos(); unsubOpt()
      signalRService.disconnect()
    }
  }, [dispatch])
}
