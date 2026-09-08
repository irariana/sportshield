import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield } from 'lucide-react'

const roles = [
  { id: 'admin', label: 'Admin', description: 'Fédération' },
  { id: 'entraineur', label: 'Entraîneur', description: 'Équipe' },
  { id: 'medecin', label: 'Médecin', description: 'Suivi' },
  { id: 'sportif', label: 'Sportif', description: 'Profil' },
]

function LoginPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('admin')

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/dashboard', { state: { role: selectedRole } })
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
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Connexion</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">Accéder à votre espace</h2>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
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
                    type="password"
                    defaultValue="********"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">Sélection du rôle</p>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={[
                          'rounded-2xl border px-3 py-3 text-left transition',
                          selectedRole === role.id
                            ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                        ].join(' ')}
                      >
                        <span className="block text-sm font-semibold">{role.label}</span>
                        <span className="mt-1 block text-xs text-slate-500">{role.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500"
                >
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
