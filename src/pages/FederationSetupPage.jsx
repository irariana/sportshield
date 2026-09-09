import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Check, ImagePlus, LogOut, Save, Trash2 } from 'lucide-react'
import { deleteFederationForCurrentUser, getAuthenticatedUser, getFederationForCurrentUser, saveFederationForCurrentUser } from '../lib/federationApi'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const emptyForm = { name: '', country: '', sports: [], logo: '' }
const availableSports = ['Football', 'Basketball', 'Athlétisme', 'Natation', 'Rugby', 'Tennis']

function FederationSetupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [isExisting, setIsExisting] = useState(false)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(() => (isSupabaseConfigured ? null : { type: 'error', text: 'Supabase n’est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.' }))
  const [showDelete, setShowDelete] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    async function loadFederation() {
      const userResult = await getAuthenticatedUser()
      if (userResult.error || !userResult.data.user) {
        navigate('/login', { replace: true })
        return
      }

      const federationResult = await getFederationForCurrentUser()
      if (federationResult.error) {
        setMessage({ type: 'error', text: federationResult.error.message })
      } else if (federationResult.data) {
        setForm({
          name: federationResult.data.name ?? '',
          country: federationResult.data.country ?? '',
          sports: federationResult.data.sports ?? [],
          logo: federationResult.data.logo_url ?? '',
        })
        setIsExisting(true)
      }
      setIsLoading(false)
    }

    loadFederation()
  }, [navigate])

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setMessage(null)
  }

  function toggleSport(sport) {
    setForm((current) => ({
      ...current,
      sports: current.sports.includes(sport)
        ? current.sports.filter((item) => item !== sport)
        : [...current.sports, sport],
    }))
    setMessage(null)
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      setMessage({ type: 'error', text: 'Le logo doit faire moins de 1 Mo.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, logo: reader.result }))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.country.trim() || form.sports.length === 0) {
      setMessage({ type: 'error', text: 'Renseignez le nom, le pays et au moins un sport.' })
      return
    }

    setIsSaving(true)
    setMessage(null)
    const result = await saveFederationForCurrentUser(form)
    setIsSaving(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error.message })
      return
    }

    setIsExisting(true)
    setMessage({ type: 'success', text: 'La fédération a été enregistrée.' })
    navigate('/federation', { replace: true })
  }

  async function handleDelete() {
    if (deleteName.trim() !== form.name || !deleteConfirmed) return

    setIsSaving(true)
    const result = await deleteFederationForCurrentUser()
    setIsSaving(false)
    if (result.error) {
      setMessage({ type: 'error', text: result.error.message })
      return
    }

    setForm(emptyForm)
    setIsExisting(false)
    setShowDelete(false)
    setDeleteName('')
    setDeleteConfirmed(false)
    setMessage({ type: 'success', text: 'La fédération a été supprimée. Vous pouvez en créer une nouvelle.' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Chargement de votre compte...</div>

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sky-300"><Building2 className="h-5 w-5" /></div>
            <div><p className="text-lg font-semibold text-slate-900">SportShield</p><p className="text-sm text-slate-500">Configuration de votre fédération</p></div>
          </div>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl shadow-slate-300/40 sm:p-9">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-sky-300">{isExisting ? 'Paramètres' : 'Première étape'}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{isExisting ? 'Modifiez votre espace fédération.' : 'Créez l’espace de votre fédération.'}</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">{isExisting ? 'Les informations enregistrées servent de référence pour tous les utilisateurs et les données de votre fédération.' : 'Commencez par définir l’identité de votre fédération. Les sportifs, utilisateurs, capteurs et données seront ensuite rattachés à cet espace isolé.'}</p>
            <div className="mt-10 space-y-4 text-sm text-slate-300"><p className="flex items-center gap-3"><Check className="h-4 w-4 text-sky-300" /> Un espace unique par fédération</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-sky-300" /> Données isolées par identifiant</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-sky-300" /> Informations modifiables à tout moment</p></div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <form className="space-y-7" onSubmit={handleSubmit}>
              <div><h2 className="text-2xl font-semibold text-slate-900">Informations générales</h2><p className="mt-2 text-sm text-slate-500">Ces informations seront visibles dans votre espace administrateur.</p></div>

              <div className="grid gap-6 sm:grid-cols-[150px_1fr]">
                <div><p className="text-sm font-medium text-slate-700">Logo</p><label htmlFor="federation-logo" className="mt-3 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-sky-400 hover:text-sky-600">{form.logo ? <img src={form.logo} alt="Logo de la fédération" className="h-full w-full object-contain p-3" /> : <span className="flex flex-col items-center gap-2 text-center text-xs"><ImagePlus className="h-6 w-6" /> Ajouter un logo</span>}</label><input id="federation-logo" type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} /></div>
                <div className="space-y-5"><div><label htmlFor="federation-name" className="mb-2 block text-sm font-medium text-slate-700">Nom de la fédération</label><input id="federation-name" name="name" value={form.name} onChange={handleChange} required placeholder="Ex. Fédération Française de Natation" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" /></div><div><label htmlFor="federation-country" className="mb-2 block text-sm font-medium text-slate-700">Pays</label><input id="federation-country" name="country" value={form.country} onChange={handleChange} required placeholder="Ex. France" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" /></div></div>
              </div>

              <fieldset><legend className="text-sm font-medium text-slate-700">Sports de la fédération</legend><p className="mt-1 text-sm text-slate-500">Sélectionnez au moins une discipline.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{availableSports.map((sport) => <label key={sport} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${form.sports.includes(sport) ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 hover:border-sky-300'}`}><input type="checkbox" checked={form.sports.includes(sport)} onChange={() => toggleSport(sport)} className="h-4 w-4 accent-sky-600" />{sport}</label>)}</div></fieldset>

              {message && <p className={`rounded-xl px-4 py-3 text-sm ${message.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{message.text}</p>}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between"><button type="button" onClick={() => setShowDelete(true)} disabled={!isExisting || isSaving} className="inline-flex items-center justify-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /> Supprimer la fédération</button><button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" /> {isSaving ? 'Enregistrement...' : isExisting ? 'Enregistrer les modifications' : 'Créer ma fédération'}</button></div>
            </form>
          </section>
        </div>
      </div>

      {showDelete && <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 px-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-semibold text-slate-900">Supprimer définitivement la fédération ?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Cette action supprime la fédération et toutes les données qui lui sont rattachées. Saisissez exactement son nom pour continuer.</p><input value={deleteName} onChange={(event) => setDeleteName(event.target.value)} placeholder={form.name} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100" /><label className="mt-4 flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />Je comprends que cette suppression est définitive.</label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowDelete(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Annuler</button><button type="button" onClick={handleDelete} disabled={deleteName.trim() !== form.name || !deleteConfirmed || isSaving} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Confirmer la suppression</button></div></div></div>}
    </div>
  )
}

export default FederationSetupPage
