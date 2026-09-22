import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, UserPlus } from 'lucide-react'
import { getCurrentProfile, getFederationForCurrentUser } from '../lib/federationApi'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function LoginPage() {
  const navigate = useNavigate()
  const [showRegistration, setShowRegistration] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    if (!isSupabaseConfigured) {
      setFormError('Supabase n’est pas configuré. Renseignez les variables du fichier .env.local.')
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    setIsSubmitting(false)
    if (error) {
      setFormError(error.message)
      return
    }

    const profileResult = await getCurrentProfile()
    if (profileResult.error) {
      setFormError(profileResult.error.message)
      return
    }

    if (profileResult.data?.status === 'inactif') {
      await supabase.auth.signOut()
      setFormError('Votre accès est bloqué jusqu’à l’activation de votre invitation.')
      return
    }

    const federationResult = await getFederationForCurrentUser()
    if (federationResult.error) {
      setFormError(federationResult.error.message)
      return
    }

    navigate(federationResult.data ? '/federation' : '/federation/setup')
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    if (!isSupabaseConfigured) {
      setFormError('Supabase n’est pas configuré. Renseignez les variables du fichier .env.local.')
      setIsSubmitting(false)
      return
    }

    const formData = new FormData(event.currentTarget)
    if (formData.get('admin-password') !== formData.get('admin-password-confirmation')) {
      setFormError('Les mots de passe ne correspondent pas.')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: formData.get('admin-email'),
      password: formData.get('admin-password'),
      options: {
        data: {
          full_name: formData.get('admin-name'),
          role: 'admin',
        },
      },
    })

    setIsSubmitting(false)
    if (error) {
      setFormError(error.message)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      setFormError('Compte créé. Vérifiez votre email pour activer votre accès, puis connectez-vous.')
      setShowRegistration(false)
      return
    }

    navigate('/federation/setup')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.25)]">
        <div className="grid min-h-[760px] md:grid-cols-2">
          <div className="flex flex-col justify-between bg-slate-950 p-8 text-white md:p-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold">SportShield</p>
                <p className="text-sm text-slate-300">Sports Data. Secured.</p>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-sky-300">
                Plateforme B2B
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
                La sécurité des données sportives au cœur de votre organisation.
              </h1>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-300">Protection des performances, suivi et conformité.</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-slate-300">
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xl font-semibold text-white">98%</p>
                  <p className="mt-1">Conformité</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xl font-semibold text-white">24/7</p>
                  <p className="mt-1">Surveillance</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3">
                  <p className="text-xl font-semibold text-white">3x</p>
                  <p className="mt-1">Efficacité</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              {showRegistration ? (
                <>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Inscription</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">Créer un compte administrateur</h2>

                  {formError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}

                  <form className="mt-8 space-y-5" onSubmit={handleRegistrationSubmit}>
                    <div>
                      <label htmlFor="admin-name" className="mb-2 block text-sm font-medium text-slate-700">
                        Nom complet
                      </label>
                      <input
                        id="admin-name"
                        name="admin-name"
                        type="text"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">
                        Email professionnel
                      </label>
                      <input
                        id="admin-email"
                        name="admin-email"
                        type="email"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">
                        Mot de passe
                      </label>
                      <input
                        id="admin-password"
                        name="admin-password"
                        type="password"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="admin-password-confirmation" className="mb-2 block text-sm font-medium text-slate-700">
                        Confirmer le mot de passe
                      </label>
                      <input
                        id="admin-password-confirmation"
                        name="admin-password-confirmation"
                        type="password"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500"
                    >
                      {isSubmitting ? 'Création en cours...' : 'Créer le compte'}
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistration(false)
                    }}
                    className="mt-5 w-full text-center text-sm font-medium text-slate-500 transition hover:text-sky-600"
                  >
                    Retour à la connexion
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Connexion</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">Accéder à votre espace</h2>

                  {formError && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>}

                  <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue="admin@sportshield.fr"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        defaultValue="********"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500"
                    >
                      {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setShowRegistration(true)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-600"
                  >
                    <UserPlus className="h-4 w-4" />
                    Créer un compte administrateur
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
