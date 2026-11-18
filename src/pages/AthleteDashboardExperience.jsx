import { useState, useEffect } from 'react'
import { Activity, ShieldCheck, Download, History, MapPin, CheckCircle, AlertTriangle } from 'lucide-react'
import { StatTile, PageHeader, Badge, Button, Input } from '../components/ui'
import { supabase } from '../lib/supabase'

export function AthleteDashboardExperience({ federation, profile, onLogout }) {
  const [activeTab, setActiveTab] = useState('donnees')
  const [consent, setConsent] = useState(null)
  const [signerName, setSignerName] = useState('')
  const [logs, setLogs] = useState([])

  useEffect(() => {
    loadConsent()
    loadLogs()
  }, [profile])

  async function loadConsent() {
    const { data } = await supabase.from('consents').select('*').eq('athlete_id', profile.id).single()
    if (data) setConsent(data)
  }

  async function loadLogs() {
    const { data } = await supabase.from('data_access_log').select('*').eq('athlete_id', profile.id).order('accessed_at', { ascending: false })
    if (data) setLogs(data)
  }

  async function handleSignConsent(e) {
    e.preventDefault()
    const { error } = await supabase.from('consents').upsert({
      athlete_id: profile.id,
      fc_consent: true,
      sommeil_consent: true,
      gps_consent: true,
      medical_consent: true,
      signer_name: signerName,
      signed_at: new Date().toISOString(),
      revoked_at: null
    }, { onConflict: 'athlete_id' })

    if (!error) {
      loadConsent()
      alert('Accord signé avec succès.')
    } else {
      alert('Erreur : ' + error.message)
    }
  }

  async function handleRevokeConsent() {
    const { error } = await supabase.from('consents').update({
      revoked_at: new Date().toISOString(),
      fc_consent: false,
      sommeil_consent: false,
      gps_consent: false,
      medical_consent: false
    }).eq('athlete_id', profile.id)

    if (!error) {
      loadConsent()
      alert('Accord retiré. La collecte des données est suspendue.')
    }
  }

  function handleExportCsv() {
    const csvContent = "data:text/csv;charset=utf-8,Date,Type,Valeur,Unite\n2026-11-18,FC Repos,54,bpm\n2026-11-18,Sommeil,7.8,h\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mes_donnees_${profile.first_name}_${profile.last_name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-[#F4F3EF] pb-20">
      {/* Top Header */}
      <header className="bg-[#0E2A47] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-['Barlow_Condensed']">SportShield — Espace Sportif</h1>
          <p className="text-xs text-white/70">{profile.first_name} {profile.last_name} ({profile.sport})</p>
        </div>
        <Button variant="secondary" onClick={onLogout} className="text-xs py-1.5">Déconnexion</Button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E0D8] bg-white rounded-t-md overflow-hidden">
          <button
            onClick={() => setActiveTab('donnees')}
            className={`flex-1 py-3 text-center text-sm font-semibold font-['Barlow_Condensed'] transition ${activeTab === 'donnees' ? 'bg-[#E2522B] text-white' : 'text-[#5B606B] hover:bg-[#F4F3EF]'}`}
          >
            Mes Données
          </button>
          <button
            onClick={() => setActiveTab('accord')}
            className={`flex-1 py-3 text-center text-sm font-semibold font-['Barlow_Condensed'] transition ${activeTab === 'accord' ? 'bg-[#E2522B] text-white' : 'text-[#5B606B] hover:bg-[#F4F3EF]'}`}
          >
            Mon Accord
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`flex-1 py-3 text-center text-sm font-semibold font-['Barlow_Condensed'] transition ${activeTab === 'consultations' ? 'bg-[#E2522B] text-white' : 'text-[#5B606B] hover:bg-[#F4F3EF]'}`}
          >
            Qui a consulté ?
          </button>
        </div>

        {activeTab === 'donnees' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile label="FC Repos moyenne" value="54 bpm" badge={<Badge variant="success">Normal</Badge>} />
              <StatTile label="Sommeil moyen" value="7h42" hint="Derniers 7 jours" />
              <StatTile label="État du GPS" value="Actif" badge={<Badge variant="success">Créneau autorisé</Badge>} />
            </div>

            <div className="rounded-md border border-[#E2E0D8] bg-white p-6 space-y-4">
              <h2 className="text-lg font-bold font-['Barlow_Condensed'] text-[#14161A]">Portabilité des données (RGPD)</h2>
              <p className="text-sm text-[#5B606B]">
                Vous pouvez à tout moment exporter l’intégralité de vos mesures et séances d’entraînement au format CSV.
              </p>
              <Button onClick={handleExportCsv}><Download className="mr-2 h-4 w-4" /> Exporter mes données en CSV</Button>
            </div>
          </div>
        )}

        {activeTab === 'accord' && (
          <div className="rounded-md border border-[#E2E0D8] bg-white p-6 space-y-6">
            <h2 className="text-xl font-bold font-['Barlow_Condensed'] text-[#14161A]">Recueil de l’accord écrit</h2>
            <p className="text-sm text-[#5B606B]">
              Conformément à la charte SportShield, vos données de fréquence cardiaque, de sommeil et de localisation GPS ne sont collectées qu’avec votre consentement explicite. Elles ne peuvent jamais être utilisées contre vous.
            </p>

            {consent && !consent.revoked_at ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <CheckCircle className="h-5 w-5" /> Accord signé par {consent.signer_name} le {new Date(consent.signed_at).toLocaleDateString('fr-FR')}
                </div>
                <Button variant="danger" onClick={handleRevokeConsent}>Retirer mon accord</Button>
              </div>
            ) : (
              <form onSubmit={handleSignConsent} className="space-y-4 border-t border-[#E2E0D8] pt-4">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed'] mb-1">
                    Saisissez vos nom et prénom pour signer numériquement l’accord
                  </label>
                  <Input value={signerName} onChange={e => setSignerName(e.target.value)} required placeholder="Prénom Nom" />
                </div>
                <Button type="submit">Signer l’accord</Button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Statut</th>
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
                      <Badge variant={l.allowed ? 'success' : 'danger'}>{l.allowed ? 'Autorisé' : 'Refusé'}</Badge>
                    </td>
                    <td className="p-3 tabular-nums text-xs">{new Date(l.accessed_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#5B606B]">Aucune consultation consignée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#E2E0D8] bg-white flex justify-around p-3 sm:hidden shadow-lg">
        <button onClick={() => setActiveTab('donnees')} className={`text-xs font-semibold font-['Barlow_Condensed'] ${activeTab === 'donnees' ? 'text-[#E2522B]' : 'text-[#5B606B]'}`}>
          Mes Données
        </button>
        <button onClick={() => setActiveTab('accord')} className={`text-xs font-semibold font-['Barlow_Condensed'] ${activeTab === 'accord' ? 'text-[#E2522B]' : 'text-[#5B606B]'}`}>
          Mon Accord
        </button>
        <button onClick={() => setActiveTab('consultations')} className={`text-xs font-semibold font-['Barlow_Condensed'] ${activeTab === 'consultations' ? 'text-[#E2522B]' : 'text-[#5B606B]'}`}>
          Consultations
        </button>
      </nav>
    </div>
  )
}
