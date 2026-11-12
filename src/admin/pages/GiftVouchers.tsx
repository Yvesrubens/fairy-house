import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import {
  listGiftVouchers,
  listGiftVoucherUses,
  addGiftVoucherUse,
  deleteGiftVoucherUse,
  setGiftVoucherStatus,
} from '../../lib/api'
import { formatDate, formatEuro2 } from '../../lib/format'
import { openPdfBase64 } from '../../lib/pdf'
import { voucherState } from '../../../api/_lib/gift-core'
import type { VoucherState } from '../../../api/_lib/gift-core'
import type { GiftVoucher, GiftVoucherUse } from '../../types/db'

// Registre des bons cadeaux : recherche par numéro, solde, validité,
// enregistrement des utilisations (déduction manuelle), renvoi du PDF.

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATE_UI: Record<VoucherState, { label: string; cls: string }> = {
  en_attente: { label: 'Paiement non finalisé', cls: 'bg-gray-100 text-gray-500' },
  annule: { label: 'Annulé', cls: 'bg-gray-100 text-gray-500' },
  utilise: { label: 'Utilisé', cls: 'bg-blue-100 text-blue-700' },
  expire: { label: 'Expiré', cls: 'bg-rose-100 text-rose-700' },
  partiel: { label: 'Partiellement utilisé', cls: 'bg-amber-100 text-amber-700' },
  actif: { label: 'Actif', cls: 'bg-green-100 text-green-700' },
}

