import { configureStore } from '@reduxjs/toolkit'
import marketReducer from './marketSlice'
import tradingReducer from './tradingSlice'
import optionsReducer from './optionsSlice'
import settingsReducer from './settingsSlice'
import replayReducer from './replaySlice'
import replayTradingReducer from './replayTradingSlice'
import drawingReducer from './drawingSlice'
import connectionReducer from './connectionSlice'
import chartSettingsReducer from './chartSettingsSlice'
import alertsReducer from './alertsSlice'
import orderReducer from './orderSlice'

export const store = configureStore({
  reducer: {
    market: marketReducer,
    trading: tradingReducer,
    options: optionsReducer,
    settings: settingsReducer,
    replay: replayReducer,
    replayTrading: replayTradingReducer,
    drawing: drawingReducer,
    connection: connectionReducer,
    chartSettings: chartSettingsReducer,
    alerts: alertsReducer,
    order: orderReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
