import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowLeftRight, CheckCircle2, Clock3, Database, RefreshCw, Shield, Watch, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { buildSyncBatch, computeSyncSummary, getMockSensorData, statusMeta } from '../lib/sensorSyncMock'

const sections = [
  { label: 'Vue d’ensemble', icon: Shield },
  { label: 'Sportifs', icon: Activity },
  { label: 'Utilisateurs', icon: Shield },
  { label: 'Capteurs', icon: Watch },
  { label: 'Données', icon: Database },
]

const initialFilters = { athlete: 'all', sensor: 'all', type: 'all', status: 'all' }

function SensorSyncPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState(getMockSensorData)
  const [filters, setFilters] = useState(initialFilters)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('Synchronisation terminée')
  const [lastSyncAt, setLastSyncAt] = useState('2026-09-30T16:42:12')

  const summary = useMemo(() => computeSyncSummary(records), [records])

  const athletes = useMemo(
    () => [...new Set(records.map((record) => record.athleteName))],
    [records],
  )
  const sensors = useMemo(
    () => [...new Set(records.map((record) => record.source))],
    [records],
  )
  const dataTypes = useMemo(
    () => [...new Set(records.map((record) => record.dataType))],
    [records],
  )

  const visibleRecords = useMemo(() => {
    return records.filter((record) => {
      const athleteMatches = filters.athlete === 'all' || record.athleteName === filters.athlete
      const sensorMatches = filters.sensor === 'all' || record.source === filters.sensor
      const typeMatches = filters.type === 'all' || record.dataType === filters.type
      const statusMatches = filters.status === 'all' || record.status === filters.status
      return athleteMatches && sensorMatches && typeMatches && statusMatches
    })
  }, [records, filters])

  function handleSectionChange(label) {
    if (label === 'Vue d’ensemble') {
      navigate('/federation')
      return
    }
    if (label === 'Sportifs') {
      navigate('/federation/athletes')
    }
  }

  function handleSync() {
    setIsSyncing(true)
    setSyncMessage('Synchronisation en cours...')

    window.setTimeout(() => {
      const nextBatch = buildSyncBatch(records.length)
      const mergedRecords = [...nextBatch, ...records]
      setRecords(mergedRecords)
      setLastSyncAt(new Date().toISOString())
      setSyncMessage('Synchronisation terminée')
      setIsSyncing(false)
    }, 1200)
  }

  function clearFilters() {
    setFilters(initialFilters)
  }

  const metricCards = [
    { label: 'Données reçues', value: summary.received, icon: Database, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Synchronisées', value: summary.integrated, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'En erreur', value: summary.errors, icon: AlertTriangle, tone: 'bg-rose-50 text-rose-700' },
    { label: 'Corrompues', value: summary.rejected, icon: XCircle, tone: 'bg-slate-200 text-slate-700' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">SportShield</p>
              <p className="text-xs text-slate-400">Espace fédération</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sections.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleSectionChange(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  label === 'Données'
                    ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p>
            <p className="mt-2 text-sm text-slate-300">Données de capteurs centralisées et tracées par sportif.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Synchronisation</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Données des capteurs</h1>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Admin fédération</p>
                  <p className="text-xs text-slate-500">Périmètre sportif</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
              {sections.map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSectionChange(label)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    label === 'Données' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/40 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-300">Synchronisation des données</p>
                  <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Dernière synchronisation : {formatDateTime(lastSyncAt)}</h2>
                </div>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-400/70"
                >
                  {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                  {isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  {isSyncing ? <Clock3 className="h-4 w-4 animate-pulse text-sky-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  <span>{syncMessage}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {summary.received} données reçues · {summary.integrated} intégrées · {summary.errors} en erreur · {summary.rejected} rejetées
                </p>
              </div>
            </section>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{label}</p>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
                  </div>
                  <p className="mt-5 text-3xl font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Filtres</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Historique des synchronisations</h3>
                </div>
                <button type="button" onClick={clearFilters} className="text-sm font-semibold text-sky-700 hover:text-sky-600">
                  Réinitialiser
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <FilterSelect label="Sportif" value={filters.athlete} onChange={(value) => setFilters((current) => ({ ...current, athlete: value }))} options={['all', ...athletes]} optionLabels={['Tous', ...athletes]} />
                <FilterSelect label="Capteur" value={filters.sensor} onChange={(value) => setFilters((current) => ({ ...current, sensor: value }))} options={['all', ...sensors]} optionLabels={['Tous', ...sensors]} />
                <FilterSelect label="Type" value={filters.type} onChange={(value) => setFilters((current) => ({ ...current, type: value }))} options={['all', ...dataTypes]} optionLabels={['Tous', ...dataTypes]} />
                <FilterSelect label="Statut" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={['all', 'valid', 'pending', 'error', 'rejected']} optionLabels={['Tous', 'Synchronisée', 'En attente', 'Erreur', 'Rejetée']} />
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Résultats</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{visibleRecords.length}</p>
                </div>
              </div>
            </section>

            <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Capteur', 'Sportif', 'Donnée', 'Valeur', 'Date', 'Statut', 'Action'].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-5 py-16 text-center text-sm text-slate-400">
                          Aucune donnée ne correspond à ces filtres.
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((record) => (
                        <tr key={record.id} className="align-top">
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{record.sensorId}</p>
                              <p className="text-xs text-slate-500">{record.source}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{record.athleteName}</p>
                              <p className="text-xs text-slate-500">{record.athleteId}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{record.dataType}</p>
                              <p className="text-xs text-slate-500">{record.sensorType}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.value ?? '—'} {record.unit}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(record.timestamp)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[record.status].className}`}>
                              {statusMeta[record.status].label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {(record.status === 'error' || record.status === 'rejected') && (
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="text-sm font-semibold text-sky-700 hover:text-sky-600"
                              >
                                Voir le détail
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Donnée rejetée</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Erreur de synchronisation</h3>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-sm text-slate-500 hover:text-slate-900">
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Détail</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Capteur :</span> {selectedRecord.sensorId}</p>
                <p><span className="font-semibold">Sportif :</span> {selectedRecord.athleteName}</p>
                <p><span className="font-semibold">Type :</span> {selectedRecord.dataType}</p>
                <p><span className="font-semibold">Date :</span> {formatDateTime(selectedRecord.timestamp)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-600">Erreur</p>
              <p className="mt-2 text-sm leading-6 text-rose-700">{selectedRecord.error}</p>
            </div>

            <div className="mt-5 flex justify-end">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[selectedRecord.status].className}`}>
                {statusMeta[selectedRecord.status].label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, optionLabels }) {
  return (
    <label className="block text-sm text-slate-600">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      >
        {options.map((option, index) => (
          <option key={option} value={option}>
            {optionLabels[index]}
          </option>
        ))}
      </select>
    </label>
  )
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default SensorSyncPage
