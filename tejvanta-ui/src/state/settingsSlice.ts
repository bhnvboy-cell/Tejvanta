import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../services/apiClient'

interface SettingsState {
  theme: 'light' | 'dark'
  defaultTimeframe: string
  defaultLayout: number
  timezone: string
  virtualBalance: number
  indiaVix: number
  loading: boolean
}

interface SettingsData {
  theme: string
  defaultTimeframe: string
  defaultLayout: number
  timezone: string
  virtualBalance: number
  indiaVix: number
}

const initialState: SettingsState = {
  theme: 'dark',
  defaultTimeframe: '1D',
  defaultLayout: 1,
  timezone: 'Asia/Kolkata',
  virtualBalance: 1000000,
  indiaVix: 14,
  loading: false,
}

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  return api.get<SettingsData>('/settings')
})

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (data: Partial<SettingsData>) => {
    return api.post<SettingsData>('/settings', data)
  }
)

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
    },
    setDefaultLayout(state, action: PayloadAction<number>) {
      state.defaultLayout = action.payload
    },
    setDefaultTimeframe(state, action: PayloadAction<string>) {
      state.defaultTimeframe = action.payload
    },
    setIndiaVix(state, action: PayloadAction<number>) {
      state.indiaVix = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        const p = action.payload
        state.theme = (p.theme as 'light' | 'dark') ?? state.theme
        state.defaultTimeframe = p.defaultTimeframe ?? state.defaultTimeframe
        state.defaultLayout = p.defaultLayout ?? state.defaultLayout
        state.timezone = p.timezone ?? state.timezone
        state.virtualBalance = p.virtualBalance ?? state.virtualBalance
        state.indiaVix = p.indiaVix ?? state.indiaVix
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        const p = action.payload
        state.theme = (p.theme as 'light' | 'dark') ?? state.theme
        state.defaultTimeframe = p.defaultTimeframe ?? state.defaultTimeframe
        state.defaultLayout = p.defaultLayout ?? state.defaultLayout
        state.timezone = p.timezone ?? state.timezone
        state.indiaVix = p.indiaVix ?? state.indiaVix
      })
  },
})

export const { setTheme, setDefaultLayout, setDefaultTimeframe, setIndiaVix } = settingsSlice.actions
export default settingsSlice.reducer
