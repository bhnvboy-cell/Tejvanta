import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { OrderFormState, OrderSide, OrderFormType } from '../types/orderTypes'

interface OrderSliceState {
  forms: Record<string, OrderFormState>
}

const defaultForm = (): OrderFormState => ({
  side: 'BUY',
  type: 'MARKET',
  quantity: 25,
  price: 0,
  stopLoss: 0,
  takeProfit: 0,
})

const initialState: OrderSliceState = {
  forms: {},
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    initForm(state, action: PayloadAction<{ symbol: string; price?: number }>) {
      const { symbol, price } = action.payload
      if (!state.forms[symbol]) {
        state.forms[symbol] = { ...defaultForm(), price: price ?? 0 }
      }
    },
    setSide(state, action: PayloadAction<{ symbol: string; side: OrderSide }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.side = action.payload.side
    },
    setOrderType(state, action: PayloadAction<{ symbol: string; type: OrderFormType }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.type = action.payload.type
    },
    setQuantity(state, action: PayloadAction<{ symbol: string; quantity: number }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.quantity = Math.max(1, action.payload.quantity)
    },
    setPrice(state, action: PayloadAction<{ symbol: string; price: number }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.price = action.payload.price
    },
    setStopLoss(state, action: PayloadAction<{ symbol: string; value: number }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.stopLoss = action.payload.value
    },
    setTakeProfit(state, action: PayloadAction<{ symbol: string; value: number }>) {
      const form = state.forms[action.payload.symbol]
      if (form) form.takeProfit = action.payload.value
    },
    resetForm(state, action: PayloadAction<string>) {
      state.forms[action.payload] = defaultForm()
    },
  },
})

export const {
  initForm, setSide, setOrderType, setQuantity,
  setPrice, setStopLoss, setTakeProfit, resetForm,
} = orderSlice.actions
export default orderSlice.reducer
