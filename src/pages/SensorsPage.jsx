import { useState, useEffect } from 'react'
import { Activity, Cpu, ShieldCheck, MapPin, Bell, FileText, CheckCircle, AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react'
import { Button, Input, Select, Badge, StatTile, PageHeader, EmptyState, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

export function SensorsPage({ federation }) {
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ type: 'frequence_cardiaque', manufacturer: '', model: '', serialNumber: '', frequency: '1s' })

  useEffect(() => {
    loadSensors()
  }, [federation])

  async function loadSensors() {
    if (!federation) return
    setLoading(true)
    const { data } = await supabase.from('sensors').select('*').eq('federation_id', federation.id)
    if (data) setSensors(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const produced = form.type === 'frequence_cardiaque' ? ['FC', 'Variabilité'] : form.type === 'gps' ? ['Trace', 'Allure'] : ['Phases', 'Récupération']
    const { error } = await supabase.from('sensors').insert({
      federation_id: federation.id,
      type: form.type,
      manufacturer: form.manufacturer,
      model: form.model,
      serial_number: form.serialNumber,
      produced_data: produced,
      measurement_frequency: form.frequency,
      status: 'actif'
    })
    if (!error) {
      setShowAddModal(false)
      setForm({ type: 'frequence_cardiaque', manufacturer: '', model: '', serialNumber: '', frequency: '1s' })
      loadSensors()
    } else {
      alert('Erreur lors de l’ajout du capteur : ' + error.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Capteurs et Données Mesurées"
        description="Recensement des capteurs connectés et des flux de données de la fédération."
        actions={<Button onClick={() => setShowAddModal(true)}>Ajouter un capteur</Button>}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Capteurs actifs" value={sensors.filter(s => s.status === 'actif').length} hint="En service" />
        <StatTile label="En maintenance" value={sensors.filter(s => s.status === 'en_panne').length} hint="Panne ou révision" />
        <StatTile label="Total capteurs" value={sensors.length} hint="Flotte fédérale" />
      </div>

      <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
              <th className="p-3">Type</th>
              <th className="p-3">Fabricant / Modèle</th>
              <th className="p-3">N° de série</th>
              <th className="p-3">Données produites</th>
              <th className="p-3">Fréquence</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E0D8] text-sm text-[#14161A]">
            {sensors.map(s => (
              <tr key={s.id} className="hover:bg-[#F4F3EF]/50">
                <td className="p-3 font-semibold font-['Barlow_Condensed']">{s.type}</td>
                <td className="p-3">{s.manufacturer} {s.model}</td>
                <td className="p-3 font-mono text-xs">{s.serial_number}</td>
                <td className="p-3">{s.produced_data?.join(', ')}</td>
                <td className="p-3 tabular-nums">{s.measurement_frequency}</td>
                <td className="p-3">
                  <Badge variant={s.status === 'actif' ? 'success' : s.status === 'en_panne' ? 'danger' : 'neutral'}>
                    {s.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {sensors.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#5B606B]">Aucun capteur enregistré.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border border-[#E2E0D8] bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold font-['Barlow_Condensed'] text-[#14161A] mb-4">Nouveau Capteur</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <Field label="Type de capteur">
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="frequence_cardiaque">Fréquence Cardiaque</option>
                  <option value="gps">GPS</option>
                  <option value="sommeil">Sommeil</option>
                </Select>
              </Field>
              <Field label="Fabricant">
                <Input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} required placeholder="Garmin, Polar..." />
              </Field>
              <Field label="Modèle">
                <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} required placeholder="Vantage V3" />
              </Field>
              <Field label="Numéro de série">
                <Input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} required placeholder="SN-12345" />
              </Field>
              <Field label="Fréquence de mesure">
                <Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} required placeholder="1s, 5Hz..." />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
