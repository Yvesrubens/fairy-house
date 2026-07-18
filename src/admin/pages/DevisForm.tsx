import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import type { Reservation } from '../../types/db'

interface Line {
  designation: string
  qty: number
  unitPrice: number
}

const VAT = 20

function nights(r: Reservation): number {
  if (!r.departure_date) return 1
  const a = new Date(r.arrival_date).getTime()
  const b = new Date(r.departure_date).getTime()
  return Math.max(1, Math.round((b - a) / 86400000))
}

export default function DevisForm({
  reservation,
  onSent,
  onCancel,
}: {
  reservation: Reservation
  onSent: (ref: string) => void
  onCancel: () => void
}) {
  const n = nights(reservation)
  const [lines, setLines] = useState<Line[]>([
    {
      designation: `${reservation.type} — séjour du ${formatDate(
        reservation.arrival_date,
      )}${reservation.departure_date ? ' au ' + formatDate(reservation.departure_date) : ''}`,
      qty: n,
      unitPrice: reservation.amount > 0 ? Math.round((reservation.amount / n) * 100) / 100 : 0,
    },
  ])
  const [validityDays, setValidityDays] = useState(30)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function addLine() {
    setLines((prev) => [...prev, { designation: '', qty: 1, unitPrice: 0 }])
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i))
  }

  const totalHt = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const tva = Math.round(totalHt * (VAT / 100) * 100) / 100
  const totalTtc = Math.round((totalHt + tva) * 100) / 100
  const eur = (v: number) =>
    v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/send-devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: reservation.id,
          lines,
          validityDays,
          note: note || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Échec de l’envoi du devis')
      onSent(body.reference)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Créer un devis — {reservation.client_name}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Réservation {reservation.reference} · {reservation.client_email}
        </p>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Lignes */}
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-[1fr_70px_100px_100px_32px] gap-2 text-xs font-medium uppercase text-gray-400">
            <span>Désignation</span>
            <span>Qté</span>
            <span>PU HT</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>
          {lines.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_70px_100px_100px_32px] items-center gap-2"
            >
              <input
                value={l.designation}
                onChange={(e) => setLine(i, { designation: e.target.value })}
                required
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
              <input
                type="number"
                min={0}
                step="0.5"
                value={l.qty}
                onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                className="rounded-lg border px-2 py-2 text-sm outline-none focus:border-purple-500"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={l.unitPrice}
                onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })}
                className="rounded-lg border px-2 py-2 text-sm outline-none focus:border-purple-500"
              />
              <span className="text-right text-sm font-medium">
                {eur(l.qty * l.unitPrice)}
              </span>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="text-gray-400 hover:text-rose-500"
                aria-label="Supprimer la ligne"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            + Ajouter une ligne
          </button>
        </div>

        {/* Totaux */}
        <div className="mt-6 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total HT</span>
            <span>{eur(totalHt)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>TVA {VAT} %</span>
            <span>{eur(tva)}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-purple-50 px-3 py-2 font-bold text-purple-700">
            <span>Total TTC</span>
            <span>{eur(totalTtc)}</span>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Validité (jours)
            <input
              type="number"
              min={1}
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Note (optionnel)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
            />
          </label>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            disabled={busy}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Envoi…' : 'Générer et envoyer au client'}
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
