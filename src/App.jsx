import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
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
        <Route path="/athlete" element={<AthleteRoute />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

function AthleteRoute() {
  const navigate = useNavigate()
  const [state, setState] = useState({ isLoading: true, account: null, federation: null })

  useEffect(() => {
    let isMounted = true

    async function loadAthleteAccess() {
      const userResult = await getAuthenticatedUser()
      if (userResult.error || !userResult.data?.user) {
        navigate('/login', { replace: true })
        return
      }

      const profileResult = await getCurrentProfile()
      if (profileResult.error || profileResult.data?.role !== 'sportif') {
        navigate('/federation', { replace: true })
        return
      }

      const federationResult = await getFederationForCurrentUser()
      if (isMounted) {
        setState({
          isLoading: false,
          account: profileResult.data,
          federation: federationResult.data,
        })
      }
    }

    loadAthleteAccess()
    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (state.isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Vérification de votre accès...</div>

  return <AthleteDashboardPage account={state.account} federation={state.federation} onLogout={handleLogout} />
}

export default App
