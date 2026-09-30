import { Activity, CalendarDays, ChevronLeft, ChevronRight, Clock3, Dumbbell, FileUp, LogOut, Menu, Pencil, Plus, Save, Shield, Target, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { parseActivityFile } from '../lib/activityFiles'
import { resolveFederationSports } from '../lib/sports'

// Les colonnes d'import (activity_source, distance_meters…) sont créées par
// supabase/migration/00000000000010_activity_imports.sql : si la base n'est
// pas encore à jour, on l'explique au lieu d'afficher l'erreur Postgres brute.
function loadErrorMessage(message = '') {
  return message.includes('does not exist')
    ? 'La base n’est pas à jour : exécutez supabase/migration/00000000000010_activity_imports.sql dans Supabase, puis rechargez la page.'
    : message
}

const sections = [
  { id: 'overview', label: 'Vue d’ensemble', icon: Activity },
  { id: 'sessions', label: 'Mes séances', icon: CalendarDays },
  { id: 'activities', label: 'Mes activités', icon: FileUp },
  { id: 'objectives', label: 'Mes objectifs', icon: Target },
]
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'
const today = dateString(new Date())

function AthleteDashboardExperience({ account, federation, onLogout }) {
  const [section, setSection] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [sessions, setSessions] = useState([])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [sessionForm, setSessionForm] = useState(null)
  const [activityForm, setActivityForm] = useState(null)
  const [objectiveForm, setObjectiveForm] = useState(null)
  const [notice, setNotice] = useState(null)
  const firstName = account?.full_name?.split(' ')[0] || 'Sportif'
  const sport = account?.sport || federation?.sports?.[0] || 'Sport non renseigné'

  useEffect(() => {
    let active = true
    async function loadSessions() {
      if (!isSupabaseConfigured || !supabase) {
        if (active) {
          setNotice({ error: true, text: 'Supabase n’est pas configuré.' })
          setLoading(false)
        }
        return
      }
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, federation_id, athlete_id, coach_id, session_type, session_date, duration_minutes, duration_seconds, distance_meters, average_pace_seconds_per_km, activity_source, source_format, source_filename, load, notes, objective')
        .eq('athlete_id', account.id)
        .order('session_date', { ascending: false })
      if (!active) return
      if (error) setNotice({ error: true, text: `Chargement impossible : ${loadErrorMessage(error.message)}` })
      else setSessions(data || [])
      setLoading(false)
    }
    loadSessions()
    return () => { active = false }
  }, [account.id])

  const upcoming = useMemo(() => sessions
    .filter((session) => session.session_date >= today)
    .sort((left, right) => left.session_date.localeCompare(right.session_date)), [sessions])
  const completed = sessions.filter((session) => session.session_date < today)
  const minutes = completed.reduce((sum, session) => sum + (Number(session.duration_minutes) || 0), 0)
  const load = completed.reduce((sum, session) => sum + (Number(session.load) || 0), 0)
  const stats = [
    ['Séances réalisées', completed.length, Dumbbell],
    ['Temps total', formatDuration(minutes), Clock3],
    ['Charge cumulée', `${load.toLocaleString('fr-FR')} pts`, Activity],
    ['Durée moyenne', `${sessions.length ? Math.round(minutes / sessions.length) : 0} min`, Target],
  ]

  function putSession(session) {
    setSessions((current) => {
      const found = current.some((item) => item.id === session.id)
      const next = found ? current.map((item) => item.id === session.id ? session : item) : [...current, session]
      return next.sort((left, right) => right.session_date.localeCompare(left.session_date))
    })
  }

  async function saveSession(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const form = new FormData(event.currentTarget)
    const values = {
      federation_id: account.federation_id,
      athlete_id: account.id,
      session_type: String(form.get('session_type')).trim(),
      session_date: form.get('session_date'),
      duration_minutes: form.get('duration_minutes') ? Number(form.get('duration_minutes')) : null,
      load: form.get('load') ? Number(form.get('load')) : null,
      objective: String(form.get('objective') || '').trim() || null,
      notes: String(form.get('notes') || '').trim() || null,
    }
    const result = sessionForm.id
      ? await supabase.from('training_sessions').update(values).eq('id', sessionForm.id).eq('athlete_id', account.id).select().single()
      : await supabase.from('training_sessions').insert(values).select().single()
    setSaving(false)
    if (result.error) {
      setNotice({ error: true, text: `Enregistrement impossible : ${result.error.message}` })
      return
    }
    putSession(result.data)
    setSessionForm(null)
    setNotice({ text: 'Séance enregistrée.' })
  }

  async function deleteSession() {
    if (!sessionForm.id || !window.confirm('Supprimer cette séance ?')) return
    setSaving(true)
    const { error } = await supabase.from('training_sessions').delete().eq('id', sessionForm.id).eq('athlete_id', account.id)
    setSaving(false)
    if (error) {
      setNotice({ error: true, text: `Suppression impossible : ${error.message}` })
      return
    }
    setSessions((current) => current.filter((item) => item.id !== sessionForm.id))
    setSessionForm(null)
    setNotice({ text: 'Séance supprimée.' })
  }

  async function importActivity(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setImporting(true)
    setNotice(null)
    try {
      const parsed = await parseActivityFile(file)
      const { data, error } = await supabase.from('training_sessions').insert({
        federation_id: account.federation_id,
        athlete_id: account.id,
        coach_id: null,
        session_type: account?.sport || resolveFederationSports(federation?.sports)[0],
        ...parsed,
      }).select().single()
      if (error) throw new Error(`Import impossible : ${error.message}`)
      putSession(data)
      setNotice({ text: `Activité importée : ${formatDistance(data.distance_meters)} · ${formatDurationSeconds(data.duration_seconds)} · ${formatPace(data.average_pace_seconds_per_km)} /km` })
    } catch (error) {
      setNotice({ error: true, text: error instanceof Error ? error.message : 'Impossible d’importer cette activité.' })
    } finally {
      setImporting(false)
    }
  }

  async function saveActivity(event) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    const form = new FormData(event.currentTarget)
    const distanceMeters = Number(form.get('distance_km')) * 1000
    const durationSeconds = Math.round(Number(form.get('duration_minutes')) * 60)
    const values = {
      session_type: String(form.get('session_type')).trim(),
      session_date: form.get('session_date'),
      distance_meters: Math.round(distanceMeters),
      duration_seconds: durationSeconds,
      duration_minutes: Math.max(1, Math.round(durationSeconds / 60)),
      average_pace_seconds_per_km: Math.round(durationSeconds / (distanceMeters / 1000)),
    }
    const { data, error } = await supabase.from('training_sessions')
      .update(values)
      .eq('id', activityForm.id)
      .eq('athlete_id', account.id)
      .eq('activity_source', 'import')
      .select().single()
    setSaving(false)
    if (error) {
      setNotice({ error: true, text: `Modification impossible : ${error.message}` })
      return
    }
    putSession(data)
    setActivityForm(null)
    setNotice({ text: 'Activité mise à jour.' })
  }

  async function deleteActivity(activity) {
    if (!window.confirm('Supprimer cette activité importée ?')) return
    setSaving(true)
    const { error } = await supabase.from('training_sessions').delete()
      .eq('id', activity.id)
      .eq('athlete_id', account.id)
      .eq('activity_source', 'import')
    setSaving(false)
    if (error) {
      setNotice({ error: true, text: `Suppression impossible : ${error.message}` })
      return
    }
    setSessions((current) => current.filter((item) => item.id !== activity.id))
    setNotice({ text: 'Activité supprimée.' })
  }

  async function saveObjective(event) {
    event.preventDefault()
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const { data, error } = await supabase.rpc('update_own_training_session_objective', {
      target_session_id: objectiveForm.id,
      new_objective: String(form.get('objective') || ''),
    })
    setSaving(false)
    if (error) {
      setNotice({ error: true, text: `Modification impossible : ${error.message}` })
      return
    }
    putSession(data)
    setObjectiveForm(null)
    setNotice({ text: 'Objectif mis à jour.' })
  }

  return <div className="min-h-screen bg-slate-100 text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-slate-950 px-5 py-6 text-slate-200 transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="text-lg font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Espace sportif</p></div></div><button type="button" onClick={() => setMenuOpen(false)} className="md:hidden" aria-label="Fermer le menu"><X className="h-5 w-5" /></button></div>
      <nav className="mt-12 space-y-2" aria-label="Navigation sportive"><p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Mon espace</p>{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => { setSection(id); setMenuOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${section === id ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
      <div className="mt-auto border-t border-white/15 px-3 pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">Fédération</p><p className="mt-2 truncate text-sm font-medium text-white">{federation?.name || 'Mon espace'}</p><p className="mt-1 text-xs text-slate-400">{sport}</p></div>
    </aside>
    {menuOpen && <button type="button" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-20 bg-slate-950/40 md:hidden" aria-label="Fermer le menu" />}
    <main className="min-w-0 md:pl-72">
      <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><button type="button" onClick={() => setMenuOpen(true)} className="md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button><div className="hidden sm:block"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Tableau de bord sportif</p><p className="mt-1 text-sm text-slate-500">{sections.find((item) => item.id === section)?.label}</p></div><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-900">{account?.full_name || 'Sportif'}</p><p className="text-xs text-slate-500">{sport}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">{firstName.slice(0, 1)}</div><button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600" aria-label="Déconnexion"><LogOut className="h-4 w-4" /></button></div></header>
      <div className="mx-auto max-w-[1440px] p-5 sm:p-8">
        {notice && <div role="status" className={`mb-5 flex justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${notice.error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Fermer"><X className="h-4 w-4" /></button></div>}
        {loading ? <p className="py-20 text-center text-sm text-slate-500">Chargement de vos séances...</p> : section === 'overview' ? <>
          <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-sky-600">Bonjour {firstName},</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Votre progression</h1><p className="mt-2 text-sm text-slate-600">{federation?.name} · {sport}</p></div><button type="button" onClick={() => setSection('sessions')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 text-sm font-semibold text-white"><CalendarDays className="h-4 w-4" />Voir mes séances</button></section>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistiques d’entraînement">{stats.map(([label, value, Icon]) => <div key={label} className="border-b border-slate-200 bg-white px-4 py-4 sm:rounded-2xl sm:border sm:p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-600">{label}</p><Icon className="h-4 w-4 text-sky-600" /></div><p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p></div>)}</section>
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_1fr]"><section><h2 className="text-lg font-semibold text-slate-950">Activité récente</h2><p className="mt-1 text-sm text-slate-500">Séances, durée, charge et objectif.</p><SessionList sessions={[...completed].sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 5)} onEditObjective={setObjectiveForm} /></section><section className="border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0"><h2 className="text-lg font-semibold text-slate-950">Prochaine séance</h2>{upcoming[0] ? <div className="mt-4 rounded-2xl border-l-4 border-sky-500 bg-white px-5 py-4"><p className="text-xs font-semibold uppercase text-sky-600">{formatDate(upcoming[0].session_date)}</p><p className="mt-2 text-lg font-semibold text-slate-950">{upcoming[0].session_type}</p><p className="mt-1 text-sm text-slate-600">{upcoming[0].duration_minutes || 'Durée à définir'}{upcoming[0].duration_minutes ? ' min' : ''}{upcoming[0].load ? ` · Charge ${upcoming[0].load}` : ''}</p><p className="mt-4 text-sm text-slate-700">{upcoming[0].objective || 'Aucun objectif défini.'}</p></div> : <Empty text="Aucune séance future planifiée." />}</section></div>
        </> : section === 'sessions' ? <Calendar sessions={upcoming} month={month} setMonth={setMonth} onAdd={() => setSessionForm({ session_date: today, session_type: '' })} onEdit={setSessionForm} /> : section === 'activities' ? <Activities activities={sessions.filter((session) => session.activity_source === 'import')} importing={importing} saving={saving} onImport={importActivity} onEdit={setActivityForm} onDelete={deleteActivity} /> : <Objectives sessions={sessions} onEdit={setObjectiveForm} />}
      </div>
    </main>
    {sessionForm && <SessionModal session={sessionForm} saving={saving} onSubmit={saveSession} onClose={() => setSessionForm(null)} onDelete={deleteSession} />}
    {activityForm && <ActivityEditModal activity={activityForm} fallbackType={account?.sport || resolveFederationSports(federation?.sports)[0]} saving={saving} onSubmit={saveActivity} onClose={() => setActivityForm(null)} />}
    {objectiveForm && <ObjectiveModal session={objectiveForm} saving={saving} onSubmit={saveObjective} onClose={() => setObjectiveForm(null)} />}
  </div>
}

function Calendar({ sessions, month, setMonth, onAdd, onEdit }) {
  const year = month.getFullYear()
  const monthNumber = month.getMonth()
  const count = new Date(year, monthNumber + 1, 0).getDate()
  const offset = (new Date(year, monthNumber, 1).getDay() + 6) % 7
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)]
  return <section><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-sky-600">Planning</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Mes séances</h1><p className="mt-2 text-sm text-slate-600">Consultez et modifiez vos séances à venir.</p></div><button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Ajouter une séance</button></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><button type="button" onClick={() => setMonth(new Date(year, monthNumber - 1, 1))} aria-label="Mois précédent"><ChevronLeft /></button><h2 className="font-semibold capitalize">{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2><button type="button" onClick={() => setMonth(new Date(year, monthNumber + 1, 1))} aria-label="Mois suivant"><ChevronRight /></button></div><div className="grid grid-cols-7 border-b bg-slate-50">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <div key={day} className="py-2 text-center text-[11px] font-semibold text-slate-500">{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((day, index) => { const date = day ? dateString(new Date(year, monthNumber, day)) : null; return <div key={date || `empty-${index}`} className="min-h-24 border-b border-r border-slate-100 p-1 sm:min-h-28 sm:p-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${date === today ? 'bg-sky-500/20 font-bold text-sky-800' : 'text-slate-600'}`}>{day || ''}</span>{sessions.filter((session) => session.session_date === date).map((session) => <button key={session.id} type="button" onClick={() => onEdit(session)} className="mt-1 block w-full truncate rounded bg-sky-50 px-1 py-1 text-left text-[10px] text-sky-800 sm:text-xs" title="Modifier la séance">{session.session_type}</button>)}</div>})}</div></div>
    <h2 className="mt-8 text-base font-semibold">À venir</h2>{sessions.length ? <SessionList sessions={sessions} onEditObjective={onEdit} onEditSession={onEdit} /> : <Empty text="Aucune séance future. Ajoutez-en une pour la planifier." />}</section>
}

function Activities({ activities, importing, saving, onImport, onEdit, onDelete }) {
  const sorted = [...activities].sort((left, right) => right.session_date.localeCompare(left.session_date))
  return <section>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-sky-600">Fichiers GPX et TCX</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Mes activités</h1><p className="mt-2 text-sm text-slate-600">Distance, durée et allure sont calculées à l’import.</p></div>
      <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500 ${importing ? 'cursor-wait opacity-60' : ''}`}>
        <FileUp className="h-4 w-4" />{importing ? 'Import en cours…' : 'Importer une activité'}
        <input type="file" accept=".gpx,.tcx,application/gpx+xml,application/vnd.garmin.tcx+xml" disabled={importing} onChange={onImport} className="sr-only" />
      </label>
    </div>
    {sorted.length ? <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">{sorted.map((activity) => <article key={activity.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="text-xs font-semibold uppercase text-sky-600">{formatDate(activity.session_date)} · {activity.session_type}</p><p className="mt-2 text-sm font-semibold text-slate-900">{formatDistance(activity.distance_meters)} <span className="font-normal text-slate-500">· {formatDurationSeconds(activity.duration_seconds || Number(activity.duration_minutes) * 60)} · {formatPace(activity.average_pace_seconds_per_km)} /km</span></p><p className="mt-1 truncate text-xs text-slate-400">{activity.source_filename || activity.source_format}</p></div>
      <div className="flex shrink-0 gap-2"><button type="button" disabled={saving} onClick={() => onEdit(activity)} aria-label="Modifier l’activité" title="Modifier l’activité" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><Pencil className="h-4 w-4" /></button><button type="button" disabled={saving} onClick={() => onDelete(activity)} aria-label="Supprimer l’activité" title="Supprimer l’activité" className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div>
    </article>)}</div> : <p className="border-y border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">Aucune activité importée pour le moment.</p>}
  </section>
}

function ActivityEditModal({ activity, fallbackType = resolveFederationSports()[0], saving, onSubmit, onClose }) {
  return <Modal title="Modifier l’activité" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4">
    <label className="block text-sm font-medium">Type d’activité<input name="session_type" required maxLength="100" defaultValue={activity.session_type || fallbackType} className={`mt-1 ${inputClass}`} /></label>
    <label className="block text-sm font-medium">Date<input name="session_date" required type="date" defaultValue={activity.session_date} className={`mt-1 ${inputClass}`} /></label>
    <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Distance (km)<input name="distance_km" required type="number" min="0.01" step="0.01" defaultValue={(Number(activity.distance_meters) / 1000).toFixed(2)} className={`mt-1 ${inputClass}`} /></label><label className="block text-sm font-medium">Durée (min)<input name="duration_minutes" required type="number" min="0.1" step="0.1" defaultValue={(Number(activity.duration_seconds || Number(activity.duration_minutes) * 60) / 60).toFixed(1)} className={`mt-1 ${inputClass}`} /></label></div>
    <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">Annuler</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div>
  </form></Modal>
}

function Objectives({ sessions, onEdit }) {
  const sorted = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date))
  return <section><p className="text-sm font-medium text-sky-600">Cap sur la progression</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Mes objectifs</h1><p className="mt-2 text-sm text-slate-600">Consultez et modifiez l’objectif de chaque séance.</p>{sorted.length ? <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 bg-white">{sorted.map((session) => <div key={session.id} className="flex items-start justify-between gap-4 px-4 py-4"><div><p className="text-xs font-semibold uppercase text-sky-600">{formatDate(session.session_date)} · {session.session_type}</p><p className="mt-2 text-sm text-slate-700">{session.objective || <span className="text-slate-400">Aucun objectif défini.</span>}</p></div><button type="button" onClick={() => onEdit(session)} aria-label={`Modifier l’objectif de ${session.session_type}`} className="rounded-xl border border-slate-200 p-2 text-slate-600"><Pencil className="h-4 w-4" /></button></div>)}</div> : <Empty text="Les objectifs apparaîtront ici avec vos séances." />}</section>
}

function SessionList({ sessions, onEditObjective, onEditSession }) {
  if (!sessions.length) return <Empty text="Aucune séance enregistrée." />
  return <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 bg-white">{sessions.map((session) => <div key={session.id} className="flex items-start justify-between gap-4 px-4 py-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-sky-600">{formatDate(session.session_date)} · {session.session_type}</p><p className="mt-2 text-sm text-slate-700">{session.objective || session.notes || 'Aucun objectif ou note renseigné.'}</p><p className="mt-2 text-xs text-slate-500">{session.duration_minutes ? `${session.duration_minutes} min` : 'Durée non renseignée'}{session.load ? ` · Charge ${session.load}` : ''}</p></div>{onEditSession ? <button type="button" onClick={() => onEditSession(session)} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Modifier la séance"><Pencil className="h-4 w-4" /></button> : <button type="button" onClick={() => onEditObjective(session)} className="rounded-xl border border-slate-200 p-2 text-slate-600" aria-label="Modifier l’objectif"><Pencil className="h-4 w-4" /></button>}</div>)}</div>
}

function SessionModal({ session, saving, onSubmit, onClose, onDelete }) {
  return <Modal title={session.id ? 'Modifier la séance' : 'Planifier une séance'} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><label className="block text-sm font-medium">Type de séance<input name="session_type" required maxLength="100" defaultValue={session.session_type || ''} className={`mt-1 ${inputClass}`} placeholder="Ex. Renforcement, endurance" /></label><label className="block text-sm font-medium">Date<input name="session_date" required type="date" min={today} defaultValue={session.session_date || today} className={`mt-1 ${inputClass}`} /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium">Durée (min)<input name="duration_minutes" type="number" min="1" max="1440" defaultValue={session.duration_minutes ?? ''} className={`mt-1 ${inputClass}`} /></label><label className="block text-sm font-medium">Charge<input name="load" type="number" min="0" defaultValue={session.load ?? ''} className={`mt-1 ${inputClass}`} /></label></div><label className="block text-sm font-medium">Objectif<textarea name="objective" rows="3" maxLength="1000" defaultValue={session.objective || ''} className={`mt-1 resize-y ${inputClass}`} /></label><label className="block text-sm font-medium">Notes<textarea name="notes" rows="2" maxLength="2000" defaultValue={session.notes || ''} className={`mt-1 resize-y ${inputClass}`} /></label><div className="flex justify-between border-t pt-4">{session.id && <button type="button" disabled={saving} onClick={onDelete} className="inline-flex items-center gap-2 text-sm text-rose-700"><Trash2 className="h-4 w-4" />Supprimer</button>}<div className="ml-auto flex gap-2"><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">Annuler</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></div></form></Modal>
}

function ObjectiveModal({ session, saving, onSubmit, onClose }) {
  return <Modal title="Modifier l’objectif" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><p className="text-sm text-slate-600">{session.session_type} · {formatDate(session.session_date)}</p><label className="block text-sm font-medium">Objectif de la séance<textarea name="objective" autoFocus rows="5" maxLength="1000" defaultValue={session.objective || ''} className={`mt-1 resize-y ${inputClass}`} /></label><div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 text-sm">Annuler</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></form></Modal>
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="athlete-modal-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-xl sm:rounded-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 id="athlete-modal-title" className="text-lg font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Fermer"><X className="h-5 w-5" /></button></div>{children}</section></div>
}

function Empty({ children, text }) { return <p className="mt-4 border-y border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">{text || children}</p> }
function dateString(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function formatDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
function formatDuration(value) { const hours = Math.floor(value / 60); const remaining = value % 60; return hours ? `${hours} h${remaining ? ` ${remaining} min` : ''}` : `${remaining} min` }
function formatDurationSeconds(value) { const seconds = Number(value) || 0; const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours} h ${minutes} min` : `${minutes} min` }
function formatDistance(value) { return `${(Number(value) / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km` }
function formatPace(value) { const seconds = Number(value) || 0; return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }

export default AthleteDashboardExperience