import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, CalendarDays, ChevronRight, Database, Edit3, History, LogOut, Plus, Search, Shield, UserCog, Users, Watch, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuthenticatedUser, getCurrentProfile, getFederationForCurrentUser, inviteFederationMember } from '../lib/federationApi'
import { supabase } from '../lib/supabase'
import FederationShell from '../components/FederationShell'

const emptyForm = { firstName: '', lastName: '', email: '', birthDate: '', sport: '', discipline: '', club: '', status: '' }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'
const statusClasses = { Actif: 'bg-emerald-50 text-emerald-700', 'En pause': 'bg-amber-50 text-amber-700', Blessé: 'bg-rose-50 text-rose-700', Inactif: 'bg-slate-100 text-slate-600' }
const athleteStatusOptions = ['Actif', 'En pause', 'Blessé', 'Inactif']
const sportOptions = { Natation: ['Natation course', 'Eau libre'], Athlétisme: ['Sprint', '100 m', '200 m', '400 m'] }

const statusLabels = { actif: 'Actif', en_pause: 'En pause', blesse: 'Blessé', inactif: 'Inactif' }

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts.shift() || 'Sportif', lastName: parts.join(' ') || '-' }
}

function toAthlete(profile) {
  const name = splitName(profile.full_name)
  const details = profile.athlete_profiles?.[0] || profile.athlete_profiles || {}
  return {
    id: profile.id,
    ...name,
    birthDate: details.birth_date || '',
    sport: profile.sport || '',
    discipline: details.discipline || profile.sport || '',
    club: details.club || '',
    status: statusLabels[details.athlete_status] || statusLabels[profile.status] || 'Actif',
  }
}

function toCoach(profile) {
  const name = splitName(profile.full_name)
  return { id: profile.id, ...name, sport: profile.sport || '', specialty: profile.sport || '' }
}

function toAssignment(row) {
  return { id: row.id, athleteId: row.athlete_id, coachId: row.coach_id, assignedAt: row.assigned_at, endedAt: row.ended_at }
}

function formatDate(value) {
  if (!value) return 'Non renseignée'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
}

