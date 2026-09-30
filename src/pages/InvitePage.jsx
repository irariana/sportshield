import { useEffect, useState } from 'react'
import { CalendarDays, Check, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { resolveFederationSports } from '../lib/sports'

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'
const roleLabels = { medecin: 'Médecin', entraineur: 'Entraîneur', sportif: 'Sportif' }
const statusOptions = [{ value: 'actif', label: 'Actif' }, { value: 'en_pause', label: 'En pause' }, { value: 'blesse', label: 'Blessé' }, { value: 'inactif', label: 'Inactif' }]
const emptyForm = { fullName: '', sport: '', birthDate: '', club: '', status: 'actif', phone: '', password: '', passwordConfirmation: '' }

function InvitePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [sports, setSports] = useState(() => resolveFederationSports())
  const [invitationId, setInvitationId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    async function loadInvitation() {
      if (!isSupabaseConfigured) { setMessage('Supabase n’est pas configuré.'); setIsLoading(false); return }
      const rawHash = window.location.hash
      const tokenIndex = rawHash.indexOf('access_token=')
      if (tokenIndex !== -1) {
        const authParams = new URLSearchParams(rawHash.slice(tokenIndex))
        const accessToken = authParams.get('access_token')
        const refreshToken = authParams.get('refresh_token')
        if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      }
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) await supabase.auth.exchangeCodeForSession(code)
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session?.user) { setMessage('Ce lien d’invitation est invalide ou a expiré.'); setIsLoading(false); return }

      const metadata = data.session.user.user_metadata || {}
      const hashQuery = window.location.hash.split('?')[1] || ''
      let resolvedInvitationId = metadata.invitation_id || new URLSearchParams(hashQuery).get('invitation_id')
      let invitedRole = metadata.role
      let federationName = metadata.federation_name || ''
      let federationSports = resolveFederationSports(metadata.federation_sports)
      const currentContext = await supabase.rpc('get_current_federation_invitation_context')
      if (!currentContext.error && currentContext.data?.[0]) {
        const context = currentContext.data[0]
        resolvedInvitationId = context.id
        invitedRole = context.role
        federationName = context.federation_name || federationName
        federationSports = resolveFederationSports(context.federation_sports ?? metadata.federation_sports)
      }
      if (!invitedRole || !roleLabels[invitedRole] || !resolvedInvitationId) setMessage('Cette invitation est invalide ou ne contient pas de rôle.')
      else {
        setProfile({ role: invitedRole, federationName })
        setSports(federationSports)
        setInvitationId(resolvedInvitationId)
        setForm((current) => ({
          ...current,
          fullName: metadata.full_name || '',
          sport: federationSports.includes(metadata.sport) ? metadata.sport : '',
          birthDate: metadata.birth_date || '',
          club: metadata.club || '',
          status: metadata.athlete_status || 'actif',
        }))
      }
      setIsLoading(false)
    }
    loadInvitation()
  }, [])

  const isAthlete = profile?.role === 'sportif'

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!form.fullName.trim()) { setMessage('Renseignez votre prénom et votre nom.'); return }
    if (!form.sport) { setMessage('Sélectionnez votre sport parmi ceux de votre fédération.'); return }
    if (isAthlete && (!form.birthDate || !form.club.trim())) { setMessage('Remplissez tous les champs obligatoires du profil sportif.'); return }
    if (!form.password || form.password.length < 8) { setMessage('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (form.password !== form.passwordConfirmation) { setMessage('Les mots de passe ne correspondent pas.'); return }

    setIsSubmitting(true)
    const passwordResult = await supabase.auth.updateUser({ password: form.password })
    const passwordMessage = passwordResult.error?.message?.toLowerCase() || ''
    if (passwordResult.error && !passwordMessage.includes('different from the old password')) { setMessage(passwordResult.error.message); setIsSubmitting(false); return }

    const { error } = await supabase.rpc('accept_federation_invitation', {
      invitation_id: invitationId,
      member_name: form.fullName,
      member_sport: form.sport,
      member_phone: form.phone || null,
      member_birth_date: isAthlete ? form.birthDate : null,
      member_discipline: isAthlete ? form.sport : null,
      member_club: isAthlete ? form.club : null,
      member_athlete_status: isAthlete ? form.status : 'actif',
    })
    setIsSubmitting(false)
    if (error) { setMessage(error.message); return }
    navigate(isAthlete ? '/athlete' : '/federation', { replace: true })
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Vérification de votre invitation...</div>
  if (!profile) return <InviteMessage message={message} navigate={navigate} />

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10"><div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-10"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="text-lg font-semibold text-slate-900">SportShield</p><p className="text-sm text-slate-500">{profile.federationName || 'Activation de votre accès'}</p></div></div><p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Inscription {roleLabels[profile.role].toLowerCase()}</p><h1 className="mt-3 text-3xl font-semibold text-slate-900">Configurez votre profil</h1><p className="mt-3 text-sm leading-6 text-slate-500">Votre accès est limité au rôle <strong className="text-slate-700">{roleLabels[profile.role]}</strong>. {isAthlete ? 'Les informations seront enregistrées après validation complète.' : 'Les sports proposés correspondent aux paramètres de votre fédération.'}</p>{message && <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}<form onSubmit={handleSubmit} className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Prénom et nom" name="fullName" value={form.fullName} onChange={updateField} required /><SelectField label={isAthlete ? 'Sport' : 'Sport / spécialité'} name="sport" value={form.sport} options={sports} onChange={updateField} required />{isAthlete && <><Field label="Date de naissance" name="birthDate" type="date" value={form.birthDate} onChange={updateField} required /><Field label="Club" name="club" value={form.club} onChange={updateField} required /><SelectField label="Statut" name="status" value={form.status} options={statusOptions} onChange={updateField} required /></>}<Field label="Téléphone" name="phone" type="tel" value={form.phone} onChange={updateField} /></div><p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">Sports proposés par votre fédération&nbsp;: <strong className="text-slate-700">{sports.join(' · ')}</strong>.</p><div className="border-t border-slate-200 pt-5"><p className="text-sm font-semibold text-slate-800">Sécuriser votre compte</p><div className="mt-4 grid gap-5 sm:grid-cols-2"><Field label="Mot de passe" name="password" type="password" value={form.password} onChange={updateField} required /><Field label="Confirmer le mot de passe" name="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={updateField} required /></div></div><button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Activation...' : <><Check className="h-4 w-4" /> Finaliser mon inscription</>}</button></form></div></div>
}

function Field({ label, name, type = 'text', value, onChange, required = false }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><span className="relative block"><input name={name} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} required={required} className={fieldClass} />{type === 'date' && <CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />}</span></label>
}

function SelectField({ label, name, value, options, onChange, disabled = false, required = false }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><select name={name} value={value} onChange={(event) => onChange(name, event.target.value)} disabled={disabled} required={required} className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}><option value="">Sélectionner</option>{options.map((option) => { const optionValue = typeof option === 'string' ? option : option.value; const optionLabel = typeof option === 'string' ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option> })}</select></label>
}

function InviteMessage({ message, navigate }) {
  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-sky-600" /><p className="text-lg font-semibold text-slate-900">SportShield</p></div><p className="mt-8 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p><button type="button" onClick={() => navigate('/login')} className="mt-5 text-sm font-medium text-sky-700">Retour à la connexion</button></div></div>
}

export default InvitePage
