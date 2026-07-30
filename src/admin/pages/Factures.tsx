import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { listFactures, updateFacture } from '../../lib/api'
import { formatDate, formatEuro2, toCSV } from '../../lib/format'
import { openPdfBase64 } from '../../lib/pdf'
import type { FactureRow } from '../../types/db'

interface Line {
  designation: string
  qty: number
  unitPrice: number
  vatRate: number
}
const round2 = (v: number) => Math.round(v * 100) / 100

// Écran de gestion des factures émises (point 12) : liste, export, visualisation
// du PDF et modification a posteriori des lignes.
export default function Factures() {
  const [rows, setRows] = useState<FactureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<FactureRow | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await listFactures())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  function buildRows() {
    return rows.map((f) => ({
      reference: f.reference,
      client: f.client_name ?? '',
      email: f.client_email ?? '',
      total_ht: f.total_ht,
      total_ttc: f.total_ttc,
      emise_le: f.issued_at ? formatDate(f.issued_at) : formatDate(f.created_at),
    }))
  }
  function exportCSV() {
    const blob = new Blob(
      [toCSV(buildRows() as unknown as Record<string, string | number>[])],
      { type: 'text/csv;charset=utf-8;' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'factures.csv'
    a.click()
    URL.revokeObjectURL(url)
  }
  function exportXLSX() {
    const ws = XLSX.utils.json_to_sheet(buildRows())
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Factures')
    XLSX.writeFile(wb, 'factures.xlsx')
  }

  async function viewPdf(f: FactureRow, win: Window | null) {
    setViewing(f.id)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      const res = await fetch('/api/facture-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ factureId: f.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Échec de génération du PDF')
      openPdfBase64(body.pdf, win)
    } catch (e) {
      if (win) win.close()
      alert((e as Error).message)
    } finally {
      setViewing(null)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  return (
    <div>
      {editing && (
        <FactureEdit
          facture={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await load()
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Exporter CSV
          </button>
          <button
            onClick={exportXLSX}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Exporter Excel
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">N°</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Émise le</th>
              <th className="px-6 py-4">Total TTC</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  Aucune facture émise.
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{f.reference}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{f.client_name}</div>
                  <div className="text-gray-500">{f.client_email}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {f.issued_at ? formatDate(f.issued_at) : formatDate(f.created_at)}
                </td>
                <td className="px-6 py-4 text-gray-700">{formatEuro2(f.total_ttc)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => viewPdf(f, window.open('', '_blank'))}
                      disabled={viewing === f.id}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                    >
                      {viewing === f.id ? 'Génération…' : 'Voir le PDF'}
                    </button>
                    <button
                      onClick={() => setEditing(f)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Modifier
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

// Modification a posteriori des lignes d'une facture (recalcule les totaux).
function FactureEdit({
  facture,
  onSaved,
  onCancel,
}: {
  facture: FactureRow
  onSaved: () => void
  onCancel: () => void
}) {
  const [lines, setLines] = useState<Line[]>(
    facture.lines.map((l) => ({
      designation: l.designation,
      qty: l.qty,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate ?? 20,
    })),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function setLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  const totalHt = round2(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0))
  const totalTva = round2(
    lines.reduce((s, l) => s + (l.qty * l.unitPrice * l.vatRate) / 100, 0),
  )
  const totalTtc = round2(totalHt + totalTva)
  const mainRate =
    [...lines].sort((a, b) => b.qty * b.unitPrice - a.qty * a.unitPrice)[0]?.vatRate ?? 20

  async function save() {
    setBusy(true)
    setError('')
    try {
      await updateFacture(facture.id, {
        lines,
        total_ht: totalHt,
        total_ttc: totalTtc,
        vat_rate: mainRate,
      })
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Modifier la facture — {facture.reference}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          La modification conserve le numéro de facture. Réémettez le PDF via
          « Voir le PDF » après enregistrement.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 space-y-3">
          {lines.map((l, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_56px_84px_70px] items-center gap-2"
            >
              <input
                value={l.designation}
                onChange={(e) => setLine(i, { designation: e.target.value })}
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
              <input
                type="number"
                value={l.qty}
                onChange={(e) => setLine(i, { qty: Number(e.target.value) })}
                className="rounded-lg border px-2 py-2 text-sm outline-none focus:border-purple-500"
              />
              <input
                type="number"
                value={l.unitPrice}
                onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })}
                className="rounded-lg border px-2 py-2 text-sm outline-none focus:border-purple-500"
              />
              <select
                value={l.vatRate}
                onChange={(e) => setLine(i, { vatRate: Number(e.target.value) })}
                className="rounded-lg border px-1 py-2 text-sm outline-none focus:border-purple-500"
              >
                <option value={10}>10%</option>
                <option value={20}>20%</option>
              </select>
            </div>
          ))}
        </div>
        <div className="mt-6 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total HT</span>
            <span>{formatEuro2(totalHt)}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-purple-50 px-3 py-2 font-bold text-purple-700">
            <span>Total TTC</span>
            <span>{formatEuro2(totalTtc)}</span>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
