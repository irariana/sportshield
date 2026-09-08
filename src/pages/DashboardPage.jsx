import { AlertTriangle, Activity, CalendarCheck2, ShieldCheck, Users } from 'lucide-react'
import KpiCard from '../components/KpiCard'

const kpis = [
  { title: 'Sportifs', value: '1 284', meta: '+8,2% vs. mois dernier', icon: Users, accentClass: 'bg-sky-100 text-sky-700' },
  { title: 'Séances', value: '348', meta: '14 planifiées aujourd’hui', icon: CalendarCheck2, accentClass: 'bg-blue-100 text-blue-700' },
  { title: 'Alertes', value: '19', meta: '7 nécessitent une vérification', icon: AlertTriangle, accentClass: 'bg-amber-100 text-amber-700' },
  { title: 'Protection', value: '96%', meta: 'Taux de conformité globale', icon: ShieldCheck, accentClass: 'bg-emerald-100 text-emerald-700' },
]

const chartBars = [42, 58, 48, 76, 64, 82, 70]
const alertPreview = [
  { title: 'Récupération à surveiller', detail: 'Sonia Lemaire • U19', time: '2h' },
  { title: 'Mise à jour médicale', detail: 'Lucas Vanel • Natation', time: '4h' },
  { title: 'Profil incomplet', detail: 'Équipe féminine • Rugby', time: '1j' },
]

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Vue d’ensemble</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard</h2>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
        >
          Générer le rapport
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            meta={kpi.meta}
            icon={kpi.icon}
            accentClass={kpi.accentClass}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Activité</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Suivi hebdomadaire</h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <Activity className="h-3.5 w-3.5" />
              Stable
            </div>
          </div>

          <div className="flex h-56 items-end gap-3">
            {chartBars.map((barHeight, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 to-sky-400"
                  style={{ height: `${barHeight}%` }}
                />
                <span className="text-[10px] uppercase text-slate-400">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">À surveiller</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Alertes récentes</h3>
            </div>
          </div>

          <div className="space-y-3">
            {alertPreview.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{alert.detail}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700">
                    {alert.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
