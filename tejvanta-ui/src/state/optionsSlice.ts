import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { OptionsContract } from '../types/OptionsContract'
import { optionsService } from '../services/optionsService'

interface OptionsState {
  contracts: OptionsContract[]
  expiries: string[]
  selectedExpiry: string | null
  underlyingSymbol: string | null
  loading: boolean
  error: string | null
}

const initialState: OptionsState = {
  contracts: [],
  expiries: [],
  selectedExpiry: null,
  underlyingSymbol: null,
  loading: false,
  error: null,
}

export const fetchOptionsChain = createAsyncThunk(
  'options/fetchChain',
  async ({ symbol, expiry }: { symbol: string; expiry?: string }) => {
    const response = await optionsService.getChain(symbol, expiry)
    return response
  }
)

export const fetchExpiries = createAsyncThunk(
  'options/fetchExpiries',
  async (symbol: string) => optionsService.getExpiries(symbol)
)

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {
    updateContracts(state, action: PayloadAction<OptionsContract[]>) {
      state.contracts = action.payload
    },
    setSelectedExpiry(state, action: PayloadAction<string>) {
      state.selectedExpiry = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOptionsChain.fulfilled, (state, action) => {
        state.contracts = action.payload.contracts
        state.underlyingSymbol = action.payload.symbol
        state.selectedExpiry = action.payload.expiry
        state.loading = false
      })
      .addCase(fetchOptionsChain.pending, (state) => { state.loading = true })
      .addCase(fetchOptionsChain.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch options chain'
      })
      .addCase(fetchExpiries.fulfilled, (state, action) => {
        state.expiries = action.payload
      })
  },
})

export const { updateContracts, setSelectedExpiry } = optionsSlice.actions
export default optionsSlice.reducer
