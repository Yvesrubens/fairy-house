import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { openPdfBase64 } from '../../lib/pdf'
import { computeInvoice, PAYMENT_METHOD_LABELS } from '../../lib/invoice'
import type { TtcLine } from '../../lib/invoice'
import type { PaymentMethod } from '../../types/db'

// Création d'une facture SAISIE À LA MAIN, sans réservation liée : reprise des
// factures émises hors site (ex. cet été), règlements sur place… Prix en TTC,
// numéro repris ou automatique, date d'émission libre, règlement optionnel.

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const field =
  'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500'

export default function ManualFactureForm({
  onCreated,
  onCancel,
}: {
  onCreated: (reference: string, warning?: string) => void
  onCancel: () => void
}) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [issuedAt, setIssuedAt] = useState(today())
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<TtcLine[]>([
    { designation: '', qty: 1, unitPriceTtc: 0, vatRate: 20 },
  ])
  const [dueDays, setDueDays] = useState(30)
  const [note, setNote] = useState('')
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('especes')
  const [paidAt, setPaidAt] = useState(today())
  const [send, setSend] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState('')

  const inv = computeInvoice(lines)
  const eur = (v: number) =>
    v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  function setLine(i: number, patch: Partial<TtcLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  async function run(isPreview: boolean, win?: Window | null) {
    setError('')
    if (isPreview) setPreviewing(true)
    else setBusy(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/create-facture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientAddress,
          lines,
          issuedAt,
          reference: reference.trim() || undefined,
          dueDays,
          note: note || undefined,
          send: isPreview ? false : send,
          preview: isPreview,
          payment: alreadyPaid ? { method: payMethod, paid_at: paidAt } : undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Échec de la création de la facture')
      if (isPreview) openPdfBase64(body.pdf, win)
      else onCreated(body.reference, body.warning)
    } catch (err) {
      if (win) win.close()
      setError((err as Error).message)
    } finally {
      setBusy(false)
      setPreviewing(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    run(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <form onSubmit={submit} className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle facture (saisie manuelle)</h2>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Pour une facture sans réservation sur le site : reprise d'une facture émise à
          la main, prestation réglée sur place…
        </p>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Client */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Nom du client *
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            E-mail du client
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
            Adresse du client
            <textarea rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={field} />
          </label>
        </div>

        {/* Numéro + date */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-gray-700">
            Date d'émission
            <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
            N° de facture
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Laisser vide pour un numéro automatique (FAC-AAAA-NNNNN)"
              className={field}
            />
            <span className="mt-1 block text-xs text-gray-400">
              Pour reprendre une facture déjà émise, saisissez son numéro d'origine.
            </span>
          </label>
        </div>

        {/* Lignes */}
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-[1fr_70px_100px_70px_100px_32px] gap-2 text-xs font-medium uppercase text-gray-400">
            <span>Désignation</span>
            <span>Qté</span>
            <span>PU TTC</span>
            <span>TVA</span>
            <span className="text-right">Total TTC</span>
            <span />
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_100px_70px_100px_32px] items-center gap-2">
              <input
                required
                value={l.designation}
                onChange={(e) => setLine(i, { designation: e.target.value })}
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
                value={l.unitPriceTtc}
                onChange={(e) => setLine(i, { unitPriceTtc: Number(e.target.value) })}
                className="rounded-lg border px-2 py-2 text-sm outline-none focus:border-purple-500"
              />
              <select
                value={l.vatRate}
                onChange={(e) => setLine(i, { vatRate: Number(e.target.value) })}
                className="rounded-lg border px-1 py-2 text-sm outline-none focus:border-purple-500"
              >
                <option value={10}>10 %</option>
                <option value={20}>20 %</option>
              </select>
              <span className="text-right text-sm font-medium">{eur(l.qty * l.unitPriceTtc)}</span>
              <button
                type="button"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={lines.length === 1}
                className="text-gray-400 hover:text-rose-500 disabled:opacity-30"
                aria-label="Supprimer la ligne"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setLines((prev) => [...prev, { designation: '', qty: 1, unitPriceTtc: 0, vatRate: 20 }])
            }
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            + Ajouter une ligne
          </button>
          <p className="text-xs text-gray-400">TVA : 10 % pour l'hébergement, 20 % pour l'animation / les ateliers.</p>
        </div>

        {/* Totaux */}
        <div className="mt-6 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total HT</span>
            <span>{eur(inv.totalHt)}</span>
          </div>
          {inv.vatBreakdown.map((g) => (
            <div key={g.rate} className="flex justify-between text-gray-600">
              <span>TVA {g.rate} %</span>
              <span>{eur(g.vat)}</span>
            </div>
          ))}
          <div className="flex justify-between rounded-lg bg-purple-50 px-3 py-2 font-bold text-purple-700">
            <span>Total TTC</span>
            <span>{eur(inv.totalTtc)}</span>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Échéance de paiement (jours)
            <input type="number" min={1} value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} className={field} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Note (optionnel)
            <input value={note} onChange={(e) => setNote(e.target.value)} className={field} />
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} />
            Facture déjà réglée (le montant total est enregistré comme payé)
          </label>
          {alreadyPaid && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-gray-700">
                Mode de règlement
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className={field}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-gray-700">
                Date du règlement
                <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={field} />
              </label>
            </div>
          )}
          <label className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} />
            Envoyer la facture par e-mail au client
          </label>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => run(true, window.open('', '_blank'))}
            disabled={previewing || busy}
            className="rounded-lg border border-purple-300 px-6 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60"
          >
            {previewing ? 'Génération…' : 'Prévisualiser le PDF'}
          </button>
          <button
            disabled={busy || previewing}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : send ? 'Créer et envoyer la facture' : 'Créer la facture'}
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
