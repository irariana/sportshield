import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, Stethoscope, Users, AlertTriangle } from 'lucide-react'
import { StatTile, PageHeader, Badge, Button } from '../components/ui'
import { supabase } from '../lib/supabase'

export function MedecinDashboardPage({ federation, profile }) {
  const [athletes, setAthletes] = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [records, setRecords] = useState([])
  const [newNote, setNewNote] = useState('')
  const [availability, setAvailability] = useState('apte')

  useEffect(() => {
    loadAthletes()
  }, [federation])

  async function loadAthletes() {
    if (!federation) return
    const { data } = await supabase.from('athlete_profiles').select('*').eq('federation_id', federation.id)
    if (data) setAthletes(data)
  }

  async function selectAthlete(athlete) {
    setSelectedAthlete(athlete)
    const { data } = await supabase.from('medical_records').select('*').eq('athlete_id', athlete.id)
    if (data) setRecords(data)
  }

  async function handleAddRecord(e) {
    e.preventDefault()
    if (!selectedAthlete) return
    const { error } = await supabase.from('medical_records').insert({
      federation_id: federation.id,
      athlete_id: selectedAthlete.id,
      diagnosis: newNote,
      availability_status: availability
    })
    if (!error) {
      setNewNote('')
      selectAthlete(selectedAthlete)
    } else {
      alert('Erreur : ' + error.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Espace Médical Fédéral"
        description="Suivi de la santé, diagnostics et aptitudes des athlètes. (Réservé au corps médical)."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-md border border-[#E2E0D8] bg-white p-4">
          <h2 className="mb-4 text-lg font-bold font-['Barlow_Condensed'] text-[#14161A]">Sportifs Suivis</h2>
          <div className="space-y-2">
            {athletes.map(a => (
              <div
                key={a.id}
                onClick={() => selectAthlete(a)}
                className={`cursor-pointer rounded-md p-3 transition border ${selectedAthlete?.id === a.id ? 'border-[#E2522B] bg-[#E2522B]/5' : 'border-[#E2E0D8] hover:bg-[#F4F3EF]'}`}
              >
                <div className="font-semibold font-['Barlow_Condensed'] text-[#14161A]">{a.first_name} {a.last_name}</div>
                <div className="text-xs text-[#5B606B]">{a.sport} — {a.discipline || 'Général'}</div>
              </div>
            ))}
            {athletes.length === 0 && <p className="text-sm text-[#5B606B]">Aucun sportif trouvé.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-md border border-[#E2E0D8] bg-white p-6">
          {selectedAthlete ? (
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#E2E0D8] pb-4">
                <div>
                  <h2 className="text-xl font-bold font-['Barlow_Condensed'] text-[#14161A]">
                    Dossier Médical de {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </h2>
                  <p className="text-xs text-[#5B606B]">Accès strictement confidentiel — Médecin</p>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <h3 className="text-sm font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">Historique des diagnostics</h3>
                {records.map(r => (
                  <div key={r.id} className="rounded-md border border-[#E2E0D8] p-4 bg-[#F4F3EF]/30">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={r.availability_status === 'apte' ? 'success' : 'danger'}>
                        {r.availability_status}
                      </Badge>
                      <span className="text-xs text-[#5B606B] tabular-nums">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-[#14161A]">{r.diagnosis}</p>
                  </div>
                ))}
                {records.length === 0 && <p className="text-sm text-[#5B606B]">Aucun dossier médical renseigné.</p>}
              </div>

              <form onSubmit={handleAddRecord} className="rounded-md border border-[#E2E0D8] p-4 bg-[#F4F3EF]/50 space-y-4">
                <h3 className="text-sm font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">Ajouter une note médicale ou un avis d’aptitude</h3>
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed'] mb-1">Diagnostic / Remarques</label>
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-md border border-[#E2E0D8] bg-white p-3 text-sm text-[#14161A] outline-none focus:border-[#E2522B]"
                    placeholder="Évaluation médicale..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed'] mb-1">Statut d’aptitude</label>
                  <select
                    value={availability}
                    onChange={e => setAvailability(e.target.value)}
                    className="w-full rounded-md border border-[#E2E0D8] bg-white p-2 text-sm text-[#14161A]"
                  >
                    <option value="apte">Apte à l’entraînement et compétition</option>
                    <option value="reserve">Apte avec réserve</option>
                    <option value="inapte">Inapte temporaire</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Enregistrer l’avis</Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-[#5B606B]">
              Sélectionnez un sportif pour consulter son dossier médical.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
