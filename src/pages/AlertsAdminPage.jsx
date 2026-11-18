import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react'
import { Button, Badge, StatTile, PageHeader } from '../components/ui'
import { supabase } from '../lib/supabase'

export function AlertsAdminPage({ federation }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [federation])

  async function loadAlerts() {
    if (!federation) return
    setLoading(true)
    const { data } = await supabase.from('alerts').select('*').eq('federation_id', federation.id).order('created_at', { ascending: false })
    if (data) setAlerts(data)
    setLoading(false)
  }

  async function handleRunCheck() {
    const { data, error } = await supabase.rpc('run_access_check')
    if (!error) {
      alert(`Contrôle d’accès exécuté avec succès. ${data || 0} alerte(s) générée(s) ou vérifiées.`)
      loadAlerts()
    } else {
      alert('Erreur lors du contrôle : ' + error.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Alertes et Contrôles de Sécurité"
        description="Surveillance des accès non autorisés, anomalies de capteurs et audits de conformité."
        actions={<Button onClick={handleRunCheck}><RefreshCw className="mr-2 h-4 w-4" /> Lancer le contrôle des accès</Button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Alertes ouvertes" value={alerts.filter(a => a.status === 'nouvelle' || a.status === 'en_cours').length} hint="À traiter" />
        <StatTile label="Résolues" value={alerts.filter(a => a.status === 'resolue').length} hint="Clôturées" />
        <StatTile label="Total alertes" value={alerts.length} hint="Historique" />
      </div>

      <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
              <th className="p-3">Titre</th>
              <th className="p-3">Message</th>
              <th className="p-3">Sévérité</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E0D8] text-sm text-[#14161A]">
            {alerts.map(a => (
              <tr key={a.id} className="hover:bg-[#F4F3EF]/50">
                <td className="p-3 font-semibold font-['Barlow_Condensed']">{a.title}</td>
                <td className="p-3 text-xs text-[#5B606B]">{a.message}</td>
                <td className="p-3">
                  <Badge variant={a.severity === 'danger' ? 'danger' : a.severity === 'warning' ? 'warning' : 'success'}>
                    {a.severity}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={a.status === 'resolue' ? 'success' : 'neutral'}>
                    {a.status}
                  </Badge>
                </td>
                <td className="p-3 tabular-nums text-xs">{new Date(a.created_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {alerts.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#5B606B]">Aucune alerte enregistrée. Tout est nominal.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
