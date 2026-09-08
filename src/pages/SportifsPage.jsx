const sportifs = [
  { nom: 'Emma Bernard', sport: 'Football', statut: 'Actif' },
  { nom: 'Lucas Vanel', sport: 'Natation', statut: 'À risque' },
  { nom: 'Sofia Leroy', sport: 'Rugby', statut: 'Actif' },
  { nom: 'Noah Martin', sport: 'Athlétisme', statut: 'En observation' },
]

const statutStyles = {
  Actif: 'bg-emerald-100 text-emerald-700',
  'À risque': 'bg-amber-100 text-amber-700',
  'En observation': 'bg-sky-100 text-sky-700',
}

function SportifsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Gestion</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Sportifs</h2>
        </div>

        <button
          type="button"
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
        >
          Ajouter un sportif
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Nom
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Sport
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sportifs.map((sportif) => (
                <tr key={sportif.nom} className="hover:bg-slate-50/80">
                  <td className="px-5 py-4 text-sm font-medium text-slate-800">{sportif.nom}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{sportif.sport}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statutStyles[sportif.statut]}`}
                    >
                      {sportif.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SportifsPage
