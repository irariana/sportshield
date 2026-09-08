const alertes = [
  {
    titre: 'Suivi médical urgent',
    niveau: 'Critique',
    details: 'Contrôle de récupération à revoir pour l’équipe U19.',
    date: 'Aujourd’hui, 09:30',
  },
  {
    titre: 'Profil incomplet',
    niveau: 'Moyen',
    details: 'Documents manquants pour deux sportifs de la section rugby.',
    date: 'Hier, 18:10',
  },
  {
    titre: 'Anomalie de charge',
    niveau: 'Faible',
    details: 'Variation de charge hebdomadaire détectée sur deux athlètes.',
    date: 'Il y a 2 jours',
  },
]

const niveauStyles = {
  Critique: 'bg-rose-100 text-rose-700',
  Moyen: 'bg-amber-100 text-amber-700',
  Faible: 'bg-sky-100 text-sky-700',
}

function AlertesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Sécurité</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Alertes</h2>
      </div>

      <div className="space-y-4">
        {alertes.map((alerte) => (
          <div
            key={alerte.titre}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{alerte.titre}</h3>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${niveauStyles[alerte.niveau]}`}>
                    {alerte.niveau}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{alerte.details}</p>
              </div>

              <div className="text-sm text-slate-500">{alerte.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertesPage
