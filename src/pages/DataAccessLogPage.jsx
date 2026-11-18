import { useState, useEffect } from 'react'
import { Shield, Clock } from 'lucide-react'
import { Badge, StatTile, PageHeader } from '../components/ui'
import { supabase } from '../lib/supabase'

export function DataAccessLogPage({ federation }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [federation])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase.from('data_access_log').select('*').order('accessed_at', { ascending: false }).limit(100)
    if (data) setLogs(data)
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Journal des Accès aux Données"
        description="Traçabilité RGPD complète des consultations de données sensibles et de performance."
      />

      <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
              <th className="p-3">Rôle Acteur</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Action</th>
              <th className="p-3">Autorisé</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E0D8] text-sm text-[#14161A]">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-[#F4F3EF]/50">
                <td className="p-3 font-semibold font-['Barlow_Condensed']">{l.actor_role}</td>
                <td className="p-3">{l.category}</td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3">
                  <Badge variant={l.allowed ? 'success' : 'danger'}>
                    {l.allowed ? 'Autorisé' : 'Refusé'}
                  </Badge>
                </td>
                <td className="p-3 tabular-nums text-xs">{new Date(l.accessed_at).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#5B606B]">Aucun accès consigné.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
