import type { DetectedPattern, PatternAlert } from '../../services/patternEngine'

const PATTERN_ICONS: Record<string, string> = {
  flag: '⚑', pennant: '△', 'double-top': 'M', 'double-bottom': 'W',
  'vol-compression': '◊', 'liquidity-shock': '⚡', 'wyckoff-phase': '◉',
}

const PATTERN_COLORS: Record<string, string> = {
  flag: 'text-yellow-400', pennant: 'text-purple-400', 'double-top': 'text-red-400',
  'double-bottom': 'text-green-400', 'vol-compression': 'text-yellow-300',
  'liquidity-shock': 'text-pink-400', 'wyckoff-phase': 'text-blue-400',
}

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-600/20 text-blue-300 border-blue-700',
  warning: 'bg-yellow-600/20 text-yellow-300 border-yellow-700',
  critical: 'bg-red-600/20 text-red-300 border-red-700',
}

export function PatternPanel({
  patterns, alerts, onClose,
}: {
  patterns: DetectedPattern[]
  alerts: PatternAlert[]
  onClose: () => void
}) {
  return (
    <div className="absolute right-2 top-12 w-72 z-30 bg-surface-light border border-gray-600 rounded-lg shadow-xl text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="text-gray-300 font-semibold">Patterns ({patterns.length})</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
      </div>

      {alerts.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-700 space-y-1">
          <span className="text-[10px] text-gray-500 uppercase font-semibold">Alerts</span>
          {alerts.slice(-5).reverse().map((a, i) => (
            <div key={i} className={`px-2 py-1 rounded border text-[10px] ${SEVERITY_COLORS[a.severity]}`}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        {patterns.length === 0 && (
          <div className="text-gray-500 text-center py-4">No patterns detected yet</div>
        )}
        {patterns.map(p => (
          <div
            key={p.id}
            className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 cursor-default"
            title={p.description}
          >
            <span className={`text-sm ${PATTERN_COLORS[p.type]}`}>{PATTERN_ICONS[p.type] || '?'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-gray-200 font-medium text-[11px]">{p.type.replace('-', ' ').toUpperCase()}</div>
              <div className="text-gray-500 text-[10px] truncate">{p.description}</div>
            </div>
            <div className={`text-[10px] font-mono ${p.confidence >= 0.7 ? 'text-green-400' : p.confidence >= 0.4 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {(p.confidence * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
