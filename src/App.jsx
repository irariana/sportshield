import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import FederationSetupPage from './pages/FederationSetupPage'
import FederationWorkspacePage from './pages/FederationWorkspacePage'
import LoginPage from './pages/LoginPage'
import InvitePage from './pages/InvitePage'
import AthletesPage from './pages/AthletesPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/federation/setup" element={<FederationSetupPage />} />
        <Route path="/federation/athletes/:athleteId" element={<AthletesPage />} />
        <Route path="/federation/athletes" element={<AthletesPage />} />
        <Route path="/federation" element={<FederationWorkspacePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
