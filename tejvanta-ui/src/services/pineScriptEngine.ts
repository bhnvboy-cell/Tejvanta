export interface PinePlot {
  name: string
  data: { time: number; value: number }[]
  color: string
  linewidth: number
}

export interface PineScript {
  id: string
  name: string
  code: string
  enabled: boolean
}

type VarTable = Record<string, number[]>
type InputDef = { name: string; defval: number; title: string }

function tokenize(line: string): string[] {
  return line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
}

function seriesAt(v: number[], i: number): number {
  return i < v.length ? v[i] : v[v.length - 1]
}

function resolveSeries(expr: string, vars: VarTable, inputs: InputDef[], candles: any[], i: number): number[] {
  const trimmed = expr.trim()

  if (trimmed.endsWith(')')) {
    const paren = trimmed.indexOf('(')
    if (paren > 0) {
      const funcName = trimmed.substring(0, paren).trim()
      const argsStr = trimmed.substring(paren + 1, trimmed.lastIndexOf(')'))
      const args = splitArgs(argsStr)
      const resolved = args.map(a => resolveSeries(a, vars, inputs, candles, i))
      return callFunction(funcName, resolved, candles, i, inputs)
    }
  }

  if (trimmed === 'close') return candles.map(c => c.close)
  if (trimmed === 'high') return candles.map(c => c.high)
  if (trimmed === 'low') return candles.map(c => c.low)
  if (trimmed === 'open') return candles.map(c => c.open)
  if (trimmed === 'volume') return candles.map(c => c.volume || 0)

  if (vars[trimmed]) return vars[trimmed]

  const num = parseFloat(trimmed)
  if (!isNaN(num)) return candles.map(() => num)

  const inputDef = inputs.find(inp => inp.name === trimmed)
  if (inputDef) return candles.map(() => inputDef.defval)

  return candles.map(() => 0)
}

function splitArgs(s: string): string[] {
  const args: string[] = []
  let depth = 0, current = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; continue }
    current += ch
  }
  if (current.trim()) args.push(current.trim())
  return args
}

function callFunction(name: string, args: number[][], candles: any[], i: number, inputs: InputDef[]): number[] {
  switch (name) {
    case 'sma': {
      if (args.length < 2) return candles.map(() => 0)
      const src = args[0]
      const len = Math.max(1, Math.round(args[1][0] ?? 14))
      const result: number[] = []
      for (let j = 0; j < src.length; j++) {
        if (j < len - 1) { result.push(NaN); continue }
        let sum = 0
        for (let k = 0; k < len; k++) sum += src[j - k]
        result.push(sum / len)
      }
      return result
    }
    case 'ema': {
      if (args.length < 2) return candles.map(() => 0)
      const src = args[0]
      const len = Math.max(1, Math.round(args[1][0] ?? 14))
      const k = 2 / (len + 1)
      const result: number[] = []
      let ema = src[0]
      for (let j = 0; j < src.length; j++) {
        ema = src[j] * k + ema * (1 - k)
        if (j >= len - 1) result.push(ema); else result.push(NaN)
      }
      return result
    }
    case 'rsi': {
      if (args.length < 2) return candles.map(() => 0)
      const src = args[0]
      const len = Math.max(1, Math.round(args[1][0] ?? 14))
      const result: number[] = []
      let gains = 0, losses = 0
      for (let j = 1; j <= len && j < src.length; j++) {
        const diff = src[j] - src[j - 1]
        if (diff >= 0) gains += diff; else losses -= diff
      }
      for (let j = len; j < src.length; j++) {
        const diff = src[j] - src[j - 1]
        if (diff >= 0) { gains = (gains * (len - 1) + diff) / len; losses = (losses * (len - 1)) / len }
        else { losses = (losses * (len - 1) - diff) / len; gains = (gains * (len - 1)) / len }
        result.push(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses))
      }
      return result
    }
    case 'input': {
      const name = `_input_${candles.length}_${i}`
      const defval = args.length > 0 ? args[0][0] : 14
      const title = args.length > 1 ? `Input ${i}` : `Input ${i}`
      const existing = inputs.find(inp => inp.name === name)
      if (!existing) inputs.push({ name, defval, title })
      return candles.map(() => (existing ?? inputs[inputs.length - 1]).defval)
    }
    default:
      return candles.map(() => 0)
  }
}

export function executePineScript(script: string, candles: any[]): PinePlot[] {
  const plots: PinePlot[] = []
  const vars: VarTable = {}
  const inputs: InputDef[] = []
  const lines = script.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'))

  let overlay = true
  let scriptName = 'Script'

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('indicator(')) {
      const argsStr = line.substring('indicator('.length, line.lastIndexOf(')'))
      const args = splitArgs(argsStr)
      if (args.length > 0) scriptName = args[0].replace(/['"]/g, '').trim()
      if (args.length > 1) overlay = args[1].trim() === 'true'
      continue
    }

    if (line.startsWith('plot(')) {
      const argsStr = line.substring('plot('.length, line.lastIndexOf(')'))
      const args = splitArgs(argsStr)
      if (args.length < 1) continue
      const seriesName = args.length > 1 ? args[1].replace(/['"]/g, '').trim() : 'Plot'
      const color = args.length > 2 ? args[2].replace(/['"]/g, '').trim() : '#22c55e'
      const linewidth = args.length > 3 ? parseInt(args[3]) || 1 : 1

      const series = resolveSeries(args[0], vars, inputs, candles, plots.length)

      const data: { time: number; value: number }[] = []
      for (let j = 0; j < candles.length; j++) {
        const v = seriesAt(series, j)
        if (!isNaN(v) && v !== null) data.push({ time: candles[j].time, value: Math.round(v * 100) / 100 })
      }

      plots.push({ name: seriesName, data, color, linewidth })
      continue
    }

    if (line.includes('=') && !line.startsWith('=')) {
      const eqIdx = line.indexOf('=')
      const varName = line.substring(0, eqIdx).trim()
      const expr = line.substring(eqIdx + 1).trim()
      if (varName && expr && !['>', '<', '!'].includes(varName)) {
        vars[varName] = resolveSeries(expr, vars, inputs, candles, plots.length)
      }
      continue
    }
  }

  return plots
}

function generateId(): string {
  return '_ps_' + Math.random().toString(36).substring(2, 9)
}

export function createDefaultScript(name: string): PineScript {
  return {
    id: generateId(),
    name,
    code: `//@version=5
indicator("${name}", overlay=true)

len = input(14)
src = close

smaValue = sma(src, len)
plot(smaValue, "SMA", #f59e0b, 2)`,
    enabled: true,
  }
}

export const defaultScripts: PineScript[] = [
  createDefaultScript('SMA 20'),
  {
    id: generateId(),
    name: 'RSI',
    code: `//@version=5
indicator("RSI", overlay=false)

len = input(14)
src = close

rsiValue = rsi(src, len)
plot(rsiValue, "RSI", #ec4899, 2)`,
    enabled: false,
  },
]
