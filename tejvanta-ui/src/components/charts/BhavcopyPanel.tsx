import { useState, useEffect, useRef } from 'react'
import {
  type BhavcopyEntry, fetchBhavcopy, parseBhavcopyCSV, saveBhavcopy, loadBhavcopy,
  availableBhavcopyDates, removeBhavcopy, getAllSymbols, getSymbolCandles, todayStr, formatDateDisplay,
  computeSymbolModel, fetchYahooT1,
} from '../../services/bhavcopy'

interface Props {
  onLoadSymbol: (symbol: string, candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[]) => void
}

export function BhavcopyPanel({ onLoadSymbol }: Props) {
  const [dates, setDates] = useState<string[]>(() => availableBhavcopyDates())
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [symbols, setSymbols] = useState<string[]>(() => getAllSymbols())
  const [symbolFilter, setSymbolFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [loadedSymbol, setLoadedSymbol] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [yahooSymbol, setYahooSymbol] = useState('')
  const [yahooLoading, setYahooLoading] = useState(false)
  const [yahooStatus, setYahooStatus] = useState('')

  const refreshDates = () => {
    setDates(availableBhavcopyDates())
    setSymbols(getAllSymbols())
  }

  const handleDownload = async () => {
    setLoading(true)
    setUploadStatus('')
    try {
      const entries = await fetchBhavcopy(selectedDate)
      saveBhavcopy(selectedDate, entries)
      setUploadStatus(`Downloaded ${entries.length} entries for ${formatDateDisplay(selectedDate)}`)
      refreshDates()
    } catch (e: any) {
      setUploadStatus(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        const entries = parseBhavcopyCSV(text, selectedDate)
        saveBhavcopy(selectedDate, entries)
        setUploadStatus(`Loaded ${entries.length} entries from ${file.name}`)
        refreshDates()
      } catch (err: any) {
        setUploadStatus(`Error: ${err.message}`)
      }
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = (date: string) => {
    removeBhavcopy(date)
    refreshDates()
  }

  const filteredSymbols = symbolFilter
    ? symbols.filter(s => s.toLowerCase().includes(symbolFilter.toLowerCase()))
    : symbols

  const handleLoadSymbol = (symbol: string) => {
    const candles = getSymbolCandles(symbol)
    if (candles.length === 0) return
    computeSymbolModel(symbol)
    setLoadedSymbol(symbol)
    onLoadSymbol(symbol, candles)
  }

  return (
    <div className="h-full flex flex-col bg-surface border-l border-gray-700 text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-surface-light">
        <span className="font-semibold text-gray-200">Bhavcopy</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-gray-700 space-y-2">
          <label className="text-gray-400 text-[10px] uppercase tracking-wider">Date</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="DDMMYYYY"
              className="flex-1 bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs font-mono outline-none focus:border-tej-500"
              maxLength={8}
            />
            <button
              onClick={handleDownload}
              disabled={loading || selectedDate.length !== 8}
              className="px-2 py-1 bg-tej-600 text-white rounded text-[10px] font-medium hover:bg-tej-500 disabled:opacity-40 whitespace-nowrap"
            >
              {loading ? 'Downloading...' : 'Download'}
            </button>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-2 py-1 bg-gray-700 text-gray-300 rounded text-[10px] font-medium hover:bg-gray-600"
          >
            Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          {uploadStatus && (
            <div className={`text-[10px] ${uploadStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        <div className="p-3 border-b border-gray-700 space-y-2">
          <label className="text-gray-400 text-[10px] uppercase tracking-wider">Yahoo T-1</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={yahooSymbol}
              onChange={e => setYahooSymbol(e.target.value.toUpperCase())}
              placeholder="Symbol (e.g. AAPL, RELIANCE)"
              className="flex-1 bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs font-mono outline-none focus:border-tej-500"
            />
            <button
              onClick={async () => {
                const sym = yahooSymbol.trim()
                if (!sym) return
                setYahooLoading(true)
                setYahooStatus('')
                try {
                  const entry = await fetchYahooT1(sym)
                  saveBhavcopy(entry.date, [entry])
                  setYahooStatus(`T-1 loaded: ${sym} ${entry.open}-${entry.high}-${entry.low}-${entry.close} Vol:${entry.volume}`)
                  refreshDates()
                  const candles = getSymbolCandles(sym)
                  if (candles.length > 0) {
                    computeSymbolModel(sym)
                    setLoadedSymbol(sym)
                    onLoadSymbol(sym, candles)
                  }
                } catch (e: any) {
                  setYahooStatus(`Error: ${e.message}`)
                } finally {
                  setYahooLoading(false)
                }
              }}
              disabled={yahooLoading || !yahooSymbol.trim()}
              className="px-2 py-1 bg-orange-600 text-white rounded text-[10px] font-medium hover:bg-orange-500 disabled:opacity-40 whitespace-nowrap"
            >
              {yahooLoading ? 'Fetching...' : 'Fetch T-1'}
            </button>
          </div>
          {yahooStatus && (
            <div className={`text-[10px] ${yahooStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {yahooStatus}
            </div>
          )}
        </div>

        {dates.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">Stored Dates</div>
            <div className="max-h-20 overflow-y-auto space-y-0.5">
              {dates.map(d => (
                <div key={d} className="flex items-center justify-between">
                  <span className="text-gray-300">{formatDateDisplay(d)}</span>
                  <button onClick={() => handleDelete(d)} className="text-gray-500 hover:text-red-400 text-[10px]">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {symbols.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-gray-700">
              <input
                type="text"
                value={symbolFilter}
                onChange={e => setSymbolFilter(e.target.value.toUpperCase())}
                placeholder="Search symbol..."
                className="w-full bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-600 text-xs outline-none focus:border-tej-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSymbols.map(sym => (
                <div
                  key={sym}
                  className={`flex items-center px-3 py-1.5 cursor-pointer border-l-2 ${
                    loadedSymbol === sym
                      ? 'border-tej-500 bg-gray-800'
                      : 'border-transparent hover:bg-gray-800/50'
                  }`}
                  onClick={() => handleLoadSymbol(sym)}
                >
                  <span className="flex-1 text-gray-200">{sym}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadSymbol(sym) }}
                    className="px-2 py-0.5 bg-tej-600 text-white rounded text-[10px] font-medium hover:bg-tej-500"
                  >
                    Load
                  </button>
                </div>
              ))}
              {filteredSymbols.length === 0 && (
                <div className="text-gray-500 text-center py-4">No matching symbols</div>
              )}
            </div>
          </div>
        )}

        {symbols.length === 0 && !uploadStatus && (
          <div className="flex-1 flex items-center justify-center text-gray-500 px-4 text-center">
            Download a bhavcopy or upload a CSV to see symbols
          </div>
        )}
      </div>
    </div>
  )
}
