import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AlertCondition } from '../types/chartSettings'

interface AlertsState {
  conditions: AlertCondition[]
  history: Array<{ conditionId: string; message: string; time: number; price: number }>
  muted: boolean
}

const STORAGE = 'tj_alerts'

function load(): AlertsState {
  try { return JSON.parse(localStorage.getItem(STORAGE) || JSON.stringify({ conditions: [], history: [], muted: false })) } catch { return { conditions: [], history: [], muted: false } }
}

function save(s: AlertsState) { try { localStorage.setItem(STORAGE, JSON.stringify(s)) } catch {} }

const initialState = load()

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlertCondition(state, action: PayloadAction<Omit<AlertCondition, 'id' | 'createdAt' | 'triggeredCount' | 'lastTriggered'>>) {
      state.conditions.push({
        ...action.payload,
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        triggeredCount: 0,
        lastTriggered: null,
      })
      save(state)
    },
    updateAlertCondition(state, action: PayloadAction<{ id: string; changes: Partial<AlertCondition> }>) {
      const idx = state.conditions.findIndex(c => c.id === action.payload.id)
      if (idx >= 0) { state.conditions[idx] = { ...state.conditions[idx], ...action.payload.changes }; save(state) }
    },
    removeAlertCondition(state, action: PayloadAction<string>) {
      state.conditions = state.conditions.filter(c => c.id !== action.payload); save(state)
    },
    toggleAlertCondition(state, action: PayloadAction<string>) {
      const idx = state.conditions.findIndex(c => c.id === action.payload)
      if (idx >= 0) { state.conditions[idx].enabled = !state.conditions[idx].enabled; save(state) }
    },
    triggerAlert(state, action: PayloadAction<{ conditionId: string; message: string; price: number }>) {
      const c = state.conditions.find(x => x.id === action.payload.conditionId)
      if (c) { c.triggeredCount++; c.lastTriggered = Date.now() }
      state.history.push({ ...action.payload, time: Date.now() })
      save(state)
    },
    clearAlertHistory(state) { state.history = []; save(state) },
    setMuted(state, action: PayloadAction<boolean>) { state.muted = action.payload; save(state) },
  },
})

export const {
  addAlertCondition, updateAlertCondition, removeAlertCondition, toggleAlertCondition,
  triggerAlert, clearAlertHistory, setMuted,
} = alertsSlice.actions
export default alertsSlice.reducer
