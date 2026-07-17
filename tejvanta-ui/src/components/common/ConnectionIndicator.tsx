import { useAppSelector } from '../../hooks/useAppDispatch'

const stateConfig = {
  connected: { dot: 'bg-green-500', label: 'Connected', pulse: false },
  connecting: { dot: 'bg-yellow-500', label: 'Connecting...', pulse: true },
  error: { dot: 'bg-red-500', label: 'Error', pulse: false },
  disconnected: { dot: 'bg-gray-500', label: 'Disconnected', pulse: false },
} as const

export function ConnectionIndicator() {
  const dataSource = useAppSelector(s => s.connection.dataSource)
  const cfg = stateConfig[dataSource.state] ?? stateConfig.disconnected

  return (
    <div className="flex items-center gap-1.5 text-xs" title={dataSource.message}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-gray-400">SIM</span>
    </div>
  )
}
