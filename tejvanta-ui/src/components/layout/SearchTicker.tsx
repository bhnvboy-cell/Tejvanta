import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { selectSymbol } from '../../state/marketSlice'
import { signalRService } from '../../services/signalRService'

export function SearchTicker({ placeholder }: { placeholder?: string }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const instruments = useAppSelector(s => s.market.instruments)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? instruments.filter(x =>
        x.symbol.toLowerCase().includes(query.toLowerCase()) ||
        x.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : []

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (symbol: string) => {
    dispatch(selectSymbol(symbol))
    signalRService.subscribeSymbol(symbol)
    navigate('/charts')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { if (query.length > 0) setOpen(true) }}
        placeholder={placeholder || 'Search ticker...'}
        className="w-48 px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-tej-500"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {filtered.map(inst => (
            <button
              key={inst.id}
              onClick={() => handleSelect(inst.symbol)}
              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex justify-between"
            >
              <span className="font-medium">{inst.symbol}</span>
              <span className="text-xs text-gray-500">{inst.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
