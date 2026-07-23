import { useEffect, useMemo, useState } from 'react'
import {
  listReservations,
  updateReservationStatus,
  deleteReservation,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { formatDate, formatEuro2, toCSV } from '../../lib/format'
import DevisForm from './DevisForm'
import ReservationForm from './ReservationForm'
import ReservationDetail from './ReservationDetail'
import { ACCOMMODATION_LABEL, MODE_LABEL, paymentSummary } from '../../lib/reservationLabels'
import type { Reservation, ReservationStatus } from '../../types/db'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
}
const STATUS_BADGE: Record<ReservationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

type Filter = 'all' | ReservationStatus
export type ReservationScope = 'sejour' | 'evenement'

export default function Reservations({ scope }: { scope: ReservationScope }) {
  const isEvent = scope === 'evenement'
  const [rows, setRows] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listReservations()
      .then(setRows)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  // Séparation séjour / événement : une inscription événement a un event_id.
  const scoped = useMemo(
    () => rows.filter((r) => (isEvent ? Boolean(r.event_id) : !r.event_id)),
    [rows, isEvent],
  )
  const filtered = useMemo(
    () => (filter === 'all' ? scoped : scoped.filter((r) => r.status === filter)),
    [scoped, filter],
  )

  const [sending, setSending] = useState<string | null>(null)
  const [devisFor, setDevisFor] = useState<Reservation | null>(null)
  const [detailFor, setDetailFor] = useState<Reservation | null>(null)
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')

  async function reload() {
    setRows(await listReservations())
  }

  async function setStatus(id: string, status: ReservationStatus) {
    await updateReservationStatus(id, status)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  async function removeOne(id: string, ref: string) {
    if (!confirm(`Supprimer définitivement la réservation ${ref} ?`)) return
    try {
      await deleteReservation(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      setNotice(`Réservation ${ref} supprimée.`)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function clearAll() {
    if (
      !confirm(
        `Vider les ${filtered.length} réservations affichées ? Cette action est irréversible.`,
      )
    )
      return
    try {
      // Suppression ciblée sur les lignes réellement affichées (périmètre +
      // filtre de statut) pour rester cohérent avec le nombre annoncé.
      await Promise.all(filtered.map((r) => deleteReservation(r.id)))
      setRows((prev) => prev.filter((r) => !filtered.some((s) => s.id === r.id)))
      setNotice('Réservations supprimées.')
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function sendConfirmation(id: string) {
    setSending(id)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reservationId: id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Échec de l’envoi')
      }
      const nowIso = new Date().toISOString()
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, confirmation_sent_at: nowIso } : r,
        ),
      )
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSending(null)
    }
  }

  function exportCSV() {
    const data = filtered.map((r) =>
      isEvent
        ? {
            reference: r.reference,
            client: r.client_name,
            email: r.client_email,
            telephone: r.client_phone ?? '',
            evenement: r.type,
            date: r.arrival_date,
            hebergement: ACCOMMODATION_LABEL[r.accommodation_choice ?? ''] ?? '',
            navette: r.shuttle ? 'Oui' : 'Non',
            regime: r.diet ?? '',
            paiement: paymentSummary(r),
            consent_reglement: r.consent_reglement ? 'Oui' : 'Non',
            consent_image: r.consent_image ? 'Oui' : 'Non',
            montant: r.amount,
            statut: STATUS_LABEL[r.status],
          }
        : {
            reference: r.reference,
            client: r.client_name,
            email: r.client_email,
            telephone: r.client_phone ?? '',
            type: r.type,
            arrivee: r.arrival_date,
            depart: r.departure_date ?? '',
            formule: r.mode ? MODE_LABEL[r.mode] : '',
            voyageurs: r.guests ?? '',
            paiement: paymentSummary(r),
            montant: r.amount,
            statut: STATUS_LABEL[r.status],
          },
    )
    const blob = new Blob(
      [toCSV(data as unknown as Record<string, string | number>[])],
      { type: 'text/csv;charset=utf-8;' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isEvent ? 'inscriptions-evenement.csv' : 'reservations-sejour.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  const title = isEvent ? 'Réservations événement' : 'Réservations séjour'
  const colCount = isEvent ? 12 : 11

  return (
    <div>
      {devisFor && (
        <DevisForm
          reservation={devisFor}
          onCancel={() => setDevisFor(null)}
          onSent={(ref) => {
            setDevisFor(null)
            setNotice(`Devis ${ref} envoyé au client.`)
          }}
        />
      )}
      {detailFor && (
        <ReservationDetail
          reservation={detailFor}
          onClose={() => setDetailFor(null)}
        />
      )}
      {creating && (
        <ReservationForm
          onCancel={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false)
            await reload()
            setNotice('Réservation créée.')
          }}
        />
      )}
      {notice && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="flex gap-3">
          {!isEvent && (
            <button
              onClick={() => setCreating(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Nouvelle réservation
            </button>
          )}
          <button
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Exporter CSV
          </button>
          <button
            onClick={clearAll}
            disabled={filtered.length === 0}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
          >
            Vider
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-white px-5 py-4">
        <span className="text-sm font-medium text-gray-600">Statut :</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-purple-500"
        >
          <option value="all">Toutes</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">N°</th>
              <th className="px-6 py-4">Client</th>
              {isEvent ? (
                <>
                  <th className="px-6 py-4">Événement</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Hébergement</th>
                  <th className="px-6 py-4">Navette</th>
                  <th className="px-6 py-4">Tél</th>
                  <th className="px-6 py-4">Régime</th>
                  <th className="px-6 py-4">Paiement</th>
                  <th className="px-6 py-4">Consent.</th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Arrivée</th>
                  <th className="px-6 py-4">Départ</th>
                  <th className="px-6 py-4">Tél</th>
                  <th className="px-6 py-4">Formule</th>
                  <th className="px-6 py-4">Voyageurs</th>
                  <th className="px-6 py-4">Paiement</th>
                </>
              )}
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={colCount + 1}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Aucune réservation
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">
                  {r.reference}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{r.client_name}</div>
                  <div className="text-gray-500">{r.client_email}</div>
                </td>
                {isEvent ? (
                  <>
                    <td className="px-6 py-4 text-gray-700">{r.type}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {formatDate(r.arrival_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {ACCOMMODATION_LABEL[r.accommodation_choice ?? ''] ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.shuttle ? 'Oui' : 'Non'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.client_phone ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.diet ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {paymentSummary(r) || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${r.consent_reglement ? 'bg-green-500' : 'bg-gray-300'}`}
                          title="Règlement"
                        />
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${r.consent_image ? 'bg-green-500' : 'bg-gray-300'}`}
                          title="Droit à l'image"
                        />
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-gray-700">{r.type}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {formatDate(r.arrival_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.departure_date ? formatDate(r.departure_date) : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.client_phone ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.mode ? MODE_LABEL[r.mode] : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.guests ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {paymentSummary(r) || '—'}
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-gray-700">{formatEuro2(r.amount)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setDetailFor(r)}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700"
                    >
                      Détails
                    </button>
                    {r.status !== 'confirmed' && (
                      <button
                        onClick={() => setStatus(r.id, 'confirmed')}
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Confirmer
                      </button>
                    )}
                    {r.status !== 'cancelled' && (
                      <button
                        onClick={() => setStatus(r.id, 'cancelled')}
                        className="text-sm font-medium text-rose-500 hover:text-rose-600"
                      >
                        Annuler
                      </button>
                    )}
                    {r.confirmation_sent_at ? (
                      <span className="text-xs text-gray-400">
                        Confirmation envoyée le {formatDate(r.confirmation_sent_at)}
                      </span>
                    ) : (
                      <button
                        onClick={() => sendConfirmation(r.id)}
                        disabled={sending === r.id}
                        className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                      >
                        {sending === r.id ? 'Envoi…' : 'Envoyer la confirmation'}
                      </button>
                    )}
                    <button
                      onClick={() => setDevisFor(r)}
                      className="text-sm font-medium text-gold hover:opacity-80"
                    >
                      Créer un devis
                    </button>
                    <button
                      onClick={() => removeOne(r.id, r.reference)}
                      className="text-sm font-medium text-rose-500 hover:text-rose-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
