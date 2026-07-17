import { useRef, useEffect, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { addDrawing, updateDrawing, deleteDrawing, setActiveDrawing } from '../../state/drawingSlice'
import type { Drawing, DrawingPoint, DrawingToolType } from '../../state/drawingSlice'

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>
  chartRef?: React.MutableRefObject<any>
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']
const HIT = 8

function canvasCoords(e: MouseEvent, el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

function drawStroke(ctx: CanvasRenderingContext2D, color: string, w: number, fn: () => void) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); fn(); ctx.stroke()
}

function drawLineSegment(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, w: number) {
  drawStroke(ctx, color, w, () => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2) })
}

function hitTestSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = x2 - x1, dy = y2 - y1
  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return Math.abs(px - x1) < HIT && Math.abs(py - y1) < HIT
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  const cx = x1 + t * dx, cy = y1 + t * dy
  return Math.abs(px - cx) < HIT && Math.abs(py - cy) < HIT
}

export function DrawingLayer({ containerRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dispatch = useAppDispatch()
  const drawings = useAppSelector(s => s.drawing.drawings)
  const activeTool = useAppSelector(s => s.drawing.activeTool)
  const activeDrawingId = useAppSelector(s => s.drawing.activeDrawingId)
  const drawingRef = useRef<{ start: DrawingPoint | null; current: DrawingPoint | null }>({ start: null, current: null })

  // Map chart data coordinates ↔ canvas pixels
  const coordRef = useRef({
    pl: 40, pt: 10, cw: 600, mainH: 400, minP: 23800, maxP: 24600,
    timeStart: 0, timeEnd: 0,
  })

  const toCanvas = useCallback((p: DrawingPoint) => {
    const c = coordRef.current
    const x = c.pl + ((p.time - c.timeStart) / (c.timeEnd - c.timeStart || 1)) * c.cw
    const y = c.pt + (1 - (p.price - c.minP) / (c.maxP - c.minP || 1)) * c.mainH
    return { x, y }
  }, [])

  const toData = useCallback((px: number, py: number): DrawingPoint => {
    const c = coordRef.current
    const time = c.timeStart + ((px - c.pl) / c.cw) * (c.timeEnd - c.timeStart)
    const price = c.minP + (1 - (py - c.pt) / c.mainH) * (c.maxP - c.minP)
    return { time, price }
  }, [])

  // Render
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef?.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const r = container.getBoundingClientRect()
    canvas.width = r.width * dpr; canvas.height = r.height * dpr
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, r.width, r.height)

    const c = coordRef.current
    c.pl = 40; c.pt = 10
    c.cw = Math.max(100, r.width - 40 - 54)
    c.mainH = Math.max(100, r.height - 36)
    c.timeStart = Date.now() / 1000 - 300
    c.timeEnd = Date.now() / 1000
    const centre = 24200
    c.minP = centre - 200; c.maxP = centre + 200

    const s = toCanvas

    for (const d of drawings) {
      const isActive = d.id === activeDrawingId
      const clr = isActive ? '#fbbf24' : d.color
      const w = isActive ? d.width + 1 : d.width

      drawDrawing(ctx, d, s, clr, w, r.width, r.height)
    }

    // Preview line
    if (drawingRef.current.start && drawingRef.current.current) {
      const a = s(drawingRef.current.start)
      const b = s(drawingRef.current.current)
      if (activeTool === 'vertical-line') {
        drawStroke(ctx, '#6366f1', 1, () => { ctx.moveTo(a.x, 0); ctx.lineTo(a.x, r.height) })
      } else if (activeTool === 'horizontal-line') {
        drawStroke(ctx, '#6366f1', 1, () => { ctx.moveTo(0, a.y); ctx.lineTo(r.width, a.y) })
      } else if (activeTool === 'rectangle') {
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1; ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      } else {
        drawStroke(ctx, '#6366f1', 1, () => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y) })
      }
    }
  }, [drawings, activeDrawingId, activeTool, toCanvas, containerRef])

  // Mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    if (!activeTool || activeTool === 'move' || activeTool === 'delete') return

    const onMouseDown = (e: MouseEvent) => {
      const pos = canvasCoords(e, container)
      drawingRef.current = { start: toData(pos.x, pos.y), current: toData(pos.x, pos.y) }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!drawingRef.current.start) return
      const pos = canvasCoords(e, container)
      const pt = toData(pos.x, pos.y)
      if (activeTool === 'vertical-line') pt.price = drawingRef.current.start.price
      if (activeTool === 'horizontal-line') pt.time = drawingRef.current.start.time
      drawingRef.current.current = pt
    }

    const onMouseUp = () => {
      const s = drawingRef.current.start
      const e2 = drawingRef.current.current
      if (!s || !e2) { drawingRef.current = { start: null, current: null }; return }
      const same = Math.abs(s.time - e2.time) < 0.01 && Math.abs(s.price - e2.price) < 0.01
      if (!same) {
        dispatch(addDrawing({
          type: (activeTool as DrawingToolType),
          start: s,
          end: e2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          width: 2,
        }))
      }
      drawingRef.current = { start: null, current: null }
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { canvas.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [activeTool, dispatch, containerRef, toData])

  // Selection / deletion
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || (activeTool !== 'move' && activeTool !== 'delete')) return

    const onClick = (e: MouseEvent) => {
      const pos = canvasCoords(e, canvas)
      const s = toCanvas
      const hit = drawings.find(d => {
        const p1 = s(d.start), p2 = s(d.end)
        if (d.type === 'vertical-line') return Math.abs(pos.x - p1.x) < HIT
        if (d.type === 'horizontal-line') return Math.abs(pos.y - p1.y) < HIT
        if (d.type === 'rectangle') {
          const left = Math.min(p1.x, p2.x), right = Math.max(p1.x, p2.x)
          const top = Math.min(p1.y, p2.y), bottom = Math.max(p1.y, p2.y)
          return pos.x >= left - HIT && pos.x <= right + HIT && pos.y >= top - HIT && pos.y <= bottom + HIT
        }
        return hitTestSegment(pos.x, pos.y, p1.x, p1.y, p2.x, p2.y)
      })
      if (activeTool === 'delete' && hit) { dispatch(deleteDrawing(hit.id)); return }
      if (hit) dispatch(setActiveDrawing(hit.id))
      else dispatch(setActiveDrawing(null))
    }

    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [activeTool, drawings, dispatch, toCanvas])

  const isDrawingActive = activeTool && activeTool !== 'move' && activeTool !== 'delete'
  return <canvas ref={canvasRef} className="absolute inset-0 z-10" style={{ left: '36px', pointerEvents: isDrawingActive ? 'auto' : 'none' }} />
}

function drawDrawing(
  ctx: CanvasRenderingContext2D,
  d: Drawing,
  s: (p: DrawingPoint) => { x: number; y: number },
  color: string,
  w: number,
  cw: number,
  ch: number,
) {
  const p1 = s(d.start), p2 = s(d.end)

  switch (d.type) {
    case 'vertical-line': {
      const x = p1.x
      drawStroke(ctx, color, w, () => { ctx.moveTo(x, 0); ctx.lineTo(x, ch) })
      break
    }
    case 'horizontal-line': {
      const y = p1.y
      drawStroke(ctx, color, w, () => { ctx.moveTo(0, y); ctx.lineTo(cw, y) })
      break
    }
    case 'rectangle': {
      const left = Math.min(p1.x, p2.x), right = Math.max(p1.x, p2.x)
      const top = Math.min(p1.y, p2.y), bottom = Math.max(p1.y, p2.y)
      ctx.strokeStyle = color; ctx.lineWidth = w
      ctx.strokeRect(left, top, right - left, bottom - top)
      ctx.fillStyle = color + '15'; ctx.fillRect(left, top, right - left, bottom - top)
      break
    }
    default:
      drawLineSegment(ctx, p1.x, p1.y, p2.x, p2.y, color, w)
  }
}
