import { useState, useEffect } from 'react'
import { MapPin, Clock, Plus } from 'lucide-react'
import { Button, Input, Select, Badge, StatTile, PageHeader, Field } from '../components/ui'
import { supabase } from '../lib/supabase'

export function GpsWindowsPage({ federation }) {
  const [windows, setWindows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ dayOfWeek: '1', startTime: '08:00', endTime: '20:00', label: 'Créneau Lundi' })

  useEffect(() => {
    loadWindows()
  }, [federation])

  async function loadWindows() {
    if (!federation) return
    setLoading(true)
    const { data } = await supabase.from('gps_windows').select('*').eq('federation_id', federation.id)
    if (data) setWindows(data)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    const { error } = await supabase.from('gps_windows').insert({
      federation_id: federation.id,
      day_of_week: parseInt(form.dayOfWeek),
      start_time: form.startTime,
      end_time: form.endTime,
      label: form.label
    })
    if (!error) {
      setShowModal(false)
      loadWindows()
    } else {
      alert('Erreur : ' + error.message)
    }
  }

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  return (
    <div>
      <PageHeader
        title="Créneaux GPS Autorisés"
        description="Gestion des fenêtres horaires autorisées pour la collecte des traces GPS (hors créneau, le GPS est coupé)."
        actions={<Button onClick={() => setShowModal(true)}>Ajouter un créneau</Button>}
      />

      <div className="rounded-md border border-[#E2E0D8] bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E0D8] bg-[#F4F3EF] text-xs font-semibold tracking-wider text-[#5B606B] uppercase font-['Barlow_Condensed']">
              <th className="p-3">Libellé</th>
              <th className="p-3">Jour</th>
              <th className="p-3">Heure début</th>
              <th className="p-3">Heure fin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E0D8] text-sm text-[#14161A]">
            {windows.map(w => (
              <tr key={w.id} className="hover:bg-[#F4F3EF]/50">
                <td className="p-3 font-semibold font-['Barlow_Condensed']">{w.label}</td>
                <td className="p-3">{days[w.day_of_week]}</td>
                <td className="p-3 tabular-nums">{w.start_time}</td>
                <td className="p-3 tabular-nums">{w.end_time}</td>
              </tr>
            ))}
            {windows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#5B606B]">Aucun créneau GPS défini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border border-[#E2E0D8] bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold font-['Barlow_Condensed'] text-[#14161A] mb-4">Nouveau Créneau GPS</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <Field label="Libellé">
                <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required />
              </Field>
              <Field label="Jour de la semaine">
                <Select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}>
                  {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Heure début">
                  <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
                </Field>
                <Field label="Heure fin">
                  <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
                </Field>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
