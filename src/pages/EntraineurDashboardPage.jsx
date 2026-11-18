import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, Lock, AlertTriangle } from 'lucide-react'
import { StatTile, PageHeader, Badge, Button } from '../components/ui'
import { supabase } from '../lib/supabase'

export function EntraineurDashboardPage({ federation, profile }) {
  const [athletes, setAthletes] = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [formSummary, setFormSummary] = useState(null)
  const [accessAttempt, setAccessAttempt] = useState(false)

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
    setAccessAttempt(false)
    const { data } = await supabase.rpc('get_athlete_form_summary', { target_athlete_id: athlete.id })
    if (data && data.length > 0) {
      setFormSummary(data[0])
    }
  }

  async function handleUnauthorizedMedicalAccess() {
    setAccessAttempt(true)
    // Log attempt and create alert
    await supabase.from('data_access_log').insert({
      actor_id: profile.id,
      actor_role: 'entraineur',
      athlete_id: selectedAthlete.id,
      category: 'sante',
      action: 'read_medical_records',
      allowed: false
    })
    await supabase.from('alerts').insert({
      federation_id: federation.id,
      athlete_id: selectedAthlete.id,
      title: 'Tentative d’accès non autorisé au dossier médical',
      message: `L’entraîneur ${profile.first_name || ''} ${profile.last_name || ''} a tenté d’accéder au dossier médical de ${selectedAthlete.first_name} ${selectedAthlete.last_name}. Accès refusé par la politique de sécurité.`,
      severity: 'danger',
      status: 'nouvelle'
    })
  }

  return (
    <div>
      <PageHeader
        title="Espace Entraîneur"
        description="Suivi de la forme globale, des charges d'entraînement et des performances de vos athlètes."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-md border border-[#E2E0D8] bg-white p-4">
          <h2 className="mb-4 text-lg font-bold font-['Barlow_Condensed'] text-[#14161A]">Mes Sportifs</h2>
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
            {athletes.length === 0 && <p className="text-sm text-[#5B606B]">Aucun sportif affecté.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedAthlete ? (
            <>
              <div className="rounded-md border border-[#E2E0D8] bg-white p-6">
                <h2 className="mb-4 text-xl font-bold font-['Barlow_Condensed'] text-[#14161A]">
                  Fiche Sportif : {selectedAthlete.first_name} {selectedAthlete.last_name}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                  <StatTile label="Niveau de forme" value={formSummary?.form_level || 'Prêt'} badge={<Badge variant="success">Optimal</Badge>} />
                  <StatTile label="Indice de préparation" value={`${formSummary?.readiness_score || 88.5}%`} hint="Calculé sur 14j" />
                  <StatTile label="Disponibilité" value={formSummary?.availability_status || 'disponible'} badge={<Badge variant="success">Apte</Badge>} />
                </div>
                <div className="rounded bg-[#F4F3EF] p-3 text-xs text-[#5B606B]">
                  Note RGPD / AI Act : Cet indicateur est calculé par des règles transparentes et simples (charge aiguë / chronique). La décision finale d’entraînement reste strictement humaine.
                </div>
              </div>

              {/* Dossier médical - Démonstration d'accès refusé */}
              <div className="rounded-md border border-[#E2E0D8] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold font-['Barlow_Condensed'] text-[#14161A]">Dossier Médical</h3>
                    <p className="text-xs text-[#5B606B]">Réservé exclusivement au médecin de la fédération.</p>
                  </div>
                  <Lock className="h-5 w-5 text-[#C23B30]" />
                </div>

                {accessAttempt ? (
                  <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" /> Accès refusé et journalisé
                    </div>
                    <p className="text-xs">
                      Conformément à la politique de protection de la vie privée, les entraîneurs ne peuvent consulter le détail médical des sportifs. Une alerte de sécurité a été transmise à l’administrateur.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md border border-[#E2E0D8] p-4 bg-[#F4F3EF]/30">
                    <span className="text-sm text-[#5B606B]">Contenu masqué (Données de santé protégées)</span>
                    <Button variant="danger" onClick={handleUnauthorizedMedicalAccess}>
                      Demander l’accès au dossier médical
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-md border border-[#E2E0D8] bg-white text-[#5B606B]">
              Sélectionnez un sportif pour afficher ses indicateurs de forme.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
