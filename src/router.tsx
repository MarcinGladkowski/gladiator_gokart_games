import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { TotalResultsPage } from './pages/TotalResultsPage'
import { SeasonPage } from './pages/SeasonPage'
import { RaceDatePage } from './pages/RaceDatePage'
import { GroupSessionPage } from './pages/GroupSessionPage'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/total" replace />} />
          <Route path="total" element={<TotalResultsPage />} />
          <Route path="season/:year" element={<SeasonPage />} />
          <Route path="season/:year/:date" element={<RaceDatePage />} />
          <Route path="season/:year/:date/:group/:type" element={<GroupSessionPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
