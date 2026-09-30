import { useEffect, useState } from 'react'
import { Activity, CalendarDays, Route } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Les colonnes d'import (activity_source, distance_meters…) sont créées par
// supabase/migration/00000000000010_activity_imports.sql : si la base n'est
// pas encore à jour, on l'explique au lieu d'afficher l'erreur Postgres brute.
function loadErrorMessage(message = '') {
  return message.includes('does not exist')
    ? 'La base n’est pas à jour : exécutez supabase/migration/00000000000010_activity_imports.sql dans Supabase, puis rechargez la page.'
    : message
}

function ActivitySourcesPage({ account, federation }) {
  const [athletes, setAthletes] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadData() {
      setError('')
      let athleteIds = null
      if (account.role === 'entraineur') {
        const assignmentResult = await supabase.from('coach_athlete_assignments')
          .select('athlete_id')
          .eq('federation_id', federation.id)
          .eq('coach_id', account.id)
          .is('ended_at', null)
        if (assignmentResult.error) {
          if (active) setError(assignmentResult.error.message)
          if (active) setLoading(false)
          return
        }
        athleteIds = [...new Set((assignmentResult.data || []).map((assignment) => assignment.athlete_id))]
      }

      if (athleteIds?.length === 0) {
        if (active) {
          setAthletes([])
          setActivities([])
          setLoading(false)
        }
        return
      }

      let athleteQuery = supabase.from('profiles')
        .select('id, full_name')
        .eq('federation_id', federation.id)
        .eq('role', 'sportif')
        .order('full_name')
      if (athleteIds) athleteQuery = athleteQuery.in('id', athleteIds)

      const [athleteResult, activityResult] = await Promise.all([
        athleteQuery,
        supabase.from('training_sessions')
          .select('id, athlete_id, activity_source, session_date, distance_meters')
          .eq('federation_id', federation.id),
      ])
      if (!active) return
      if (athleteResult.error || activityResult.error) {
        setError(loadErrorMessage(athleteResult.error?.message || activityResult.error?.message) || 'Impossible de charger les activités.')
      } else {
        setAthletes(athleteResult.data || [])
        setActivities((activityResult.data || []).filter((item) => item.activity_source === 'import'))
      }
      setLoading(false)
    }

    loadData()
    const channel = supabase.channel(`activity-sources-${federation.id}-${account.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sessions', filter: `federation_id=eq.${federation.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_athlete_assignments', filter: `federation_id=eq.${federation.id}` }, loadData)
      .subscribe()
    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [account.id, account.role, federation.id])

  const athletesWithActivities = athletes.filter((athlete) => activities.some((activity) => activity.athlete_id === athlete.id)).length

  return <div className="space-y-7">
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Suivi des imports</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Sources de données</h1><p className="mt-2 text-sm text-slate-500">{account.role === 'entraineur' ? 'Activités des sportifs qui vous sont affectés.' : 'Activités enregistrées par les sportifs de votre fédération.'}</p></div>
      <p className="text-sm text-slate-500">{federation.name}</p>
    </header>

    <section className="grid gap-4 sm:grid-cols-2" aria-label="Couverture des activités">
      <Metric label="Sportifs avec des données" value={loading ? '…' : `${athletesWithActivities} sur ${athletes.length}`} icon={Activity} />
      <Metric label="Activités importées" value={loading ? '…' : activities.length} icon={Route} />
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Activités par sportif</h2></div>
      {error && <p role="alert" className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-[580px] w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr><Heading>Sportif</Heading><Heading>Activités importées</Heading><Heading>Dernière activité</Heading></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="3" className="px-5 py-12 text-center text-sm text-slate-500">Chargement des activités…</td></tr>
              : athletes.length === 0 ? <tr><td colSpan="3" className="px-5 py-12 text-center text-sm text-slate-500">{account.role === 'entraineur' ? 'Aucun sportif ne vous est affecté pour le moment.' : 'Aucun sportif dans ce périmètre.'}</td></tr>
                : athletes.map((athlete) => {
                  const athleteActivities = activities.filter((activity) => activity.athlete_id === athlete.id)
                  const latestDate = athleteActivities.map((activity) => activity.session_date).sort().at(-1)
                  return <tr key={athlete.id}>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{athlete.full_name || 'Sportif'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{athleteActivities.length ? `${athleteActivities.length} ${athleteActivities.length === 1 ? 'séance importée' : 'séances importées'}` : 'Aucune donnée pour le moment'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{latestDate ? <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(latestDate)}</span> : '—'}</td>
                  </tr>
                })}
          </tbody>
        </table>
      </div>
    </section>
  </div>
}

function Metric({ label, value, icon: Icon }) {
  return <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></div><Icon className="h-5 w-5 text-sky-600" /></div>
}

function Heading({ children }) {
  return <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{children}</th>
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`))
}

export default ActivitySourcesPage