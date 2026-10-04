import { useMemo, useState } from 'react'
import { Activity, ArrowLeft, Database, Shield, UserRound, Watch, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMockSensorData } from '../lib/sensorSyncMock'

const sections = [
  { label: 'Vue d’ensemble', icon: Shield },
  { label: 'Sportifs', icon: Activity },
  { label: 'Utilisateurs', icon: Shield },
  { label: 'Capteurs', icon: Watch },
  { label: 'Données', icon: Database },
]

function DataTraceabilityPage() {
  const navigate = useNavigate()
  const [selectedRecord, setSelectedRecord] = useState(null)

  const traceabilityRecords = useMemo(() => {
    return getMockSensorData()
      .map((record) => ({
        ...record,
        sessionLabel: `${record.sessionId ?? 'S-024'} — ${record.sessionName ?? 'Séance non identifiée'}`,
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [])

  function handleSectionChange(label) {
    if (label === 'Vue d’ensemble') {
      navigate('/federation')
      return
    }
    if (label === 'Sportifs') {
      navigate('/federation/athletes')
      return
    }
    if (label === 'Données') {
      navigate('/federation/synchronization')
    }
  }

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
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Traçabilité</p>
            <p className="mt-2 text-sm text-slate-300">Origine et contexte des données collectées par les capteurs.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Traçabilité</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Traçabilité des données</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/federation/synchronization')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux données
            </button>
          </header>

          <div className="p-5 sm:p-8">
            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/40 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-300">Identifier l’origine d’une donnée</p>
                  <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Suivi de source, sportif, séance et valeur</h2>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                  <UserRound className="h-4 w-4 text-sky-300" />
                  <span>{traceabilityRecords.length} données tracées</span>
                </div>
              </div>
            </section>

            <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Source', 'Sportif', 'Séance', 'Date / heure', 'Valeur', 'Action'].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {traceabilityRecords.map((record) => (
                      <tr key={record.id} className="align-top hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{record.source}</p>
                            <p className="text-xs text-slate-500">{record.sensorId}</p>
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
                            <p className="text-sm font-medium text-slate-700">{record.sessionId}</p>
                            <p className="text-xs text-slate-500">{record.sessionName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{formatDateTime(record.timestamp)}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{formatValue(record)}</td>
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => setSelectedRecord(record)} className="text-sm font-semibold text-sky-700 hover:text-sky-600">
                            Voir le détail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Donnée traçable</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedRecord.source}</h3>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-slate-500 hover:text-slate-900" aria-label="Fermer le détail">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Source" value={selectedRecord.source} />
              <DetailItem label="Sportif" value={selectedRecord.athleteName} />
              <DetailItem label="Séance" value={`${selectedRecord.sessionId} — ${selectedRecord.sessionName}`} />
              <DetailItem label="Date / heure" value={formatDateTime(selectedRecord.timestamp)} />
              <DetailItem label="Capteur" value={selectedRecord.sensorId} />
              <DetailItem label="Type de capteur" value={selectedRecord.sensorType} />
              <DetailItem label="Donnée" value={selectedRecord.dataType} />
              <DetailItem label="Unité" value={selectedRecord.unit} />
            </div>

            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Valeur</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatValue(selectedRecord)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatValue(record) {
  if (record.value === null || record.value === undefined) return '—'
  const rawValue = Number(record.value)
  if (Number.isInteger(rawValue)) return `${rawValue} ${record.unit}`
  return `${Number(rawValue).toFixed(1).replace('.0', '')} ${record.unit}`
}

export default DataTraceabilityPage
