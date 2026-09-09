import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import FederationSetupPage from './pages/FederationSetupPage'
import FederationWorkspacePage from './pages/FederationWorkspacePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/federation/setup" element={<FederationSetupPage />} />
        <Route path="/federation" element={<FederationWorkspacePage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
