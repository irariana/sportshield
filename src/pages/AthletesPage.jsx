import { useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronRight, Plus, Search, Shield, UserRound, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { athleteStatusOptions, createMockAthlete, getMockAthletes, sportOptions } from '../lib/athletesMock'

const emptyForm = { firstName: '', lastName: '', birthDate: '', sport: '', discipline: '', club: '', status: '' }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100'
const statusClasses = { Actif: 'bg-emerald-50 text-emerald-700', 'En pause': 'bg-amber-50 text-amber-700', Blessé: 'bg-rose-50 text-rose-700', Inactif: 'bg-slate-100 text-slate-600' }

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
}

function AthleteAvatar({ athlete, large = false }) {
  return <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-sky-100 font-semibold text-sky-700 ${large ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm'}`}>{athlete.firstName[0]}{athlete.lastName[0]}</div>
}

function AthletesPage() {
  const navigate = useNavigate()
  const { athleteId } = useParams()
  const [athletes, setAthletes] = useState(getMockAthletes)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedAthlete = athletes.find((athlete) => athlete.id === athleteId)
  if (athleteId && selectedAthlete) return <AthleteDetail athlete={selectedAthlete} onBack={() => navigate('/federation/athletes')} />

  const visibleAthletes = athletes.filter((athlete) => `${athlete.firstName} ${athlete.lastName} ${athlete.id} ${athlete.club}`.toLowerCase().includes(search.toLowerCase()))

  function handleCreate(form) {
    setAthletes((current) => [createMockAthlete(form, current), ...current])
    setIsFormOpen(false)
  }

  return <PageShell>
    <div className="space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Gestion</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Sportifs</h1><p className="mt-2 text-sm text-slate-500">Centralisez les informations de base des sportifs de votre fédération.</p></div>
        <button type="button" onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-500"><Plus className="h-4 w-4" /> Ajouter un sportif</button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3"><Metric label="Sportifs" value={athletes.length} /><Metric label="Actifs" value={athletes.filter((athlete) => athlete.status === 'Actif').length} /><Metric label="Disciplines" value={new Set(athletes.map((athlete) => athlete.discipline)).size} /></section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><label className="relative block max-w-sm"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un sportif..." aria-label="Rechercher un sportif" className={`${inputClass} py-2.5 pl-9`} /></label></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Sportif', 'Identifiant', 'Sport / discipline', 'Club', 'Statut', 'Action'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleAthletes.length === 0 ? <tr><td colSpan="6" className="px-5 py-16 text-center text-sm text-slate-400">Aucun sportif ne correspond à votre recherche.</td></tr> : visibleAthletes.map((athlete) => <AthleteRow key={athlete.id} athlete={athlete} onOpen={() => navigate(`/federation/athletes/${athlete.id}`)} />)}</tbody></table></div></section>
    </div>
    {isFormOpen && <AthleteForm onClose={() => setIsFormOpen(false)} onSubmit={handleCreate} />}
  </PageShell>
}

function PageShell({ children }) {
  const navigate = useNavigate()
  const sections = ['Vue d’ensemble', 'Sportifs', 'Utilisateurs', 'Capteurs', 'Données']
  return <div className="min-h-screen bg-slate-100 text-slate-800"><div className="flex min-h-screen"><aside className="hidden w-72 flex-col bg-slate-950 px-4 py-6 text-slate-200 md:flex"><div className="mb-10 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><Shield className="h-5 w-5" /></div><div><p className="font-semibold text-white">SportShield</p><p className="text-xs text-slate-400">Espace administrateur</p></div></div><nav className="space-y-1">{sections.map((section) => <button key={section} type="button" onClick={() => section === 'Vue d’ensemble' ? navigate('/federation') : undefined} className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium ${section === 'Sportifs' ? 'bg-sky-500/20 text-white ring-1 ring-sky-400/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>{section}</button>)}</nav><div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-300">Périmètre sécurisé</p><p className="mt-2 text-sm text-slate-300">Données isolées de votre fédération.</p></div></aside><div className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">Espace fédération</p><h1 className="mt-1 text-xl font-semibold text-slate-900">Sportifs</h1></div><div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"><UserRound className="h-4 w-4 text-sky-600" /><span className="text-sm font-medium text-slate-700">Administrateur</span></div></header><div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div></div></div></div>
}

function Metric({ label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p></div> }

function AthleteRow({ athlete, onOpen }) { return <tr><td className="px-5 py-4"><div className="flex items-center gap-3"><AthleteAvatar athlete={athlete} /><div><p className="text-sm font-semibold text-slate-800">{athlete.firstName} {athlete.lastName}</p><p className="text-xs text-slate-500">Né(e) le {formatDate(athlete.birthDate)}</p></div></div></td><td className="px-5 py-4 text-sm font-medium text-slate-600">{athlete.id}</td><td className="px-5 py-4"><p className="text-sm text-slate-700">{athlete.sport}</p><p className="text-xs text-slate-500">{athlete.discipline}</p></td><td className="px-5 py-4 text-sm text-slate-600">{athlete.club}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[athlete.status]}`}>{athlete.status}</span></td><td className="px-5 py-4"><button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-600">Voir la fiche <ChevronRight className="h-4 w-4" /></button></td></tr> }

function AthleteForm({ onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const disciplines = form.sport ? sportOptions[form.sport] || [] : []

  function updateField(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value, ...(name === 'sport' ? { discipline: '' } : {}) })); setErrors((current) => ({ ...current, [name]: '' })) }
  function submit(event) { event.preventDefault(); const nextErrors = {}; ['firstName', 'lastName', 'birthDate', 'sport', 'discipline', 'club', 'status'].forEach((field) => { if (!form[field].trim()) nextErrors[field] = 'Ce champ est obligatoire.' }); if (form.birthDate && (Number.isNaN(new Date(`${form.birthDate}T00:00:00`).getTime()) || form.birthDate > new Date().toISOString().slice(0, 10))) nextErrors.birthDate = 'Saisissez une date valide.'; if (Object.keys(nextErrors).length) { setErrors(nextErrors); return } onSubmit(form) }

  return <div className="fixed inset-0 z-30 overflow-y-auto bg-slate-950/60 px-4 py-8"><div role="dialog" aria-modal="true" aria-labelledby="athlete-form-title" className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Nouveau profil</p><h2 id="athlete-form-title" className="mt-2 text-2xl font-semibold text-slate-900">Ajouter un sportif</h2><p className="mt-2 text-sm text-slate-500">Renseignez les informations essentielles du sportif.</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><form onSubmit={submit} noValidate className="mt-7 space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Prénom" name="firstName" value={form.firstName} error={errors.firstName} onChange={updateField} /><Field label="Nom" name="lastName" value={form.lastName} error={errors.lastName} onChange={updateField} /><Field label="Date de naissance" name="birthDate" type="date" value={form.birthDate} error={errors.birthDate} onChange={updateField} /><SelectField label="Sport" name="sport" value={form.sport} options={Object.keys(sportOptions)} error={errors.sport} onChange={updateField} /><SelectField label="Discipline" name="discipline" value={form.discipline} options={disciplines} error={errors.discipline} onChange={updateField} disabled={!form.sport} /><Field label="Club" name="club" value={form.club} error={errors.club} onChange={updateField} /><SelectField label="Statut" name="status" value={form.status} options={athleteStatusOptions} error={errors.status} onChange={updateField} /></div><div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button><button type="submit" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:bg-sky-500">Créer le profil</button></div></form></div></div>
}

function Field({ label, name, type = 'text', value, error, onChange }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><span className="relative block"><input name={name} type={type} value={value} onChange={onChange} className={`${inputClass} ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`} aria-invalid={Boolean(error)} />{type === 'date' && <CalendarDays className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />}</span>{error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}</label> }
function SelectField({ label, name, value, options, error, onChange, disabled = false }) { return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><select name={name} value={value} onChange={onChange} disabled={disabled} className={`${inputClass} ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''} disabled:cursor-not-allowed disabled:opacity-50`} aria-invalid={Boolean(error)}><option value="">Sélectionner</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}</label> }

function AthleteDetail({ athlete, onBack }) { return <PageShell><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-600"><ArrowLeft className="h-4 w-4" /> Retour aux sportifs</button><div className="mt-6 flex flex-col gap-6 lg:flex-row"><section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-center gap-4"><AthleteAvatar athlete={athlete} large /><div><p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Fiche sportif</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">{athlete.firstName} {athlete.lastName}</h1><p className="mt-1 text-sm text-slate-500">{athlete.id}</p></div><span className={`ml-auto rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[athlete.status]}`}>{athlete.status}</span></div><dl className="mt-8 grid gap-5 border-t border-slate-200 pt-7 sm:grid-cols-2">{[['Date de naissance', formatDate(athlete.birthDate)], ['Sport', athlete.sport], ['Discipline', athlete.discipline], ['Club', athlete.club]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-800">{value}</dd></div>)}</dl></section><aside className="w-full space-y-3 lg:max-w-xs"><p className="text-sm font-semibold text-slate-800">Espaces de suivi</p>{['Performance', 'Entraînement', 'Récupération', 'Santé', 'Capteurs'].map((section) => <div key={section} className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4"><p className="text-sm font-medium text-slate-700">{section}</p><p className="mt-1 text-xs text-slate-400">Disponible prochainement</p></div>)}</aside></div></PageShell> }

export default AthletesPage