import { useState, useRef, useEffect } from 'react'
import type { Instrument } from '../../types/Instrument'

interface InstrumentSearchProps {
  onSelect: (instrument: Instrument) => void
}

export function InstrumentSearch({ onSelect }: InstrumentSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Instrument[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 1) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setResults(data)
        setShowDropdown(true)
      } catch { }
    }, 200)
  }

  const handleSelect = (inst: Instrument) => {
    setQuery('')
    setShowDropdown(false)
    onSelect(inst)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search symbols..."
        className="w-full px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-tej-500 text-white placeholder-gray-500"
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light border border-gray-600 rounded max-h-60 overflow-y-auto z-50">
          {results.map(inst => (
            <div
              key={inst.id}
              onClick={() => handleSelect(inst)}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
            >
              <div className="text-sm font-medium text-white">{inst.symbol}</div>
              <div className="text-xs text-gray-400">{inst.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
