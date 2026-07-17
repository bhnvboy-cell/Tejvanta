import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { DataConnectionStatus } from '../types/Instrument'

interface ConnectionState {
  dataSource: DataConnectionStatus
}

const initialState: ConnectionState = {
  dataSource: {
    source: 'simulation',
    state: 'connecting',
    message: 'Connecting...',
  },
}

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setDataConnectionStatus(state, action: PayloadAction<DataConnectionStatus>) {
      state.dataSource = action.payload
    },
  },
})

export const { setDataConnectionStatus } = connectionSlice.actions
export default connectionSlice.reducer
