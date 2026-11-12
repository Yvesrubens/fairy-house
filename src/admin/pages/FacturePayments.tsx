import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  listFacturePayments,
  addFacturePayment,
  deleteFacturePayment,
} from '../../lib/api'
import { formatDate, formatEuro2 } from '../../lib/format'
import { PAYMENT_METHOD_LABELS, paymentStatus } from '../../lib/invoice'
import type { FacturePayment, FactureRow, PaymentMethod } from '../../types/db'

// Enregistrement des règlements d'une facture : espèces sur place, virement,
// CB, chèque… Plusieurs paiements possibles (acompte + solde). Le statut de la
// facture (payée / partielle / à régler) découle de la somme des paiements.

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function FacturePayments({
  facture,
  onClose,
}: {
  facture: FactureRow
  onClose: (changed: boolean) => void
}) {
  const [payments, setPayments] = useState<FacturePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [changed, setChanged] = useState(false)

  const paid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const status = paymentStatus(facture.total_ttc, paid)

  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('especes')
  const [paidAt, setPaidAt] = useState(today())
  const [note, setNote] = useState('')

  async function load() {
    setLoading(true)
    try {
      const rows = await listFacturePayments(facture.id)
      setPayments(rows)
      const sum = rows.reduce((s, p) => s + Number(p.amount), 0)
      setAmount(paymentStatus(facture.total_ttc, sum).remaining)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!(amount > 0)) {
      setError('Le montant doit être supérieur à 0.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await addFacturePayment({
        facture_id: facture.id,
        amount: Math.round(amount * 100) / 100,
        method,
        paid_at: paidAt,
        note: note.trim() || null,
      })
      setNote('')
      setChanged(true)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(p: FacturePayment) {
    if (!confirm(`Supprimer le paiement de ${formatEuro2(p.amount)} du ${formatDate(p.paid_at)} ?`)) return
    try {
      await deleteFacturePayment(p.id)
      setChanged(true)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const badge =
    status.state === 'payee'
      ? 'bg-green-100 text-green-700'
      : status.state === 'partielle'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700'
  const badgeLabel =
    status.state === 'payee' ? 'Payée' : status.state === 'partielle' ? 'Partiellement payée' : 'À régler'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Paiements — {facture.reference}
          </h2>
          <button onClick={() => onClose(changed)} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">{facture.client_name}</p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Total TTC</div>
            <div className="text-lg font-bold text-gray-900">{formatEuro2(facture.total_ttc)}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Déjà réglé</div>
            <div className="text-lg font-bold text-gray-900">{formatEuro2(status.paid)}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Reste à régler</div>
            <div className="text-lg font-bold text-gray-900">{formatEuro2(status.remaining)}</div>
          </div>
        </div>
        <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
          {badgeLabel}
        </span>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-6 text-sm font-semibold text-gray-700">Règlements enregistrés</p>
        {loading ? (
          <p className="mt-2 text-sm text-gray-500">Chargement…</p>
        ) : payments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Aucun règlement enregistré.</p>
        ) : (
          <ul className="mt-2 divide-y rounded-xl border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-700">
                  {formatDate(p.paid_at)} · {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                  {p.note ? <span className="text-gray-400"> — {p.note}</span> : null}
                </span>
                <span className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">{formatEuro2(p.amount)}</span>
                  <button
                    onClick={() => remove(p)}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600"
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={add} className="mt-6 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
          <p className="text-sm font-semibold text-gray-700">Enregistrer un règlement</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-gray-700">
              Montant (€)
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-purple-500"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Mode
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-purple-500"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-gray-700">
              Date
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-purple-500"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-gray-700">
            Note (optionnel)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex. réglé sur place, acompte…"
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-purple-500"
            />
          </label>
          <button
            disabled={busy}
            className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Ajouter le règlement'}
          </button>
        </form>

        <div className="mt-6 text-right">
          <button
            onClick={() => onClose(changed)}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
