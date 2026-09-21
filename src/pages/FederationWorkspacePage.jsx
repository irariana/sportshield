import { useEffect, useState } from 'react'
import { Building2, Database, LogOut, MailPlus, Plus, Settings, Shield, Users, Watch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAuthenticatedUser, getCurrentProfile, getFederationForCurrentUser, getFederationInvitations, getFederationMembers, inviteFederationMember } from '../lib/federationApi'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const sections = [
  { label: 'Vue d’ensemble', icon: Building2 },
  { label: 'Sportifs', icon: Users },
  { label: 'Utilisateurs', icon: Shield },
  { label: 'Capteurs', icon: Watch },
  { label: 'Données', icon: Database },
]

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'

function FederationWorkspacePage() {
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [federation, setFederation] = useState(null)
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [activeSection, setActiveSection] = useState('Vue d’ensemble')
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [message, setMessage] = useState('')

  function handleSectionChange(label) {
    if (label === 'Sportifs') {
      navigate('/federation/athletes')
      return
    }
    setActiveSection(label)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      navigate('/login', { replace: true })
      return
    }

    async function loadWorkspace() {
      const userResult = await getAuthenticatedUser()
      if (userResult.error || !userResult.data.user) {
        navigate('/login', { replace: true })
        return
      }

      const profileResult = await getCurrentProfile()
      if (profileResult.error || profileResult.data?.status === 'inactif') {
        await supabase.auth.signOut()
        navigate('/login', { replace: true })
        return
      }
      const federationResult = await getFederationForCurrentUser()
      if (!federationResult.data) {
        navigate('/federation/setup', { replace: true })
        return
      }

      const membersResult = await getFederationMembers()
      const invitationsResult = await getFederationInvitations()
      if (membersResult.error || invitationsResult.error) {
        setMessage(membersResult.error?.message || invitationsResult.error?.message || 'Impossible de charger les membres et invitations.')
      }
      setAccount(profileResult.data)
      setFederation(federationResult.data)
      setMembers(membersResult.data ?? [])
      setInvitations(invitationsResult.data ?? [])
      setIsLoading(false)
    }

    loadWorkspace()
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function handleAddMember(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const profile = await getCurrentProfile()
    if (!profile.data?.federation_id) return

    const { data: member, error } = await supabase.from('federation_members').insert({
      federation_id: profile.data.federation_id,
      full_name: data.get('full_name'),
      email: data.get('email'),
      role: 'sportif',
      sport: data.get('sport'),
      status: 'actif',
    }).select().single()
    if (error) {
      setMessage(error.message)
      return
    }
    setMembers((current) => [member, ...current])
    setModal(null)
    setMessage('Sportif ajouté à la fédération.')
  }

  async function handleInvite(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await inviteFederationMember({
      email: data.get('email'),
      role: data.get('role'),
    })
    if (result.error || result.data?.error) {
      let functionError = result.data?.error
      if (!functionError && result.error?.context?.json) {
        try {
          const errorPayload = await result.error.context.json()
          functionError = errorPayload?.error || errorPayload?.message
        } catch {
          // The response body may already have been consumed by the Supabase client.
        }
      }
      const status = result.error?.context?.status
      const networkError = status === 404
        ? 'La fonction d’invitation n’est pas déployée sur Supabase. Déployez « invite-member », puis réessayez.'
        : status
          ? `${result.error.message} (HTTP ${status})`
          : result.error?.message
      setMessage(functionError || networkError || 'Impossible d’envoyer l’invitation.')
      return
    }
    setInvitations((current) => [result.data.data, ...current])
    setModal(null)
    setMessage('Invitation envoyée. Elle sera valable 7 jours et l’accès restera bloqué avant activation.')
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Chargement de votre fédération...</div>

  if (account?.role !== 'admin') {
    return <MemberWorkspace account={account} federation={federation} onLogout={handleLogout} />
  }

  const counts = {
    sportifs: members.filter((member) => member.role === 'sportif').length,
    utilisateurs: members.filter((member) => member.role !== 'sportif').length,
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex">
          <div className="mb-10 flex items-center gap-3 px-2">{federation.logo_url ? <img src={federation.logo_url} alt="" className="h-10 w-10 rounded-xl bg-white object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Building2 className="h-5 w-5" /></div>}<div className="min-w-0"><p className="truncate text-lg font-semibold text-white">{federation.name}</p><p className="text-xs text-slate-400">Espace administrateur</p></div></div>
          <nav className="space-y-1">{sections.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => handleSectionChange(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${activeSection === label ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">{activeSection}</h1></div><div className="flex items-center justify-between gap-3 sm:justify-end"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">{federation.logo_url ? <img src={federation.logo_url} alt="" className="h-9 w-9 rounded-full bg-white object-contain" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Shield className="h-4 w-4" /></div>}<div><p className="text-sm font-semibold text-slate-900">{account.full_name}</p><p className="text-xs text-slate-500">Administrateur</p></div></div><button type="button" onClick={handleLogout} aria-label="Déconnexion" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900"><LogOut className="h-4 w-4" /></button></div></header>

          <div className="p-5 sm:p-8">
            <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">{sections.map(({ label }) => <button key={label} type="button" onClick={() => handleSectionChange(label)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${activeSection === label ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}>{label}</button>)}</div>
            {message && <p className="mb-5 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</p>}
            {activeSection === 'Vue d’ensemble' ? <Overview federation={federation} counts={counts} onConfigure={() => navigate('/federation/setup')} /> : <EmptySection title={activeSection} members={activeSection === 'Sportifs' ? members.filter((member) => member.role === 'sportif') : activeSection === 'Utilisateurs' ? members.filter((member) => member.role !== 'sportif') : []} invitations={activeSection === 'Utilisateurs' ? invitations : []} onAdd={activeSection === 'Sportifs' ? () => setModal('member') : undefined} onInvite={activeSection === 'Utilisateurs' ? () => setModal('invite') : undefined} />}
          </div>
        </main>
      </div>
      {modal === 'member' && <MemberModal onSubmit={handleAddMember} onClose={() => setModal(null)} />}
      {modal === 'invite' && <InviteModal onSubmit={handleInvite} onClose={() => setModal(null)} />}
    </div>
  )
}

function MemberWorkspace({ account, federation, onLogout }) {
  const roleLabels = { medecin: 'Médecin', entraineur: 'Entraîneur', sportif: 'Sportif' }
  return <div className="min-h-screen bg-slate-100 text-slate-800"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Shield className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{federation.name}</p><p className="text-xs text-slate-500">Espace {roleLabels[account.role] || account.role}</p></div></div><button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900" aria-label="Déconnexion"><LogOut className="h-4 w-4" /></button></header><main className="mx-auto max-w-4xl p-5 sm:p-8"><section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-300/40 sm:p-10"><p className="text-sm font-medium text-sky-300">Accès membre</p><h1 className="mt-3 text-3xl font-semibold">Bienvenue, {account.full_name}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Vous êtes connecté à {federation.name} avec les permissions de votre rôle. Les fonctions d’administration restent réservées à l’administrateur de la fédération.</p></section><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Votre rôle</p><p className="mt-3 text-xl font-semibold text-slate-900">{roleLabels[account.role] || account.role}</p><p className="mt-2 text-sm text-slate-500">Vos outils et données disponibles seront adaptés à ce rôle.</p></section></main></div>
}

function Overview({ federation, counts, onConfigure }) {
  return <div className="space-y-7"><section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-300/40 sm:p-9"><p className="flex items-center gap-2 text-sm font-medium text-sky-300"><Building2 className="h-4 w-4" />{federation.country}</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{federation.name}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Votre espace est créé. Vous pouvez maintenant centraliser les membres, sportifs, capteurs et données de cette fédération.</p><button type="button" onClick={onConfigure} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-sky-50"><Settings className="h-4 w-4" /> Modifier la fédération</button></section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Sportifs', counts.sportifs, Users], ['Utilisateurs', counts.utilisateurs, Shield], ['Capteurs', 0, Watch], ['Données', 0, Database]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon className="h-4 w-4 text-sky-600" /></div><p className="mt-5 text-3xl font-semibold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-400">Aucune donnée fictive</p></div>)}</section><section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Database className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-4 text-lg font-semibold text-slate-800">Votre espace métier est prêt</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Les tableaux de gestion seront alimentés uniquement par les membres et les données que vous ajouterez.</p></section></div>
}

function EmptySection({ title, members, invitations, onAdd, onInvite }) {
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Gestion</p><h2 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm text-slate-500">Gérez les personnes rattachées à votre fédération.</p></div><div className="flex gap-2">{onAdd && <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500"><Plus className="h-4 w-4" /> Ajouter</button>}{onInvite && <button type="button" onClick={onInvite} className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100"><MailPlus className="h-4 w-4" /> Inviter</button>}</div></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nom / email</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Rôle</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sport / état</th></tr></thead><tbody>{members.length === 0 && invitations?.length === 0 ? <tr><td colSpan="3" className="px-5 py-16 text-center text-sm text-slate-400">Aucun élément à afficher pour le moment.</td></tr> : <>{members.map((member) => <tr key={member.id}><td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{member.full_name}</p><p className="text-xs text-slate-500">{member.email}</p></td><td className="px-5 py-4 text-sm text-slate-600">{member.role}</td><td className="px-5 py-4 text-sm text-slate-600">{member.sport || 'Actif'}</td></tr>)}{invitations?.map((invitation) => <tr key={invitation.id} className="bg-amber-50/40"><td className="px-5 py-4"><p className="text-sm font-medium text-slate-800">{invitation.email}</p><p className="text-xs text-amber-700">Invitation en attente jusqu’au {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</p></td><td className="px-5 py-4 text-sm text-slate-600">{invitation.role}</td><td className="px-5 py-4 text-sm text-amber-700">En attente d’activation</td></tr>)}</>}</tbody></table></div></div>
}

function MemberModal({ onSubmit, onClose }) {
  return <Modal title="Ajouter un sportif" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><input name="full_name" required placeholder="Nom complet" className={fieldClass} /><input name="email" type="email" required placeholder="Email" className={fieldClass} /><input name="sport" required placeholder="Sport" className={fieldClass} /><ModalActions /></form></Modal>
}

function InviteModal({ onSubmit, onClose }) {
  return <Modal title="Inviter un membre" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><p className="text-sm text-slate-500">La personne recevra un lien valable 7 jours et renseignera elle-même son profil et son mot de passe.</p><input name="email" type="email" required placeholder="Email professionnel" className={fieldClass} /><select name="role" required className={fieldClass}><option value="medecin">Médecin</option><option value="entraineur">Entraîneur</option><option value="sportif">Sportif avec compte</option></select><ModalActions submitLabel="Envoyer l’invitation" /></form></Modal>
}

function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 px-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-xl font-semibold text-slate-900">{title}</h3><button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">Fermer</button></div><div className="mt-5">{children}</div></div></div> }
function ModalActions({ submitLabel = 'Ajouter' }) { return <div className="flex justify-end gap-3 pt-2"><button type="submit" className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">{submitLabel}</button></div> }

export default FederationWorkspacePage
