import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const roleProfiles = {
  admin: { name: 'Nadia Martin', role: 'Administrateur fédération' },
  entraineur: { name: 'Julien Morel', role: 'Entraîneur' },
  medecin: { name: 'Claire Dupont', role: 'Médecin' },
  sportif: { name: 'Sofia Leroy', role: 'Sportif' },
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedRole = location.state?.role ?? 'admin'
  const user = roleProfiles[selectedRole] ?? roleProfiles.admin

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar user={user} onLogout={() => navigate('/login')} />

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
