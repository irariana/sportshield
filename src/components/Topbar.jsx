import { Bell, LogOut, Shield } from 'lucide-react'

function Topbar({ user, onLogout }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Accès sécurisé</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Tableau de bord</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <Shield className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </header>
  )
}

export default Topbar
