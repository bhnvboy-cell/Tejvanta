import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DrawingPoint {
  time: number
  price: number
}

export type DrawingToolType =
  | 'trend-line' | 'horizontal-line' | 'vertical-line' | 'rectangle'
  | 'ray' | 'extended-line' | 'parallel-channel'
  | 'fib-retracement' | 'fib-extension'
  | 'ellipse' | 'text' | 'brush' | 'measure'
  | 'move' | 'delete'

export interface Drawing {
  id: string
  type: DrawingToolType
  start: DrawingPoint
  end: DrawingPoint
  color: string
  width: number
}

export type ToolType = DrawingToolType | null

interface DrawingState {
  drawings: Drawing[]
  activeTool: ToolType
  activeDrawingId: string | null
}

const initialState: DrawingState = {
  drawings: [],
  activeTool: null,
  activeDrawingId: null,
}

let nextId = 1

const drawingSlice = createSlice({
  name: 'drawing',
  initialState,
  reducers: {
    addDrawing(state, action: PayloadAction<Omit<Drawing, 'id'>>) {
      state.drawings.push({ ...action.payload, id: `d${nextId++}` })
    },
    updateDrawing(state, action: PayloadAction<{ id: string; changes: Partial<Drawing> }>) {
      const idx = state.drawings.findIndex(d => d.id === action.payload.id)
      if (idx >= 0) {
        state.drawings[idx] = { ...state.drawings[idx], ...action.payload.changes }
      }
    },
    deleteDrawing(state, action: PayloadAction<string>) {
      state.drawings = state.drawings.filter(d => d.id !== action.payload)
      if (state.activeDrawingId === action.payload) state.activeDrawingId = null
    },
    setActiveTool(state, action: PayloadAction<ToolType>) {
      state.activeTool = action.payload
    },
    setActiveDrawing(state, action: PayloadAction<string | null>) {
      state.activeDrawingId = action.payload
    },
    clearDrawings(state) {
      state.drawings = []
      state.activeDrawingId = null
    },
  },
})

export const { addDrawing, updateDrawing, deleteDrawing, setActiveTool, setActiveDrawing, clearDrawings } = drawingSlice.actions
export default drawingSlice.reducer
