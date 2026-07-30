import { useState } from 'react'
import type { FormEvent } from 'react'
import { updateReservation } from '../../lib/api'
import type { Reservation } from '../../types/db'

// Édition d'une réservation (point 9) : corriger les coordonnées (ex. email
// erroné pour l'envoi de factures) et renseigner un contact/adresse de
// facturation distincts.
export default function ReservationEdit({
  reservation,
  onSaved,
  onCancel,
}: {
  reservation: Reservation
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    client_name: reservation.client_name ?? '',
    client_email: reservation.client_email ?? '',
    client_phone: reservation.client_phone ?? '',
    arrival_date: reservation.arrival_date ?? '',
    departure_date: reservation.departure_date ?? '',
    guests: reservation.guests != null ? String(reservation.guests) : '',
    amount: reservation.amount != null ? String(reservation.amount) : '',
    message: reservation.message ?? '',
    billing_name: reservation.billing_name ?? '',
    billing_email: reservation.billing_email ?? '',
    billing_address: reservation.billing_address ?? '',
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
      await updateReservation(reservation.id, {
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || null,
        arrival_date: form.arrival_date,
        departure_date: form.departure_date || null,
        guests: form.guests ? Number(form.guests) : null,
        amount: form.amount ? Number(form.amount) : 0,
        message: form.message || null,
        billing_name: form.billing_name || null,
        billing_email: form.billing_email || null,
        billing_address: form.billing_address || null,
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
  const Field = ({
    label,
    k,
    type = 'text',
  }: {
    label: string
    k: keyof typeof form
    type?: string
  }) => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {type === 'textarea' ? (
        <textarea
          rows={3}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          className={`mt-1 ${cls}`}
        />
      ) : (
        <input
          type={type}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          className={`mt-1 ${cls}`}
        />
      )}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Modifier la réservation — {reservation.reference}
          </h2>
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
          <Field label="Nom" k="client_name" />
          <Field label="Email" k="client_email" type="email" />
          <Field label="Téléphone" k="client_phone" />
          <Field label="Voyageurs" k="guests" type="number" />
          <Field label="Arrivée" k="arrival_date" type="date" />
          <Field label="Départ" k="departure_date" type="date" />
          <Field label="Montant (€)" k="amount" type="number" />
        </div>
        <div className="mt-4">
          <Field label="Message" k="message" type="textarea" />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-bold text-gray-900">
            Facturation (si différente du client)
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Nom de facturation" k="billing_name" />
            <Field label="Email de facturation" k="billing_email" type="email" />
          </div>
          <div className="mt-4">
            <Field label="Adresse de facturation" k="billing_address" type="textarea" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Si renseigné, les devis et factures sont adressés à ce contact.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Enregistrer'}
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
