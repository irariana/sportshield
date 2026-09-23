import { Activity, CalendarDays, LogOut, Menu, Shield, Target, X } from 'lucide-react'
import { useState } from 'react'

function AthleteDashboardPage({ account, federation, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const firstName = account?.full_name?.split(' ')[0] || 'Sportif'

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-[#102b35] px-5 py-6 text-slate-200 transition-transform md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#102b35]"><Shield className="h-5 w-5" /></div><div><p className="text-lg font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Performance hub</p></div></div><button type="button" onClick={() => setIsMenuOpen(false)} className="text-slate-400 md:hidden" aria-label="Fermer le menu"><X className="h-5 w-5" /></button></div>
        <nav className="mt-12 space-y-2"><p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Mon espace</p><button type="button" className="mt-3 flex w-full items-center gap-3 rounded-xl bg-cyan-400 px-3 py-3 text-left text-sm font-semibold text-[#102b35]"><Activity className="h-4 w-4" />Vue d’ensemble</button><button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><CalendarDays className="h-4 w-4" />Mes séances</button><button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><Target className="h-4 w-4" />Mes objectifs</button></nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Profil suivi</p><p className="mt-2 truncate text-sm font-medium text-white">{federation?.name || 'Ma fédération'}</p><p className="mt-1 text-xs leading-5 text-slate-400">Vos données restent privées et accessibles à votre équipe autorisée.</p></div>
      </aside>
      {isMenuOpen && <button type="button" onClick={() => setIsMenuOpen(false)} className="fixed inset-0 z-10 bg-slate-950/40 md:hidden" aria-label="Fermer le menu" />}
      <main className="min-w-0 md:pl-72"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><button type="button" onClick={() => setIsMenuOpen(true)} className="rounded-lg p-2 text-slate-500 md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button><div className="hidden sm:block"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Tableau de bord athlète</p><p className="mt-1 text-sm text-slate-500">Votre espace personnel</p></div><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-900">{account?.full_name || 'Sportif'}</p><p className="text-xs text-slate-500">Athlète</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ef] text-sm font-bold text-teal-800">{firstName.slice(0, 1)}</div><button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900" aria-label="Déconnexion"><LogOut className="h-4 w-4" /></button></div></header>
        <div className="mx-auto max-w-[1500px] p-5 sm:p-8"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-medium text-cyan-700">Bonjour {firstName},</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Votre tableau de bord</h1><p className="mt-3 text-sm text-slate-500">Les métriques et séances apparaîtront lorsqu’elles seront disponibles.</p><div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-sm font-medium text-slate-700">Aucune donnée pour le moment</p><p className="mt-2 text-sm text-slate-500">Aucune séance, métrique ou mesure de récupération n’est encore enregistrée.</p></div></section></div>
      </main>
    </div>
  )
}

export default AthleteDashboardPage
