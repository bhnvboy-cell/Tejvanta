import { useState } from 'react'
import type { PineScript } from '../../services/pineScriptEngine'
import { createDefaultScript } from '../../services/pineScriptEngine'
import { loadScripts, saveScripts } from '../../services/bhavcopy'

const STORAGE_KEY = 'tv_pine_scripts'

function loadPersistedScripts(fallback: PineScript[]): PineScript[] {
  return loadScripts(STORAGE_KEY, fallback)
}

function persistScripts(scripts: PineScript[]) {
  saveScripts(scripts)
}

interface Props {
  scripts: PineScript[]
  onChange: (scripts: PineScript[]) => void
}

export function PineScriptEditor({ scripts, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingCode, setEditingCode] = useState('')
  const [dirty, setDirty] = useState(false)

  const selected = scripts.find(s => s.id === selectedId)

  const handleChange = (newScripts: PineScript[]) => {
    onChange(newScripts)
    persistScripts(newScripts)
  }

  const selectScript = (id: string) => {
    if (dirty && selected) {
      const updated = scripts.map(s => s.id === selected.id ? { ...s, code: editingCode } : s)
      handleChange(updated)
    }
    const s = scripts.find(sc => sc.id === id)
    if (s) {
      setSelectedId(id)
      setEditingCode(s.code)
      setDirty(false)
    }
  }

  const addScript = () => {
    const idx = scripts.length + 1
    const newScript = createDefaultScript(`Script ${idx}`)
    handleChange([...scripts, newScript])
    setSelectedId(newScript.id)
    setEditingCode(newScript.code)
    setDirty(false)
  }

  const deleteScript = () => {
    if (!selectedId) return
    handleChange(scripts.filter(s => s.id !== selectedId))
    const remaining = scripts.filter(s => s.id !== selectedId)
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id)
      setEditingCode(remaining[0].code)
    } else {
      setSelectedId(null)
      setEditingCode('')
    }
    setDirty(false)
  }

  const toggleScript = (id: string) => {
    handleChange(scripts.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const applyCode = () => {
    if (!selectedId) return
    handleChange(scripts.map(s => s.id === selectedId ? { ...s, code: editingCode } : s))
    setDirty(false)
  }

  const handleCodeChange = (code: string) => {
    setEditingCode(code)
    setDirty(true)
  }

  return (
    <div className="h-full flex flex-col bg-surface border-l border-gray-700 text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-surface-light">
        <span className="font-semibold text-gray-200">Pine Script Editor</span>
        <button onClick={addScript}
          className="px-2 py-0.5 bg-tej-600 text-white rounded text-[10px] font-medium hover:bg-tej-500">
          + New
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {scripts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 px-4 text-center">
            No scripts. Click "+ New" to create one.
          </div>
        ) : (
          <>
            <div className="border-b border-gray-700">
              {scripts.map(s => (
                <div key={s.id}
                  className={`flex items-center px-3 py-1.5 cursor-pointer border-l-2 ${
                    selectedId === s.id
                      ? 'border-tej-500 bg-gray-800'
                      : 'border-transparent hover:bg-gray-800/50'
                  }`}
                  onClick={() => selectScript(s.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleScript(s.id) }}
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 ${
                      s.enabled ? 'bg-tej-600 border-tej-600' : 'border-gray-500'
                    }`}
                  >
                    {s.enabled && <span className="text-white text-[8px]">✓</span>}
                  </button>
                  <span className={`flex-1 truncate ${s.enabled ? 'text-gray-200' : 'text-gray-500'}`}>
                    {s.name}
                  </span>
                  {selectedId === s.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteScript() }}
                      className="text-gray-500 hover:text-red-400 ml-1 text-[10px]"
                      title="Delete script"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {selected && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-700 bg-surface-light">
                  <span className="text-gray-400 font-medium truncate flex-1">{selected.name}</span>
                  <button
                    onClick={applyCode}
                    disabled={!dirty}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      dirty
                        ? 'bg-tej-600 text-white hover:bg-tej-500'
                        : 'bg-gray-700 text-gray-500 cursor-default'
                    }`}
                  >
                    {dirty ? 'Apply' : 'Applied'}
                  </button>
                </div>
                <textarea
                  value={editingCode}
                  onChange={e => handleCodeChange(e.target.value)}
                  className="flex-1 w-full bg-gray-950 text-gray-200 font-mono text-[11px] p-3 border-0 outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
