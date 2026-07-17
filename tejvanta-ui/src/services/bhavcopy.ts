export interface BhavcopyEntry {
  symbol: string
  series: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const STORAGE_PREFIX = 'tv_bhavcopy_'
const SCRIPTS_KEY = 'tv_pine_scripts'

function dateToStr(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return dd + mm + yyyy
}

export function todayStr(): string {
  return dateToStr(new Date())
}

export function formatDateDisplay(ddmmyyyy: string): string {
  if (ddmmyyyy.length !== 8) return ddmmyyyy
  const d = ddmmyyyy.substring(0, 2)
  const m = ddmmyyyy.substring(2, 4)
  const y = ddmmyyyy.substring(4, 8)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const mi = parseInt(m, 10) - 1
  return `${d}-${months[mi]}-${y}`
}

export function availableBhavcopyDates(): string[] {
  const dates: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      dates.push(key.replace(STORAGE_PREFIX, ''))
    }
  }
  return dates.sort().reverse()
}

export function loadBhavcopy(dateStr: string): BhavcopyEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + dateStr)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveBhavcopy(dateStr: string, entries: BhavcopyEntry[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + dateStr, JSON.stringify(entries))
  } catch (e) {
    throw new Error('Storage full. Try removing old dates.')
  }
}

export function removeBhavcopy(dateStr: string) {
  localStorage.removeItem(STORAGE_PREFIX + dateStr)
}

export function getAllSymbols(): string[] {
  const symbols = new Set<string>()
  for (const date of availableBhavcopyDates()) {
    const data = loadBhavcopy(date)
    if (data) data.forEach(e => symbols.add(e.symbol))
  }
  return Array.from(symbols).sort()
}

export function getSymbolCandles(symbol: string): { time: number; open: number; high: number; low: number; close: number; volume: number }[] {
  const candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = []
  for (const date of availableBhavcopyDates()) {
    const data = loadBhavcopy(date)
    if (!data) continue
    const entry = data.find(e => e.symbol === symbol && e.series === 'EQ')
    if (!entry) continue
    const d = entry.date
    const ts = new Date(
      parseInt(d.substring(4, 8), 10),
      parseInt(d.substring(2, 4), 10) - 1,
      parseInt(d.substring(0, 2), 10)
    ).getTime() / 1000
    candles.push({
      time: ts,
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      volume: entry.volume,
    })
  }
  candles.sort((a, b) => a.time - b.time)
  return candles
}

export async function fetchBhavcopy(dateStr: string): Promise<BhavcopyEntry[]> {
  const url = `https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_${dateStr}.csv`
  let csvText: string | null = null

  try {
    const resp = await fetch(url, { headers: { 'Accept': 'text/csv' } })
    if (resp.ok) csvText = await resp.text()
  } catch { /* ignore */ }

  if (!csvText) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      const resp = await fetch(proxyUrl)
      if (resp.ok) csvText = await resp.text()
    } catch { /* ignore */ }
  }

  if (!csvText) {
    throw new Error('Could not fetch from NSE. Download the CSV manually and use "Upload CSV".')
  }

  return parseBhavcopyCSV(csvText, dateStr)
}

export function parseBhavcopyCSV(csvText: string, dateStr: string): BhavcopyEntry[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV is empty or invalid')

  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  const colSymbol = header.indexOf('SYMBOL')
  const colSeries = header.indexOf('SERIES')
  const colOpen = header.findIndex(h => h.includes('OPEN_PRICE') || h === 'OPEN')
  const colHigh = header.findIndex(h => h.includes('HIGH_PRICE') || h === 'HIGH')
  const colLow = header.findIndex(h => h.includes('LOW_PRICE') || h === 'LOW')
  const colClose = header.findIndex(h => h.includes('CLOSE_PRICE') || h === 'CLOSE')
  const colVolume = header.findIndex(h => h.includes('TTL_TRD_QNTY') || h.includes('TTL_TRAD_QTY') || h.includes('TOTTRDQTY') || h === 'VOLUME')

  const entries: BhavcopyEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
    if (cols.length < Math.max(colOpen, colHigh, colLow, colClose)) continue
    const symbol = cols[colSymbol]
    const series = colSeries >= 0 ? cols[colSeries] : 'EQ'
    if (series !== 'EQ' && series !== 'BE') continue
    const open = parseFloat(cols[colOpen])
    const high = parseFloat(cols[colHigh])
    const low = parseFloat(cols[colLow])
    const close = parseFloat(cols[colClose])
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue
    const volume = colVolume >= 0 ? (parseFloat(cols[colVolume]) || 0) : 0
    entries.push({ symbol, series, date: dateStr, open, high, low, close, volume })
  }

  if (entries.length === 0) throw new Error('No valid EQ/BE entries found in CSV')
  return entries
}

