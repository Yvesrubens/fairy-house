import { useEffect, type ReactNode } from 'react'
import { formatDate, formatEuro2 } from '../../lib/format'
import {
  MODE_LABEL,
  ACCOMMODATION_LABEL,
  paymentSummary,
  roomsSummary,
} from '../../lib/reservationLabels'
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

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === ''
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (isEmpty(value)) return null
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <div className="divide-y">{children}</div>
    </div>
  )
}

export default function ReservationDetail({
  reservation: r,
  onClose,
}: {
  reservation: Reservation
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isEvent = Boolean(r.event_id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gray-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
          <div>
            <p className="text-lg font-bold">{r.reference}</p>
            <p className="mt-1 text-sm text-white/85">
              Créée le {formatDate(r.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}
            >
              {STATUS_LABEL[r.status]}
            </span>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-2xl leading-none text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {/* Client */}
          <Card title="Client">
            <Row label="Nom" value={r.client_name} />
            <Row label="Email" value={r.client_email} />
            <Row label="Téléphone" value={r.client_phone} />
            {isEvent && <Row label="Réseau social" value={r.social_handle} />}
            {isEvent && (
              <Row label="Contact d'urgence" value={r.emergency_contact} />
            )}
          </Card>

          {/* Séjour */}
          {!isEvent && (
            <Card title="Séjour">
              <Row label="Formule" value={r.mode ? MODE_LABEL[r.mode] : ''} />
              <Row label="Arrivée" value={formatDate(r.arrival_date)} />
              <Row
                label="Départ"
                value={r.departure_date ? formatDate(r.departure_date) : ''}
              />
              <Row label="Chambres" value={roomsSummary(r.rooms)} />
              <Row label="Lits" value={r.beds} />
              <Row label="Voyageurs" value={r.guests} />
              <Row
                label="Linge"
                value={r.options ? (r.options.linge ? 'Oui' : 'Non') : ''}
              />
              <Row
                label="Pension"
                value={r.options ? (r.options.pension ? 'Oui' : 'Non') : ''}
              />
              <Row
                label="Activités demandées"
                value={r.activities_requested ? 'Oui' : ''}
              />
              <Row label="Allergies" value={r.allergies} />
            </Card>
          )}

          {/* Événement */}
          {isEvent && (
            <Card title="Événement">
              <Row label="Événement" value={r.type} />
              <Row label="Date" value={formatDate(r.arrival_date)} />
              <Row
                label="Hébergement"
                value={
                  r.accommodation_choice
                    ? ACCOMMODATION_LABEL[r.accommodation_choice]
                    : ''
                }
              />
              <Row label="Navette" value={r.shuttle ? 'Oui' : ''} />
              <Row label="Régime" value={r.diet} />
              <Row
                label="Consent. règlement"
                value={
                  r.consent_reglement === null
                    ? ''
                    : r.consent_reglement
                      ? 'Oui'
                      : 'Non'
                }
              />
              <Row
                label="Consent. image"
                value={
                  r.consent_image === null
                    ? ''
                    : r.consent_image
                      ? 'Oui'
                      : 'Non'
                }
              />
            </Card>
          )}

          {/* Paiement */}
          <Card title="Paiement">
            <Row label="Montant total" value={formatEuro2(r.amount)} />
            <Row label="Mode de paiement" value={paymentSummary(r)} />
            {r.payment_plan === 'split' && (
              <>
                <Row
                  label="Acompte"
                  value={
                    r.deposit_amount != null ? formatEuro2(r.deposit_amount) : ''
                  }
                />
                <Row
                  label="Solde"
                  value={
                    r.balance_amount != null ? formatEuro2(r.balance_amount) : ''
                  }
                />
                <Row
                  label="Échéance du solde"
                  value={
                    r.balance_due_date ? formatDate(r.balance_due_date) : ''
                  }
                />
              </>
            )}
            <Row
              label="Confirmation"
              value={
                r.confirmation_sent_at
                  ? `Envoyée le ${formatDate(r.confirmation_sent_at)}`
                  : ''
              }
            />
          </Card>

          {/* Message */}
          {r.message && (
            <Card title="Message du client">
              <p className="py-2 text-sm text-gray-700">{r.message}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
