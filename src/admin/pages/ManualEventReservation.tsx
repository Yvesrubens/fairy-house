import { useState } from 'react'
import type { FormEvent } from 'react'
import { createReservationManual } from '../../lib/api'
import type { EventRow, ReservationStatus } from '../../types/db'

// Inscription manuelle à un événement (back-office) : pour les inscriptions
// reçues par un autre biais (mail, téléphone…). Liée à l'événement (event_id)
// donc décomptée du quota comme une inscription en ligne. Le nombre de places
// (guests) permet une inscription de groupe.
export default function ManualEventReservation({
  event,
  onSaved,
  onCancel,
}: {
  event: EventRow
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    places: '1',
    amount: '',
    status: 'confirmed' as ReservationStatus,
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
        type: `Événement — ${event.title}`,
        arrival_date: event.event_date ?? new Date().toISOString().slice(0, 10),
        guests: Number(form.places) || 1,
        amount: form.amount ? Number(form.amount) : 0,
        status: form.status,
        event_id: event.id,
      })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const cls =
    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Inscription manuelle — {event.title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Décomptée du quota comme une inscription en ligne.
        </p>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Nom *
            <input
              required
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              className={`mt-1 ${cls}`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            E-mail *
            <input
              type="email"
              required
              value={form.client_email}
              onChange={(e) => set('client_email', e.target.value)}
              className={`mt-1 ${cls}`}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Téléphone
            <input
              value={form.client_phone}
              onChange={(e) => set('client_phone', e.target.value)}
              className={`mt-1 ${cls}`}
            />
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Nb de places
              <input
                type="number"
                min={1}
                value={form.places}
                onChange={(e) => set('places', e.target.value)}
                className={`mt-1 ${cls}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Montant (€)
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={`mt-1 ${cls}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Statut
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={`mt-1 ${cls}`}
              >
                <option value="confirmed">Confirmée</option>
                <option value="pending">En attente</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Créer l’inscription'}
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