export function loadScripts<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function saveScripts<T>(scripts: T) {
  try {
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts))
  } catch (e) {
    console.warn('Failed to save scripts to localStorage:', e)
  }
}

export interface SymbolModel {
  basePrice: number
  volatility: number
  avgVolume: number
}

const MODEL_KEY = 'tv_symbol_models'

export function getSymbolModel(symbol: string): SymbolModel | null {
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    if (!raw) return null
    const models = JSON.parse(raw) as Record<string, SymbolModel>
    return models[symbol] ?? null
  } catch { return null }
}

export function setSymbolModel(symbol: string, model: SymbolModel) {
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    const models: Record<string, SymbolModel> = raw ? JSON.parse(raw) : {}
    models[symbol] = model
    localStorage.setItem(MODEL_KEY, JSON.stringify(models))
  } catch (e) {
    console.warn('Failed to save symbol model:', e)
  }
}

export function computeSymbolModel(symbol: string): SymbolModel | null {
  const candles = getSymbolCandles(symbol)
  if (candles.length < 2) return null
  const last = candles[candles.length - 1]
  const returns: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / candles[i - 1].close
    returns.push(r)
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / returns.length
  const vol = Math.sqrt(variance)
  const avgVol = Math.round(candles.reduce((s, c) => s + c.volume, 0) / candles.length)
  const model: SymbolModel = {
    basePrice: last.close,
    volatility: Math.max(vol, 0.001),
    avgVolume: Math.max(avgVol, 1000),
  }
  setSymbolModel(symbol, model)
  return model
}

export function clearSymbolModel(symbol: string) {
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    if (!raw) return
    const models: Record<string, SymbolModel> = JSON.parse(raw)
    delete models[symbol]
    localStorage.setItem(MODEL_KEY, JSON.stringify(models))
  } catch { /* ignore */ }
}

export function getAllSymbolModels(): string[] {
  try {
    const raw = localStorage.getItem(MODEL_KEY)
    if (!raw) return []
    return Object.keys(JSON.parse(raw))
  } catch { return [] }
}

// --- Yahoo Finance T-1 API ---

const YAHOO_MAP: Record<string, string> = {
  NIFTY: '^NSEI',
  BANKNIFTY: '^NSEBANK',
  SENSEX: '^BSESN',
}

function yahooSymbol(symbol: string): string {
  if (YAHOO_MAP[symbol]) return YAHOO_MAP[symbol]
  if (symbol.includes('.')) return symbol
  return symbol + '.NS'
}

interface YahooChartQuote {
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
}

interface YahooChartResult {
  timestamp: number[]
  indicators: { quote: YahooChartQuote[] }
}

async function fetchYahooJSON(url: string): Promise<any> {
  try {
    const resp = await fetch(url)
    if (resp.ok) return await resp.json()
  } catch { /* fall through to proxy */ }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const resp = await fetch(proxyUrl)
    if (resp.ok) return await resp.json()
  } catch { /* fall through */ }

  throw new Error('Could not reach Yahoo Finance. Try again later.')
}

export async function fetchYahooT1(symbol: string): Promise<BhavcopyEntry> {
  const ySymbol = yahooSymbol(symbol)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?range=5d&interval=1d`

  const json = await fetchYahooJSON(url)
  const result: YahooChartResult | undefined = json?.chart?.result?.[0]
  if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
    throw new Error(`No data returned from Yahoo for ${ySymbol}`)
  }

  const timestamps = result.timestamp
  const quote = result.indicators.quote[0]
  if (!quote.open || quote.open.length < 2) {
    throw new Error(`Insufficient data from Yahoo for ${ySymbol}`)
  }

  const t1Idx = timestamps.length - 2
  if (t1Idx < 0) throw new Error(`No T-1 data available for ${ySymbol}`)

  const t1Time = timestamps[t1Idx]
  const t1Date = new Date(t1Time * 1000)
  const dd = String(t1Date.getDate()).padStart(2, '0')
  const mm = String(t1Date.getMonth() + 1).padStart(2, '0')
  const yyyy = t1Date.getFullYear()
  const dateStr = dd + mm + yyyy

  return {
    symbol,
    series: 'EQ',
    date: dateStr,
    open: Math.round(quote.open[t1Idx] * 100) / 100,
    high: Math.round(quote.high[t1Idx] * 100) / 100,
    low: Math.round(quote.low[t1Idx] * 100) / 100,
    close: Math.round(quote.close[t1Idx] * 100) / 100,
    volume: Math.round(quote.volume[t1Idx]) || 0,
  }
}
