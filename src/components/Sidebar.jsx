import { NavLink } from 'react-router-dom'
import { Activity, Bell, LayoutDashboard, Shield, Users } from 'lucide-react'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Sportifs', to: '/sportifs', icon: Users },
  { label: 'Alertes', to: '/alertes', icon: Bell },
  { label: 'Sécurité', to: '/dashboard', icon: Shield },
]

function Sidebar() {
  return (
    <aside className="hidden w-72 flex-col justify-between bg-slate-950 px-4 py-6 text-slate-200 md:flex">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">SportShield</p>
            <p className="text-xs text-slate-400">Sports Data. Secured.</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={label === 'Dashboard'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="mb-2 flex items-center gap-2 text-sky-300">
          <Activity className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-[0.18em]">Système</span>
        </div>
        <p className="text-sm text-slate-300">Etat général</p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Protection active</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 font-medium text-emerald-300">
            OK
          </span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
