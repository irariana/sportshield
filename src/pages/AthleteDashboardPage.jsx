import { useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, Clock3, Dumbbell, Gauge, HeartPulse, LogOut, Menu, Shield, Sparkles, Target, TrendingUp, X } from 'lucide-react'

const periods = ['7 jours', '4 semaines', 'Saison']

const sessions = [
  { day: 'Aujourd’hui', title: 'Intervalles course', meta: 'Piste · 58 min', load: 82, tone: 'bg-cyan-500', iconTone: 'text-cyan-600' },
  { day: 'Hier', title: 'Récupération active', meta: 'Vélo · 42 min', load: 38, tone: 'bg-emerald-500', iconTone: 'text-emerald-600' },
  { day: 'Lun. 08 sept.', title: 'Force bas du corps', meta: 'Salle · 1 h 05', load: 71, tone: 'bg-amber-500', iconTone: 'text-amber-600' },
]

function AthleteDashboardPage({ account, federation, onLogout }) {
  const [period, setPeriod] = useState('4 semaines')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const firstName = account?.full_name?.split(' ')[0] || 'Alex'

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-[#102b35] px-5 py-6 text-slate-200 transition-transform md:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#102b35]"><Shield className="h-5 w-5" /></div>
            <div><p className="text-lg font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Performance hub</p></div>
          </div>
          <button type="button" onClick={() => setIsMenuOpen(false)} className="text-slate-400 md:hidden" aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="mt-12 space-y-2">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Mon espace</p>
          <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-xl bg-cyan-400 px-3 py-3 text-left text-sm font-semibold text-[#102b35]"><Activity className="h-4 w-4" />Vue d’ensemble</button>
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><CalendarDays className="h-4 w-4" />Mes séances</button>
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10"><Target className="h-4 w-4" />Mes objectifs</button>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Profil suivi</p><p className="mt-2 truncate text-sm font-medium text-white">{federation?.name || 'Ma fédération'}</p><p className="mt-1 text-xs leading-5 text-slate-400">Vos données restent privées et accessibles à votre équipe autorisée.</p></div>
      </aside>

      {isMenuOpen && <button type="button" onClick={() => setIsMenuOpen(false)} className="fixed inset-0 z-10 bg-slate-950/40 md:hidden" aria-label="Fermer le menu" />}
      <main className="min-w-0 md:pl-72">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <button type="button" onClick={() => setIsMenuOpen(true)} className="rounded-lg p-2 text-slate-500 md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden sm:block"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Tableau de bord athlète</p><p className="mt-1 text-sm text-slate-500">Votre semaine en un regard</p></div>
          <div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-900">{account?.full_name || 'Alex Martin'}</p><p className="text-xs text-slate-500">Athlète</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d8f4ef] text-sm font-bold text-teal-800">{firstName.slice(0, 1)}</div><button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900" aria-label="Déconnexion"><LogOut className="h-4 w-4" /></button></div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-sm font-medium text-cyan-700">Bonjour {firstName},</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Prêt à voir où vous en êtes ?</h1><p className="mt-3 text-sm text-slate-500">Les signaux de votre entraînement des dernières semaines.</p></div><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{periods.map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${period === item ? 'bg-[#102b35] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{item}</button>)}<ChevronDown className="mr-2 h-4 w-4 text-slate-400" /></div></section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Gauge} label="Forme globale" value="82" unit="/100" detail="+6 pts cette semaine" positive accent="cyan" />
            <MetricCard icon={Activity} label="Charge actuelle" value="374" unit="UA" detail="Dans votre zone cible" positive accent="amber" />
            <MetricCard icon={HeartPulse} label="FC au repos" value="48" unit="bpm" detail="-3 bpm vs moyenne" positive accent="rose" />
            <MetricCard icon={Clock3} label="Temps entraîné" value="5 h 42" unit="" detail="4 séances cette semaine" accent="violet" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-900">Charge d’entraînement</p><p className="mt-1 text-xs text-slate-500">Charge aiguë vs charge chronique · {period}</p></div><div className="flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" />Aiguë</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Chronique</span></div></div><div className="mt-8 flex h-56 items-end gap-2 border-b border-l border-slate-100 px-2 sm:gap-4">{[46, 58, 42, 68, 74, 61, 84, 72, 65, 78, 88, 76].map((height, index) => <div key={index} className="group flex h-full flex-1 flex-col justify-end gap-1"><div className="relative h-full"><div className="absolute bottom-0 w-full rounded-t-md bg-slate-200" style={{ height: `${Math.max(height - 20, 24)}%` }} /><div className="absolute bottom-0 z-10 w-full rounded-t-md bg-cyan-500 transition group-hover:bg-cyan-600" style={{ height: `${height}%` }} /></div><span className="text-center text-[10px] text-slate-400">{['L', 'M', 'M', 'J', 'V', 'S', 'D', 'L', 'M', 'M', 'J', 'V'][index]}</span></div>)}</div><div className="mt-5 flex items-center justify-between rounded-xl bg-cyan-50 px-4 py-3"><div className="flex items-center gap-2 text-sm font-medium text-cyan-900"><Sparkles className="h-4 w-4" />Votre charge est bien maîtrisée</div><span className="text-xs font-semibold text-cyan-700">Ratio 1.12</span></div></div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-900">Forme & récupération</p><p className="mt-1 text-xs text-slate-500">Indice quotidien</p></div><TrendingUp className="h-5 w-5 text-emerald-500" /></div><div className="mt-7 flex items-center gap-6"><div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 0deg 295deg, #e6f5f1 295deg 360deg)' }}><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-semibold text-slate-900">82</span><span className="text-[10px] uppercase tracking-wider text-slate-400">sur 100</span></div></div><div className="space-y-3 text-xs"><p className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Sommeil <strong className="text-slate-900">8 h 12</strong></p><p className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-cyan-500" />HRV <strong className="text-slate-900">68 ms</strong></p><p className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-amber-400" />Stress <strong className="text-slate-900">Faible</strong></p></div></div><div className="mt-7 border-t border-slate-100 pt-4 text-xs text-slate-500">Votre récupération vous permet de maintenir l’intensité aujourd’hui.</div></div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">Séances récentes</p><p className="mt-1 text-xs text-slate-500">Votre historique d’entraînement</p></div><button type="button" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">Voir tout</button></div><div className="mt-5 divide-y divide-slate-100">{sessions.map((session) => <div key={session.title} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 ${session.iconTone}`}><Dumbbell className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-xs text-slate-400">{session.day}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{session.title}</p><p className="mt-1 text-xs text-slate-500">{session.meta}</p></div><div className="w-20"><div className="flex justify-between text-[10px] text-slate-400"><span>Charge</span><span>{session.load}</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${session.tone}`} style={{ width: `${session.load}%` }} /></div></div></div>)}</div></div>
            <div className="rounded-2xl bg-[#102b35] p-5 text-white shadow-sm sm:p-7"><div className="flex items-center gap-2 text-cyan-300"><Target className="h-4 w-4" /><p className="text-sm font-semibold">Objectif de la semaine</p></div><p className="mt-6 text-3xl font-semibold">4 / 5</p><p className="mt-1 text-sm text-slate-300">séances complétées</p><div className="mt-6 h-2 rounded-full bg-white/10"><div className="h-2 w-4/5 rounded-full bg-cyan-400" /></div><p className="mt-5 text-sm leading-6 text-slate-300">Encore une séance pour atteindre votre objectif hebdomadaire.</p><button type="button" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-[#102b35]">Planifier ma séance <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
          </section>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, unit, detail, positive, accent }) {
  const colors = { cyan: 'bg-cyan-50 text-cyan-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors[accent]}`}><Icon className="h-4 w-4" /></span></div><div className="mt-5 flex items-baseline gap-1"><span className="text-3xl font-semibold tracking-tight text-slate-950">{value}</span><span className="text-xs text-slate-400">{unit}</span></div><p className={`mt-2 flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-slate-500'}`}>{positive && <ArrowDownRight className="h-3.5 w-3.5" />}{detail}</p></div>
}

export default AthleteDashboardPage