import { useState } from 'react'
import type { FormEvent } from 'react'
import { createReservationManual } from '../../lib/api'
import type { ReservationStatus } from '../../types/db'

const TYPES = [
  'Chambre Litha (2-3 personnes)',
  'Chambre Mabbon (5 personnes)',
  'Chambre Imbolc (4 personnes)',
  'Privatisation simple',
  'Séjour sur mesure',
]

export default function ReservationForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    type: TYPES[0],
    arrival_date: '',
    departure_date: '',
    guests: '1',
    amount: '0',
    status: 'pending' as ReservationStatus,
    message: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createReservationManual({
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || undefined,
        type: form.type,
        arrival_date: form.arrival_date,
        departure_date: form.departure_date || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        amount: form.amount ? Number(form.amount) : 0,
        status: form.status,
        message: form.message || undefined,
      })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const input =
    'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle réservation</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Nom du client *
            <input
              required
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email *
            <input
              type="email"
              required
              value={form.client_email}
              onChange={(e) => set('client_email', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Téléphone
            <input
              type="tel"
              value={form.client_phone}
              onChange={(e) => set('client_phone', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Type d'hébergement
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className={input}
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Date d'arrivée *
            <input
              type="date"
              required
              value={form.arrival_date}
              onChange={(e) => set('arrival_date', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Date de départ
            <input
              type="date"
              value={form.departure_date}
              onChange={(e) => set('departure_date', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Nombre de personnes
            <select
              value={form.guests}
              onChange={(e) => set('guests', e.target.value)}
              className={input}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'personne' : 'personnes'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Montant (€)
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              className={input}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Statut
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as ReservationStatus)}
              className={input}
            >
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Message / note
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            className={input}
          />
        </label>

        <div className="mt-8 flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Créer la réservation'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
