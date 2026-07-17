import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch'
import { SearchTicker } from './SearchTicker'
import { ConnectionIndicator } from '../common/ConnectionIndicator'
import { signalRService } from '../../services/signalRService'
import { setDataConnectionStatus } from '../../state/connectionSlice'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/charts', label: 'Charts', icon: '📈' },
  { path: '/learn', label: 'Learn', icon: '📘' },
  { path: '/options', label: 'Options', icon: '📋' },
  { path: '/replay', label: 'Replay', icon: '⏪' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Header() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const balance = useAppSelector(s => s.trading.virtualBalance)

  useEffect(() => {
    signalRService.fetchDataStatus().then(status => {
      if (status) dispatch(setDataConnectionStatus(status))
    })
    const unsub = signalRService.onDataConnectionStatus(status => {
      dispatch(setDataConnectionStatus(status))
    })
    return unsub
  }, [dispatch])

  return (
    <header className="h-12 bg-surface-light border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-tej-400">Tejvanta</h1>
        <nav className="flex gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded text-sm transition ${
                location.pathname === item.path
                  ? 'bg-tej-600/20 text-tej-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <ConnectionIndicator />
        <SearchTicker />
        <span className="text-gray-400">₹{balance.toLocaleString()}</span>
      </div>
    </header>
  )
}
