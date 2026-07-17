import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch'
import { fetchSettings, updateSettings, setTheme, setDefaultLayout, setDefaultTimeframe, setIndiaVix } from '../../state/settingsSlice'

export function SettingsPanel() {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(s => s.settings)

  useEffect(() => { dispatch(fetchSettings()) }, [dispatch])

  const commit = (data: Record<string, unknown>) => {
    dispatch(updateSettings(data))
  }

  const handleThemeChange = (theme: 'light' | 'dark') => {
    dispatch(setTheme(theme))
    commit({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }

  const handleLayoutChange = (layout: number) => {
    dispatch(setDefaultLayout(layout))
    commit({ defaultLayout: layout })
  }

  const handleTimeframeChange = (tf: string) => {
    dispatch(setDefaultTimeframe(tf))
    commit({ defaultTimeframe: tf })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Settings</h2>

      {/* Theme */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Theme</h3>
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map(t => (
            <button key={t} onClick={() => handleThemeChange(t)}
              className={`px-4 py-2 rounded text-sm capitalize ${
                settings.theme === t ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {t} Mode
            </button>
          ))}
        </div>
      </div>

      {/* Default Layout */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Default Layout</h3>
        <div className="flex gap-3">
          {[1, 2, 4].map(n => (
            <button key={n} onClick={() => handleLayoutChange(n)}
              className={`px-4 py-2 rounded text-sm ${
                settings.defaultLayout === n ? 'bg-tej-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}>
              {n}x{n} Charts
            </button>
          ))}
        </div>
      </div>

      {/* Default Timeframe */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Default Timeframe</h3>
        <select value={settings.defaultTimeframe}
          onChange={e => handleTimeframeChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white">
          {['5s', '1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'].map(tf => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>
      </div>

      {/* Timezone */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Timezone</h3>
        <select value={settings.timezone}
          onChange={e => commit({ timezone: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white">
          <option value="Asia/Kolkata">IST (UTC+5:30)</option>
          <option value="UTC">UTC</option>
          <option value="America/New_York">US Eastern</option>
          <option value="America/Chicago">US Central</option>
          <option value="Europe/London">London</option>
          <option value="Asia/Dubai">Dubai</option>
          <option value="Asia/Singapore">Singapore</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>

      {/* India VIX */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">India VIX</h3>
        <div className="flex items-center gap-4">
          <input type="range" min="8" max="40" step="0.5" value={settings.indiaVix}
            onChange={e => { const v = +e.target.value; dispatch(setIndiaVix(v)); commit({ indiaVix: v }) }}
            className="flex-1 accent-tej-500" />
          <span className="text-lg font-bold text-tej-400 font-mono w-12 text-right">{settings.indiaVix?.toFixed(1) ?? '14.0'}</span>
        </div>
        <p className="text-xs text-gray-500">
          Controls simulated market volatility. Higher VIX = larger price swings. Current range: 8 (low) - 40 (extreme).
        </p>
      </div>

      {/* Data Source Info */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-300">Data Source</h3>
        <p className="text-sm text-green-400">Simulation mode (NSE bhavcopy + mock intraday ticks)</p>
        <p className="text-xs text-gray-500">
          Historical EOD data from NSE bhavcopy (when available). Intraday ticks are simulated for development.
        </p>
      </div>

      {/* Virtual Balance */}
      <div className="bg-surface-light rounded-lg border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Virtual Balance</h3>
        <div className="text-2xl font-bold text-tej-400 font-mono">
          ₹{settings.virtualBalance?.toLocaleString() ?? '1,000,000'}
        </div>
      </div>
    </div>
  )
}