function AthleteAvatar({ athlete, large = false }) {
  return <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-sky-100 font-semibold text-sky-700 ${large ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm'}`}>{athlete.firstName?.[0]}{athlete.lastName?.[0]}</div>
}

function AthletesPage() {
  const navigate = useNavigate()
  const { athleteId } = useParams()
  const [account, setAccount] = useState(null)
  const [federation, setFederation] = useState(null)
  const [athletes, setAthletes] = useState([])
  const [coaches, setCoaches] = useState([])
  const [assignments, setAssignments] = useState([])
  const [assignmentHistory, setAssignmentHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [assignmentAthleteId, setAssignmentAthleteId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isMounted = true
    let channel
    const refreshInterval = window.setInterval(() => {
      if (isMounted) loadData()
    }, 10000)

    async function loadData() {
      const userResult = await getAuthenticatedUser()
      const profileResult = await getCurrentProfile()
      const federationResult = await getFederationForCurrentUser()
      if (userResult.error || !userResult.data?.user || profileResult.error || federationResult.error || !federationResult.data) {
        if (isMounted) {
          setLoadError(userResult.error?.message || profileResult.error?.message || federationResult.error?.message || 'Impossible de charger les sportifs.')
          setIsLoading(false)
        }
        return
      }

      const [profilesResult, athleteProfilesResult, coachesResult, assignmentsResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, status, sport').eq('federation_id', federationResult.data.id).eq('role', 'sportif').order('full_name'),
        supabase.from('athlete_profiles').select('profile_id, birth_date, discipline, club, athlete_status').eq('federation_id', federationResult.data.id),
        supabase.from('profiles').select('id, full_name, sport').eq('federation_id', federationResult.data.id).eq('role', 'entraineur').order('full_name'),
        supabase.from('coach_athlete_assignments').select('id, coach_id, athlete_id, assigned_at, ended_at').eq('federation_id', federationResult.data.id).order('assigned_at', { ascending: false }),
      ])
      const error = profilesResult.error || athleteProfilesResult.error || coachesResult.error || assignmentsResult.error
      if (isMounted) {
        if (error) setLoadError(error.message)
        setAccount(profileResult.data)
        setFederation(federationResult.data)
        const athleteProfilesById = new Map((athleteProfilesResult.data || []).map((profile) => [profile.profile_id, profile]))
        setAthletes((profilesResult.data || []).map((profile) => toAthlete({ ...profile, athlete_profiles: athleteProfilesById.get(profile.id) })))
        setCoaches((coachesResult.data || []).map(toCoach))
        const rows = (assignmentsResult.data || []).map(toAssignment)
        setAssignments(rows.filter((assignment) => !assignment.endedAt))
        setAssignmentHistory(rows)
        setIsLoading(false)
        if (!channel) {
          const refresh = () => { if (isMounted) loadData() }
          channel = supabase.channel(`athletes-page-${federationResult.data.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `federation_id=eq.${federationResult.data.id}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'athlete_profiles', filter: `federation_id=eq.${federationResult.data.id}` }, refresh)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_athlete_assignments', filter: `federation_id=eq.${federationResult.data.id}` }, refresh)
            .subscribe()
          }
      }
    }

    loadData()
    return () => { isMounted = false; window.clearInterval(refreshInterval); if (channel) supabase.removeChannel(channel) }
  }, [])

  const viewRole = account?.role === 'entraineur' ? { role: 'coach', coachId: account.id, account, federation } : { role: 'admin', account, federation }

  const selectedAthlete = athletes.find((athlete) => athlete.id === athleteId && (viewRole.role === 'admin' || assignments.some((assignment) => assignment.athleteId === athlete.id)))
  if (athleteId && selectedAthlete) {
    const detailCoach = coaches.find((coach) => coach.id === assignments.find((assignment) => assignment.athleteId === selectedAthlete.id)?.coachId)
    return <><AthleteDetail account={account} athlete={selectedAthlete} coach={detailCoach} coaches={coaches} assignments={assignments} assignmentHistory={assignmentHistory} canEdit={viewRole.role === 'admin'} viewRole={viewRole} onAssign={() => setAssignmentAthleteId(selectedAthlete.id)} onBack={() => navigate('/federation/athletes')} onLogout={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }} />{assignmentAthleteId && <AssignmentModal athlete={selectedAthlete} coaches={coaches} currentCoach={detailCoach} onClose={() => setAssignmentAthleteId(null)} onSubmit={(coachId) => handleAssignment(selectedAthlete.id, coachId)} />}</>
  }

  const scopedAthletes = viewRole.role === 'coach' ? athletes.filter((athlete) => assignments.find((assignment) => assignment.athleteId === athlete.id)?.coachId === viewRole.coachId) : athletes
  const visibleAthletes = scopedAthletes.filter((athlete) => `${athlete.firstName} ${athlete.lastName} ${athlete.id} ${athlete.club}`.toLowerCase().includes(search.toLowerCase()))
  async function handleAssignment(athleteIdToAssign, coachId) {
    const current = assignments.find((assignment) => assignment.athleteId === athleteIdToAssign)
    if (current?.coachId === coachId) return { error: 'Ce sportif est déjà affecté à cet entraîneur.' }
    const assignedAt = new Date().toISOString().slice(0, 10)
    if (current) {
      const { error } = await supabase.from('coach_athlete_assignments').update({ ended_at: assignedAt }).eq('id', current.id)
      if (error) return { error: error.message }
    }
    const federation = await getFederationForCurrentUser()
    if (federation.error || !federation.data) return { error: federation.error?.message || 'Fédération introuvable.' }
    const { data, error } = await supabase.from('coach_athlete_assignments').insert({ federation_id: federation.data.id, coach_id: coachId, athlete_id: athleteIdToAssign, assigned_at: assignedAt }).select('id, coach_id, athlete_id, assigned_at, ended_at').single()
    if (error) return { error: error.message }
    const nextAssignment = toAssignment(data)
    setAssignments((currentAssignments) => [nextAssignment, ...currentAssignments.filter((item) => item.id !== current?.id)])
    setAssignmentHistory((currentHistory) => [nextAssignment, ...currentHistory])
    setAssignmentAthleteId(null)
    return { data: nextAssignment }
  }

  async function handleAthleteInvite(form) {
    const result = await inviteFederationMember({
      email: form.email,
      role: 'sportif',
    })
    if (result.error || result.data?.error) return { error: result.data?.error || result.error?.message || 'Impossible d’envoyer l’invitation.' }
    setIsFormOpen(false)
    setActionMessage(`Invitation envoyée à ${form.email}. Le sportif pourra créer son compte depuis le lien reçu par email.`)
    return { data: result.data?.data }
  }

  const assignmentAthlete = athletes.find((athlete) => athlete.id === assignmentAthleteId)
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Chargement des sportifs...</div>
  if (loadError || !account?.federation_id) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-5 text-center text-sm text-rose-700"><p>{loadError || 'Votre compte n’est pas encore rattaché à une fédération.'}</p><button type="button" onClick={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }} className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">Retour à la connexion</button></div>
  const handleSectionChange = (label) => {
    const paths = { 'Vue d’ensemble': '/federation', Sportifs: '/federation/athletes', Utilisateurs: '/federation?section=Utilisateurs', Capteurs: '/federation?section=Capteurs', Données: '/federation?section=Données' }
    navigate(paths[label])
  }
  return <FederationShell account={account} federation={federation} activeSection="Sportifs" onSectionChange={handleSectionChange} onLogout={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }}>
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{viewRole.role === 'coach' ? 'Mon périmètre' : 'Gestion'}</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Sportifs</h1><p className="mt-2 text-sm text-slate-500">{viewRole.role === 'coach' ? 'Consultez uniquement les sportifs qui vous sont affectés.' : 'Centralisez les informations et les entraîneurs des sportifs de votre fédération.'}</p></div>
        {viewRole.role === 'admin' && <button type="button" onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500"><Plus className="h-4 w-4" /> Ajouter un sportif</button>}
      </header>

      <section className="grid gap-4 sm:grid-cols-3"><Metric label={viewRole.role === 'coach' ? 'Sportifs suivis' : 'Sportifs'} value={scopedAthletes.length} /><Metric label="Actifs" value={scopedAthletes.filter((athlete) => athlete.status === 'Actif').length} /><Metric label="Avec entraîneur" value={scopedAthletes.filter((athlete) => assignments.some((assignment) => assignment.athleteId === athlete.id)).length} /></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><label className="relative block max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un sportif..." aria-label="Rechercher un sportif" className={`${inputClass} py-2.5 pl-9`} /></label></div><div className="overflow-x-auto"><table className="min-w-[930px] w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Sportif', 'Identifiant', 'Sport / discipline', 'Club', 'Entraîneur', 'Statut', 'Action'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleAthletes.length === 0 ? <tr><td colSpan="7" className="px-5 py-16 text-center text-sm text-slate-400">Aucun sportif ne correspond à votre recherche.</td></tr> : visibleAthletes.map((athlete) => <AthleteRow key={athlete.id} athlete={athlete} coach={coaches.find((coach) => coach.id === assignments.find((assignment) => assignment.athleteId === athlete.id)?.coachId)} canEdit={viewRole.role === 'admin'} onAssign={() => setAssignmentAthleteId(athlete.id)} onOpen={() => navigate(`/federation/athletes/${athlete.id}`)} />)}</tbody></table></div></section>
      {actionMessage && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionMessage}</p>}
      {viewRole.role === 'admin' && <AssignmentHistory history={assignmentHistory} athletes={athletes} coaches={coaches} />}
    </div>
    {isFormOpen && <AthleteInviteModal onClose={() => setIsFormOpen(false)} onSubmit={handleAthleteInvite} />}
    {assignmentAthlete && <AssignmentModal athlete={assignmentAthlete} coaches={coaches} currentCoach={coaches.find((coach) => coach.id === assignments.find((assignment) => assignment.athleteId === assignmentAthlete.id)?.coachId)} onClose={() => setAssignmentAthleteId(null)} onSubmit={(coachId) => handleAssignment(assignmentAthlete.id, coachId)} />}
  </FederationShell>
}

