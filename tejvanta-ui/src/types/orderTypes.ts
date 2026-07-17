export type OrderSide = 'BUY' | 'SELL'
export type OrderFormType = 'MARKET' | 'LIMIT'

export interface OrderFormState {
  side: OrderSide
  type: OrderFormType
  quantity: number
  price: number
  stopLoss: number
  takeProfit: number
}

export interface OrderValue {
  total: number
  slValue: number
  tpValue: number
}

export type OrderFormField = keyof Omit<OrderFormState, 'side' | 'type'>
