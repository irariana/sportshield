import { useEffect, useState } from 'react'
import { Check, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCurrentProfile } from '../lib/federationApi'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'
const roleLabels = { medecin: 'Médecin', entraineur: 'Entraîneur', sportif: 'Sportif' }

function InvitePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage('Supabase n’est pas configuré.')
      setIsLoading(false)
      return
    }

    async function loadInvitation() {
      const rawHash = window.location.hash
      const tokenIndex = rawHash.indexOf('#access_token=')
      if (tokenIndex !== -1) {
        const authParams = new URLSearchParams(rawHash.slice(tokenIndex + 1))
        const accessToken = authParams.get('access_token')
        const refreshToken = authParams.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session?.user) {
        setMessage('Ce lien d’invitation est invalide ou a expiré. Demandez un nouvel email à votre administrateur.')
        setIsLoading(false)
        return
      }

      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data || profileResult.data.role === 'admin') {
        setMessage('Cette invitation ne peut pas être activée avec ce compte.')
      } else {
        setUser(data.session.user)
        setProfile(profileResult.data)
      }
      setIsLoading(false)
    }

    loadInvitation()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    const data = new FormData(event.currentTarget)
    if (data.get('password') !== data.get('password-confirmation')) {
      setMessage('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    const passwordResult = await supabase.auth.updateUser({ password: data.get('password') })
    if (passwordResult.error) {
      setMessage(passwordResult.error.message)
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.rpc('accept_federation_invitation', {
      invitation_id: user.user_metadata?.invitation_id,
      member_name: data.get('full-name'),
      member_sport: data.get('sport') || null,
      member_phone: data.get('phone') || null,
    })
    setIsSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }

    navigate('/federation', { replace: true })
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Vérification de votre invitation...</div>

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-10"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="text-lg font-semibold text-slate-900">SportShield</p><p className="text-sm text-slate-500">Activation de votre accès</p></div></div>{message ? <div className="mt-8"><p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p><button type="button" onClick={() => navigate('/login')} className="mt-5 text-sm font-medium text-sky-700 hover:text-sky-600">Retour à la connexion</button></div> : <><p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Invitation acceptée</p><h1 className="mt-3 text-3xl font-semibold text-slate-900">Complétez votre profil</h1><p className="mt-3 text-sm leading-6 text-slate-500">Votre accès est limité au rôle <strong className="text-slate-700">{roleLabels[profile.role] || profile.role}</strong>. L’administrateur ne voit pas vos informations avant leur validation.</p><form onSubmit={handleSubmit} className="mt-7 space-y-4"><input name="full-name" required placeholder="Nom complet" className={fieldClass} /><input name="sport" placeholder="Sport ou discipline" className={fieldClass} /><input name="phone" type="tel" placeholder="Téléphone (facultatif)" className={fieldClass} /><input name="password" type="password" minLength="8" required placeholder="Créer un mot de passe (8 caractères minimum)" className={fieldClass} /><input name="password-confirmation" type="password" minLength="8" required placeholder="Confirmer le mot de passe" className={fieldClass} /><button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Activation en cours...' : 'Activer mon accès'}<Check className="h-4 w-4" /></button></form></>}</div></div>
}

export default InvitePage
