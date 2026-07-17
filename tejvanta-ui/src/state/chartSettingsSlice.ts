import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AdvancedChartSettings, IndicatorConfig, CompareSymbol, RiskOverlay } from '../types/chartSettings'
import { DEFAULT_ADVANCED_SETTINGS } from '../types/chartSettings'

interface ChartSettingsState {
  advanced: AdvancedChartSettings
  indicators: IndicatorConfig[]
  compareSymbols: CompareSymbol[]
  riskOverlay: RiskOverlay | null
  templates: Array<{ id: string; name: string; description: string; createdAt: number }>
  linked: boolean
  syncTimeframe: boolean
  syncSymbol: boolean
  syncZoom: boolean
}

const STORAGE_KEY = 'tj_chart_advanced'

function load(): ChartSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    advanced: { ...DEFAULT_ADVANCED_SETTINGS },
    indicators: [],
    compareSymbols: [],
    riskOverlay: null,
    templates: [],
    linked: false,
    syncTimeframe: true,
    syncSymbol: true,
    syncZoom: true,
  }
}

function save(state: ChartSettingsState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

const initialState = load()

const chartSettingsSlice = createSlice({
  name: 'chartSettings',
  initialState,
  reducers: {
    updateAdvanced(state, action: PayloadAction<Partial<AdvancedChartSettings>>) {
      state.advanced = { ...state.advanced, ...action.payload }
      save(state)
    },
    resetAdvanced(state) {
      state.advanced = { ...DEFAULT_ADVANCED_SETTINGS }
      save(state)
    },

    addIndicator(state, action: PayloadAction<IndicatorConfig>) {
      state.indicators.push(action.payload)
      save(state)
    },
    updateIndicator(state, action: PayloadAction<{ id: string; changes: Partial<IndicatorConfig> }>) {
      const idx = state.indicators.findIndex(i => i.id === action.payload.id)
      if (idx >= 0) {
        state.indicators[idx] = { ...state.indicators[idx], ...action.payload.changes }
        save(state)
      }
    },
    removeIndicator(state, action: PayloadAction<string>) {
      state.indicators = state.indicators.filter(i => i.id !== action.payload)
      save(state)
    },
    toggleIndicator(state, action: PayloadAction<string>) {
      const idx = state.indicators.findIndex(i => i.id === action.payload)
      if (idx >= 0) { state.indicators[idx].enabled = !state.indicators[idx].enabled; save(state) }
    },
    reorderIndicators(state, action: PayloadAction<IndicatorConfig[]>) {
      state.indicators = action.payload; save(state)
    },

    addCompareSymbol(state, action: PayloadAction<CompareSymbol>) {
      state.compareSymbols.push(action.payload); save(state)
    },
    updateCompareSymbol(state, action: PayloadAction<{ symbol: string; changes: Partial<CompareSymbol> }>) {
      const idx = state.compareSymbols.findIndex(s => s.symbol === action.payload.symbol)
      if (idx >= 0) { state.compareSymbols[idx] = { ...state.compareSymbols[idx], ...action.payload.changes }; save(state) }
    },
    removeCompareSymbol(state, action: PayloadAction<string>) {
      state.compareSymbols = state.compareSymbols.filter(s => s.symbol !== action.payload); save(state)
    },

    setRiskOverlay(state, action: PayloadAction<RiskOverlay | null>) {
      state.riskOverlay = action.payload; save(state)
    },

    setLinked(state, action: PayloadAction<boolean>) { state.linked = action.payload; save(state) },
    setSyncTimeframe(state, action: PayloadAction<boolean>) { state.syncTimeframe = action.payload; save(state) },
    setSyncSymbol(state, action: PayloadAction<boolean>) { state.syncSymbol = action.payload; save(state) },
    setSyncZoom(state, action: PayloadAction<boolean>) { state.syncZoom = action.payload; save(state) },

    addTemplate(state, action: PayloadAction<{ id: string; name: string; description: string }>) {
      state.templates.push({ ...action.payload, createdAt: Date.now() }); save(state)
    },
    removeTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter(t => t.id !== action.payload); save(state)
    },

    applyTemplate(state, action: PayloadAction<{ advanced: AdvancedChartSettings; indicators: IndicatorConfig[] }>) {
      state.advanced = action.payload.advanced
      state.indicators = action.payload.indicators
      save(state)
    },
  },
})

export const {
  updateAdvanced, resetAdvanced,
  addIndicator, updateIndicator, removeIndicator, toggleIndicator, reorderIndicators,
  addCompareSymbol, updateCompareSymbol, removeCompareSymbol,
  setRiskOverlay, setLinked, setSyncTimeframe, setSyncSymbol, setSyncZoom,
  addTemplate, removeTemplate, applyTemplate,
} = chartSettingsSlice.actions
export default chartSettingsSlice.reducer
