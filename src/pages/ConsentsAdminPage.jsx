import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button, StatTile, PageHeader, Badge, EmptyState } from '../components/ui'
import { supabase } from '../lib/supabase'

export function ConsentsAdminPage({ federation }) {
  const [consents, setConsents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConsents()
  }, [federation])

  async function loadConsents() {
    if (!federation) return
    setLoading(true)
    const { data } = await supabase.from('consents').select('*, athlete_profiles(first_name, last_name, sport)')
    if (data) setConsents(data)
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Suivi des Accords et Consentements"
        description="Vérification de la conformité des accords écrits par catégorie de données."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Accords signés" value={consents.filter(c => !c.revoked_at).length} hint="Conformes" />
        <StatTile label="Accords retirés" value={consents.filter(c => c.revoked_at).length} hint="Collecte suspendue" />
        <StatTile label="Total enregistrements" value={consents.length} hint="Sportifs enregistrés" />
      </div>

      <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
              <th className="p-3">Sportif</th>
              <th className="p-3">Signataire</th>
              <th className="p-3">FC / Sommeil</th>
              <th className="p-3">GPS</th>
              <th className="p-3">Médical</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E0D8] text-sm text-[#14161A]">
            {consents.map(c => (
              <tr key={c.id} className="hover:bg-[#F4F3EF]/50">
                <td className="p-3 font-semibold font-['Barlow_Condensed']">
                  {c.athlete_profiles?.first_name} {c.athlete_profiles?.last_name}
                </td>
                <td className="p-3">{c.signer_name}</td>
                <td className="p-3">
                  {c.fc_consent || c.sommeil_consent ? <Badge variant="success">Oui</Badge> : <Badge variant="danger">Non</Badge>}
                </td>
                <td className="p-3">
                  {c.gps_consent ? <Badge variant="success">Oui</Badge> : <Badge variant="danger">Non</Badge>}
                </td>
                <td className="p-3">
                  {c.medical_consent ? <Badge variant="success">Oui</Badge> : <Badge variant="danger">Non</Badge>}
                </td>
                <td className="p-3">
                  <Badge variant={c.revoked_at ? 'danger' : 'success'}>
                    {c.revoked_at ? 'Retiré' : 'Signé'}
                  </Badge>
                </td>
              </tr>
            ))}
            {consents.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#5B606B]">Aucun accord enregistré.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
