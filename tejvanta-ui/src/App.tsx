import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { ChartsPage } from './pages/ChartsPage'
import { OptionsPage } from './pages/OptionsPage'
import { ReplayPage } from './pages/ReplayPage'
import { SettingsPage } from './pages/SettingsPage'
import { LearningPage } from './pages/LearningPage'
import { useWebSocket } from './hooks/useWebSocket'
import { useMockData } from './hooks/useMockData'
import { useAppDispatch, useAppSelector } from './hooks/useAppDispatch'
import { fetchInstruments } from './state/marketSlice'
import { fetchPositions, fetchOrders } from './state/tradingSlice'
import { fetchSettings } from './state/settingsSlice'

export function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(s => s.settings.theme)
  useWebSocket()
  useMockData()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    dispatch(fetchInstruments())
    dispatch(fetchPositions())
    dispatch(fetchOrders(true))
    dispatch(fetchSettings())
  }, [dispatch])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/replay" element={<ReplayPage />} />
          <Route path="/learn" element={<LearningPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