async function adminAction(voucherId: string, action: 'pdf' | 'resend') {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/api/gift-voucher-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token}`,
    },
    body: JSON.stringify({ voucherId, action }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Action impossible')
  return body as { pdf?: string }
}

export default function GiftVouchers() {
  const [rows, setRows] = useState<GiftVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showPending, setShowPending] = useState(false)
  const [open, setOpen] = useState<GiftVoucher | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await listGiftVouchers())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const t = today()
  const q = search.trim().toUpperCase()
  const filtered = rows
    .filter((v) => showPending || v.status !== 'pending')
    .filter(
      (v) =>
        !q ||
        v.code.toUpperCase().includes(q) ||
        v.buyer_name.toUpperCase().includes(q) ||
        (v.recipient_name ?? '').toUpperCase().includes(q),
    )

  const active = rows.filter((v) => ['actif', 'partiel'].includes(voucherState(v, t)))
  const outstanding = active.reduce((s, v) => s + Number(v.balance), 0)

  return (
    <div>
      {open && (
        <VoucherDetail
          voucher={open}
          onClose={async (changed) => {
            setOpen(null)
            if (changed) await load()
          }}
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900">Bons cadeaux</h1>
      <p className="mt-2 text-sm text-gray-600">
        Bons vendus en ligne. Quand un·e bénéficiaire réserve avec un bon, retrouvez-le
        par son numéro et enregistrez l’utilisation : le solde se met à jour.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Bons en cours de validité</div>
          <div className="text-2xl font-bold text-gray-900">{active.length}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm text-gray-500">Solde restant à honorer</div>
          <div className="text-2xl font-bold text-gray-900">{formatEuro2(outstanding)}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un numéro (FH-…), un acheteur, un bénéficiaire"
          className="w-full max-w-md rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showPending} onChange={(e) => setShowPending(e.target.checked)} />
          Afficher les paiements non finalisés
        </label>
      </div>

      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">N°</th>
              <th className="px-6 py-4">Acheteur → bénéficiaire</th>
              <th className="px-6 py-4">Montant</th>
              <th className="px-6 py-4">Solde</th>
              <th className="px-6 py-4">Valable jusqu’au</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Chargement…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Aucun bon cadeau.</td>
              </tr>
            ) : (
              filtered.map((v) => {
                const st = STATE_UI[voucherState(v, t)]
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-medium text-gray-800">{v.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{v.buyer_name}</div>
                      <div className="text-gray-500">{v.recipient_name ? `→ ${v.recipient_name}` : v.buyer_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{formatEuro2(v.amount)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatEuro2(v.balance)}</td>
                    <td className="px-6 py-4 text-gray-700">{v.expires_at ? formatDate(v.expires_at) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setOpen(v)} className="text-sm font-medium text-purple-600 hover:text-purple-700">
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VoucherDetail({
  voucher,
  onClose,
}: {
  voucher: GiftVoucher
  onClose: (changed: boolean) => void
}) {
  const [uses, setUses] = useState<GiftVoucherUse[]>([])
  const [balance, setBalance] = useState(Number(voucher.balance))
  const [changed, setChanged] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState(Number(voucher.balance))
  const [usedAt, setUsedAt] = useState(today())
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')

  const state = voucherState({ ...voucher, balance }, today())
  const canUse = state === 'actif' || state === 'partiel'

  async function load() {
    try {
      const u = await listGiftVoucherUses(voucher.id)
      setUses(u)
      const b = Math.round((Number(voucher.amount) - u.reduce((s, x) => s + Number(x.amount), 0)) * 100) / 100
      setBalance(b)
      setAmount(b)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addUse(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!(amount > 0) || amount > balance + 0.001) {
      setError(`Montant entre 0 et le solde restant (${formatEuro2(balance)}).`)
      return
    }
    setBusy(true)
    try {
      await addGiftVoucherUse({
        voucher_id: voucher.id,
        amount: Math.round(amount * 100) / 100,
        used_at: usedAt,
        reservation_ref: ref.trim() || null,
        note: note.trim() || null,
      })
      setRef('')
      setNote('')
      setChanged(true)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function removeUse(u: GiftVoucherUse) {
    if (!confirm(`Supprimer l’utilisation de ${formatEuro2(u.amount)} du ${formatDate(u.used_at)} ?`)) return
    try {
      await deleteGiftVoucherUse(u.id)
      setChanged(true)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function run(action: 'pdf' | 'resend') {
    setError('')
    setInfo('')
    const win = action === 'pdf' ? window.open('', '_blank') : null
    try {
      const r = await adminAction(voucher.id, action)
      if (action === 'pdf' && r.pdf) openPdfBase64(r.pdf, win)
      if (action === 'resend') setInfo(`Bon renvoyé à ${voucher.buyer_email}.`)
    } catch (err) {
      if (win) win.close()
      setError((err as Error).message)
    }
  }

  async function cancel() {
    if (!confirm(`Annuler le bon ${voucher.code} ? Il ne pourra plus être utilisé.`)) return
    try {
      await setGiftVoucherStatus(voucher.id, 'cancelled')
      onClose(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const st = STATE_UI[state]
  const field = 'mt-1 w-full rounded-lg border bg-white px-3 py-2 outline-none focus:border-purple-500'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Bon <span className="font-mono">{voucher.code}</span>
          </h2>
          <button onClick={() => onClose(changed)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>

        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Montant</div>
            <div className="text-lg font-bold text-gray-900">{formatEuro2(voucher.amount)}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Solde</div>
            <div className="text-lg font-bold text-gray-900">{formatEuro2(balance)}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="text-gray-500">Valable jusqu’au</div>
            <div className="text-lg font-bold text-gray-900">{voucher.expires_at ? formatDate(voucher.expires_at) : '—'}</div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-[140px_1fr] gap-y-1 text-sm">
          <dt className="text-gray-500">Acheteur</dt>
          <dd className="text-gray-800">{voucher.buyer_name} · {voucher.buyer_email}</dd>
          <dt className="text-gray-500">Bénéficiaire</dt>
          <dd className="text-gray-800">{voucher.recipient_name || '—'}</dd>
          <dt className="text-gray-500">Acheté le</dt>
          <dd className="text-gray-800">{voucher.paid_at ? formatDate(voucher.paid_at) : 'paiement non finalisé'}</dd>
          {voucher.message && (
            <>
              <dt className="text-gray-500">Message</dt>
              <dd className="text-gray-800 italic">« {voucher.message} »</dd>
            </>
          )}
        </dl>

        {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {info && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>}

        <p className="mt-6 text-sm font-semibold text-gray-700">Utilisations</p>
        {uses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Aucune utilisation enregistrée.</p>
        ) : (
          <ul className="mt-2 divide-y rounded-xl border">
            {uses.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-gray-700">
                  {formatDate(u.used_at)}
                  {u.reservation_ref ? ` · ${u.reservation_ref}` : ''}
                  {u.note ? <span className="text-gray-400"> — {u.note}</span> : null}
                </span>
                <span className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">−{formatEuro2(u.amount)}</span>
                  <button onClick={() => removeUse(u)} className="text-xs font-medium text-rose-500 hover:text-rose-600">
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {canUse ? (
          <form onSubmit={addUse} className="mt-5 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <p className="text-sm font-semibold text-gray-700">Enregistrer une utilisation</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm text-gray-700">
                Montant déduit (€)
                <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={field} />
              </label>
              <label className="block text-sm text-gray-700">
                Date
                <input type="date" value={usedAt} onChange={(e) => setUsedAt(e.target.value)} className={field} />
              </label>
              <label className="block text-sm text-gray-700">
                Réservation / facture
                <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ex. RES-2026-…" className={field} />
              </label>
            </div>
            <label className="mt-3 block text-sm text-gray-700">
              Note (optionnel)
              <input value={note} onChange={(e) => setNote(e.target.value)} className={field} />
            </label>
            <button disabled={busy} className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
              {busy ? 'Enregistrement…' : 'Déduire du bon'}
            </button>
          </form>
        ) : (
          state === 'expire' && (
            <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Ce bon a expiré le {voucher.expires_at ? formatDate(voucher.expires_at) : ''}. Vous pouvez
              tout de même décider d’un geste commercial hors de cet outil.
            </p>
          )
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {voucher.status === 'active' && (
            <>
              <button onClick={() => run('pdf')} className="rounded-lg border border-purple-300 px-5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                Voir le PDF
              </button>
              <button onClick={() => run('resend')} className="rounded-lg border border-purple-300 px-5 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                Renvoyer à l’acheteur
              </button>
              <button onClick={cancel} className="rounded-lg border border-rose-200 px-5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
                Annuler le bon
              </button>
            </>
          )}
          <button onClick={() => onClose(changed)} className="ml-auto rounded-lg border px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