function OldPageShell({ children }) {
  const navigate = useNavigate()
  const sections = [
    { label: 'Vue d’ensemble', icon: Building2, path: '/federation' },
    { label: 'Sportifs', icon: Users, path: '/federation/athletes' },
    { label: 'Utilisateurs', icon: Shield, path: '/federation?section=Utilisateurs' },
    { label: 'Capteurs', icon: Watch, path: '/federation?section=Capteurs' },
    { label: 'Données', icon: Database, path: '/federation?section=Données' },
  ]

  return <div className="min-h-screen bg-slate-100 text-slate-800"><div className="flex min-h-screen"><aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex"><div className="mb-10 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Espace fédération</p></div></div><nav className="space-y-1">{sections.map(({ label, icon: Icon, path }) => <button key={label} type="button" onClick={() => navigate(path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${label === 'Sportifs' ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav><div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div></aside><div className="min-w-0 flex-1"><header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">Sportifs</h1></div><div className="flex gap-2 overflow-x-auto md:hidden">{sections.map(({ label, icon: Icon, path }) => <button key={label} type="button" onClick={() => navigate(path)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${label === 'Sportifs' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon className="h-4 w-4" />{label}</button>)}</div></header><div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div></div></div></div>
}

function UnusedPageShell({ children, account, onLogout, viewRole }) {
  const navigate = useNavigate()
  account = account || viewRole?.account
  onLogout = onLogout || (async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) })
  const sections = [
    { label: 'Vue d’ensemble', icon: Building2, path: '/federation' },
    { label: 'Sportifs', icon: Users, path: '/federation/athletes' },
    { label: 'Utilisateurs', icon: Shield, path: '/federation?section=Utilisateurs' },
    { label: 'Capteurs', icon: Watch, path: '/federation?section=Capteurs' },
    { label: 'Données', icon: Database, path: '/federation?section=Données' },
  ]
  const firstName = account?.full_name?.split(' ')[0] || 'Administrateur'

  return <div className="min-h-screen bg-slate-100 text-slate-800"><div className="flex min-h-screen"><aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex"><div className="mb-10 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Espace fédération</p></div></div><nav className="space-y-1">{sections.map(({ label, icon: Icon, path }) => <button key={label} type="button" onClick={() => navigate(path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${label === 'Sportifs' ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav><div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div></aside><div className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">Sportifs</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-900">{account?.full_name || 'Administrateur'}</p><p className="text-xs text-slate-500">Administrateur</p></div><div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">{firstName.slice(0, 1)}</div><button type="button" onClick={onLogout} aria-label="Déconnexion" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900"><LogOut className="h-4 w-4" /></button></div></header><div className="flex gap-2 overflow-x-auto px-5 pt-4 md:hidden">{sections.map(({ label, icon: Icon, path }) => <button key={label} type="button" onClick={() => navigate(path)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${label === 'Sportifs' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}><Icon className="h-4 w-4" />{label}</button>)}</div><div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div></div></div></div>
}

function LegacyPageShell({ children, viewRole = { role: 'admin' }, coaches = [], onRoleChange = () => {} }) {
  const navigate = useNavigate()
  const sections = ['Vue d’ensemble', 'Sportifs', 'Utilisateurs', 'Capteurs', 'Données']
  const roleValue = viewRole.role === 'admin' ? 'admin' : `coach:${viewRole.coachId}`
  return <div className="min-h-screen bg-slate-100 text-slate-800"><div className="flex min-h-screen"><aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex"><div className="mb-10 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Espace administrateur</p></div></div><nav className="space-y-1">{sections.map((section) => <button key={section} type="button" onClick={() => section === 'Vue d’ensemble' ? navigate('/federation') : undefined} className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium ${section === 'Sportifs' ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>{section}</button>)}</nav><div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div></aside><div className="min-w-0 flex-1"><header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">Sportifs</h1></div><label className="flex items-center gap-2 text-xs font-medium text-slate-500"><UserCog className="h-4 w-4 text-sky-600" /><span className="sr-only">Aperçu du rôle</span><select aria-label="Aperçu du rôle" value={roleValue} onChange={(event) => { const [role, coachId] = event.target.value.split(':'); onRoleChange(role === 'admin' ? { role } : { role, coachId }) }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"><option value="admin">Administrateur</option>{coaches.map((coach) => <option key={coach.id} value={`coach:${coach.id}`}>Coach · {coach.firstName} {coach.lastName}</option>)}</select></label></header><div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div></div></div></div>
}

function PageShell({ children, viewRole, federation }) {
  const navigate = useNavigate()
  const paths = { 'Vue d’ensemble': '/federation', Sportifs: '/federation/athletes', Utilisateurs: '/federation?section=Utilisateurs', Capteurs: '/federation?section=Capteurs', Données: '/federation?section=Données' }
  return <FederationShell account={viewRole?.account} federation={federation || viewRole?.federation} activeSection="Sportifs" onSectionChange={(label) => navigate(paths[label])} onLogout={async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }}>{children}</FederationShell>
}

void LegacyPageShell
void UnusedPageShell
void OldPageShell

function Metric({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p></div> }

function AthleteRow({ athlete, coach, canEdit, onAssign, onOpen }) { return <tr><td className="px-5 py-4"><div className="flex items-center gap-3"><AthleteAvatar athlete={athlete} /><div><p className="text-sm font-semibold text-slate-800">{athlete.firstName} {athlete.lastName}</p><p className="text-xs text-slate-500">Né(e) le {formatDate(athlete.birthDate)}</p></div></div></td><td className="px-5 py-4 text-sm font-medium text-slate-600">{athlete.id}</td><td className="px-5 py-4"><p className="text-sm text-slate-700">{athlete.sport}</p><p className="text-xs text-slate-500">{athlete.discipline}</p></td><td className="px-5 py-4 text-sm text-slate-600">{athlete.club}</td><td className="px-5 py-4">{coach ? <><p className="text-sm font-medium text-slate-700">{coach.firstName} {coach.lastName}</p><p className="text-xs text-slate-500">{coach.specialty}</p></> : <span className="text-sm text-slate-400">Non affecté</span>}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[athlete.status]}`}>{athlete.status}</span></td><td className="px-5 py-4"><div className="flex flex-col items-start gap-2"><button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-600">Voir la fiche <ChevronRight className="h-4 w-4" /></button>{canEdit && <button type="button" onClick={onAssign} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><Edit3 className="h-3.5 w-3.5" />{coach ? 'Modifier l’affectation' : 'Affecter'}</button>}</div></td></tr> }

function AthleteInviteModal({ onClose, onSubmit }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    const result = await onSubmit({ email })
    setIsSubmitting(false)
    if (result?.error) setError(result.error)
  }

  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 px-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Nouveau sportif</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">Inviter un sportif</h2><p className="mt-2 text-sm text-slate-500">Le sportif complétera son profil et créera son mot de passe depuis le lien reçu par email.</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="mt-6 space-y-4"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email du sportif" className={inputClass} />{error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Envoi...' : 'Envoyer l’invitation'}</button></div></form></div></div>
}

function AthleteForm({ onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const disciplines = form.sport ? sportOptions[form.sport] || [] : []

  function updateField(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value, ...(name === 'sport' ? { discipline: '' } : {}) })); setErrors((current) => ({ ...current, [name]: '' })) }
  async function submit(event) { event.preventDefault(); const nextErrors = {}; ['firstName', 'lastName', 'birthDate', 'sport', 'discipline', 'club', 'status', 'email'].forEach((field) => { if (!form[field]?.trim()) nextErrors[field] = 'Ce champ est obligatoire.' }); if (form.birthDate && (Number.isNaN(new Date(`${form.birthDate}T00:00:00`).getTime()) || form.birthDate > new Date().toISOString().slice(0, 10))) nextErrors.birthDate = 'Saisissez une date valide.'; if (Object.keys(nextErrors).length) { setErrors(nextErrors); return } setIsSubmitting(true); setSubmitError(''); const result = await onSubmit(form); setIsSubmitting(false); if (result?.error) setSubmitError(result.error) }

  return <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-950/60 px-4 py-8"><div role="dialog" aria-modal="true" aria-labelledby="athlete-form-title" className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Nouveau profil</p><h2 id="athlete-form-title" className="mt-2 text-2xl font-semibold text-slate-900">Ajouter un sportif</h2><p className="mt-2 text-sm text-slate-500">Renseignez les informations essentielles du sportif.</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><form onSubmit={submit} noValidate className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Prénom" name="firstName" value={form.firstName} error={errors.firstName} onChange={updateField} /><Field label="Nom" name="lastName" value={form.lastName} error={errors.lastName} onChange={updateField} /><Field label="Email" name="email" type="email" value={form.email} error={errors.email} onChange={updateField} /><Field label="Date de naissance" name="birthDate" type="date" value={form.birthDate} error={errors.birthDate} onChange={updateField} /><SelectField label="Sport" name="sport" value={form.sport} options={Object.keys(sportOptions)} error={errors.sport} onChange={updateField} /><SelectField label="Discipline" name="discipline" value={form.discipline} options={disciplines} error={errors.discipline} onChange={updateField} disabled={!form.sport} /><Field label="Club" name="club" value={form.club} error={errors.club} onChange={updateField} /><SelectField label="Statut" name="status" value={form.status} options={athleteStatusOptions} error={errors.status} onChange={updateField} /></div>{submitError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>}<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Envoi en cours...' : 'Créer le sportif et envoyer l’invitation'}</button></div></form></div></div>
}

void AthleteForm

function Field({ label, name, type = 'text', value, error, onChange }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><span className="relative block"><input name={name} type={type} value={value} onChange={onChange} className={`${inputClass} ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`} aria-invalid={Boolean(error)} />{type === 'date' && <CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />}</span>{error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}</label> }
function SelectField({ label, name, value, options, error, onChange, disabled = false }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><select name={name} value={value} onChange={onChange} disabled={disabled} className={`${inputClass} ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''} disabled:cursor-not-allowed disabled:opacity-50`} aria-invalid={Boolean(error)}><option value="">Sélectionner</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}</label> }

function AthleteDetail({ athlete, coach, assignmentHistory, canEdit, viewRole, coaches, onRoleChange, onAssign, onBack }) { return <PageShell viewRole={viewRole} coaches={coaches} onRoleChange={onRoleChange}><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-600"><ArrowLeft className="h-4 w-4" /> Retour aux sportifs</button><div className="mt-6 flex flex-col gap-6 lg:flex-row"><section className="min-w-0 flex-1 space-y-6"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center gap-4"><AthleteAvatar athlete={athlete} large /><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Fiche sportif</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">{athlete.firstName} {athlete.lastName}</h1><p className="mt-1 text-sm text-slate-500">{athlete.id}</p></div><span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[athlete.status]}`}>{athlete.status}</span></div><dl className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2">{[['Date de naissance', formatDate(athlete.birthDate)], ['Sport', athlete.sport], ['Discipline', athlete.discipline], ['Club', athlete.club]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-800">{value}</dd></div>)}</dl></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Encadrement</p><h2 className="mt-2 text-xl font-semibold text-slate-900">Entraîneur</h2></div>{canEdit && <button type="button" onClick={onAssign} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"><Edit3 className="h-4 w-4" /> {coach ? 'Modifier' : 'Affecter'}</button>}</div>{coach ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sm font-semibold text-sky-700">{coach.firstName[0]}{coach.lastName[0]}</div><div><p className="text-sm font-semibold text-slate-800">{coach.firstName} {coach.lastName}</p><p className="text-xs text-slate-500">{coach.sport} · {coach.specialty}</p></div></div> : <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucun entraîneur affecté.</p>}</section><HistoryPanel history={assignmentHistory.filter((item) => item.athleteId === athlete.id)} coaches={coaches} /></section><aside className="w-full space-y-3 lg:max-w-xs"><p className="text-sm font-semibold text-slate-800">Espaces de suivi</p>{['Performance', 'Entraînement', 'Récupération', 'Santé', 'Capteurs'].map((section) => <div key={section} className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4"><p className="text-sm font-medium text-slate-700">{section}</p><p className="mt-1 text-xs text-slate-400">Disponible prochainement</p></div>)}</aside></div></PageShell> }

function AssignmentHistory({ history, athletes, coaches }) { return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><History className="h-4 w-4 text-sky-600" /><h2 className="text-lg font-semibold text-slate-900">Historique des affectations</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2">{history.slice(0, 4).map((item) => <HistoryItem key={item.id} item={item} athlete={athletes.find((athlete) => athlete.id === item.athleteId)} coaches={coaches} />)}</div></section> }
function HistoryPanel({ history, coaches }) { return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><History className="h-4 w-4 text-sky-600" /><h2 className="text-lg font-semibold text-slate-900">Historique des affectations</h2></div><div className="mt-4 space-y-3">{history.length ? history.map((item) => <HistoryItem key={item.id} item={item} coaches={coaches} />) : <p className="text-sm text-slate-400">Aucun changement enregistré.</p>}</div></section> }
function HistoryItem({ item, athlete, coaches }) { const from = coaches.find((coach) => coach.id === item.fromCoachId); const to = coaches.find((coach) => coach.id === item.toCoachId); return <div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-medium text-slate-800">{athlete && `${athlete.firstName} ${athlete.lastName}`}</p><p className="mt-1 text-slate-600">{from?.firstName || 'Non affecté'} {from && from.lastName} <span className="px-1 text-sky-600">→</span> {to?.firstName} {to?.lastName}</p><p className="mt-1 text-xs text-slate-400">{formatDate(item.date)}</p></div> }

function AssignmentModal({ athlete, coaches, currentCoach, onClose, onSubmit }) { const [coachId, setCoachId] = useState(currentCoach?.id || ''); const [error, setError] = useState(''); function submit(event) { event.preventDefault(); if (!coachId) { setError('Sélectionnez un entraîneur.'); return } const result = onSubmit(coachId); if (result?.error) setError(result.error) } return <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-950/60 px-4 py-8"><div role="dialog" aria-modal="true" aria-labelledby="assignment-title" className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Encadrement</p><h2 id="assignment-title" className="mt-2 text-2xl font-semibold text-slate-900">{currentCoach ? 'Modifier l’affectation' : 'Affecter un entraîneur'}</h2></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Sportif</p><p className="mt-1 text-sm font-semibold text-slate-800">{athlete.firstName} {athlete.lastName}</p><p className="mt-1 text-xs text-slate-500">{athlete.sport} · {athlete.discipline}</p></div><form onSubmit={submit} className="mt-5 space-y-5"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Entraîneur</span><select value={coachId} onChange={(event) => { setCoachId(event.target.value); setError('') }} className={inputClass}><option value="">Sélectionner un entraîneur</option>{coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.firstName} {coach.lastName} · {coach.sport}</option>)}</select>{currentCoach && <span className="mt-2 block text-xs text-slate-500">Affectation actuelle : {currentCoach.firstName} {currentCoach.lastName}</span>}{error && <span className="mt-2 block text-xs text-rose-600">{error}</span>}</label><div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button><button type="submit" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500">{currentCoach ? 'Enregistrer' : 'Affecter'}</button></div></form></div></div> }

export default AthletesPage