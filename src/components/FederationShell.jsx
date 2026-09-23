import { Building2, Database, LogOut, Shield, Users, Watch } from 'lucide-react'

const federationSections = [
  { label: 'Vue d’ensemble', icon: Building2, path: '/federation' },
  { label: 'Sportifs', icon: Users, path: '/federation/athletes' },
  { label: 'Utilisateurs', icon: Shield, path: '/federation?section=Utilisateurs' },
  { label: 'Capteurs', icon: Watch, path: '/federation?section=Capteurs' },
  { label: 'Données', icon: Database, path: '/federation?section=Données' },
]

function FederationShell({ account, federation, activeSection, onSectionChange, onLogout, children }) {
  const firstName = account?.full_name?.split(' ')[0] || 'Utilisateur'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            {federation?.logo_url ? <img src={federation.logo_url} alt="" className="h-10 w-10 rounded-xl bg-white object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Building2 className="h-5 w-5" /></div>}
            <div className="min-w-0"><p className="truncate text-lg font-semibold text-white">{federation?.name || 'SportShield'}</p><p className="text-xs text-slate-400">Espace fédération</p></div>
          </div>
          <nav className="space-y-1">
            {federationSections.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => onSectionChange(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activeSection === label ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}
          </nav>
          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">{activeSection}</h1></div>
            <div className="flex items-center justify-end gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-900">{account?.full_name || 'Utilisateur'}</p><p className="text-xs text-slate-500">{account?.role === 'admin' ? 'Administrateur' : account?.role || 'Membre'}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">{firstName.slice(0, 1)}</div><button type="button" onClick={onLogout} aria-label="Déconnexion" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900"><LogOut className="h-4 w-4" /></button></div>
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 md:hidden">{federationSections.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => onSectionChange(label)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${activeSection === label ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default FederationShell