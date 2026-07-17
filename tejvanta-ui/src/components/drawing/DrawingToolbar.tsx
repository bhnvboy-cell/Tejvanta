import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { setActiveTool, clearDrawings } from '../../state/drawingSlice'
import type { DrawingToolType } from '../../state/drawingSlice'

type ToolEntry = { id: DrawingToolType | null; icon: string; label: string; shortcut?: string }

const TOOLS: ToolEntry[] = [
  { id: null, icon: '↖', label: 'Cursor', shortcut: 'Esc' },
  { id: 'trend-line', icon: '╱', label: 'Trend Line', shortcut: 'T' },
  { id: 'horizontal-line', icon: '―', label: 'Horizontal', shortcut: 'H' },
  { id: 'vertical-line', icon: '│', label: 'Vertical', shortcut: 'V' },
  { id: 'rectangle', icon: '▭', label: 'Rectangle', shortcut: 'D' },
]

export function DrawingToolbar() {
  const dispatch = useAppDispatch()
  const activeTool = useAppSelector(s => s.drawing.activeTool)
  const drawingCount = useAppSelector(s => s.drawing.drawings.length)

  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 bg-gray-800/90 rounded border border-gray-700 shadow-lg">
      {TOOLS.map(t => (
        <button
          key={t.label}
          onClick={() => dispatch(setActiveTool(t.id))}
          title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
          className={`px-1.5 py-1 rounded text-xs leading-none transition ${activeTool === t.id ? 'bg-tej-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
        >
          {t.icon}
        </button>
      ))}
      <div className="w-px h-5 bg-gray-600 mx-1" />
      <button
        onClick={() => dispatch(clearDrawings())}
        disabled={drawingCount === 0}
        title="Clear all drawings"
        className="px-1.5 py-1 rounded text-xs text-gray-400 hover:text-red-400 hover:bg-gray-700 disabled:opacity-30"
      >
        🗑
      </button>
    </div>
  )
}
