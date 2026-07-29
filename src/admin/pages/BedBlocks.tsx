import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { listBedBlocks, createBedBlock, deleteBedBlock } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { BedBlock } from '../../types/db'

// Blocage manuel de lits (F3) : réservations hors tunnel (Airbnb, amis…). Les
// lits bloqués sont décomptés de la disponibilité (via la fonction SQL).
export default function BedBlocks() {
  const [rows, setRows] = useState<BedBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    beds: '1',
    label: '',
  })

  async function load() {
    setLoading(true)
    try {
      setRows(await listBedBlocks())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.end_date <= form.start_date) {
      setError('La date de fin doit être postérieure à la date de début.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await createBedBlock({
        start_date: form.start_date,
        end_date: form.end_date,
        beds: Number(form.beds) || 1,
        label: form.label || undefined,
      })
      setForm({ start_date: '', end_date: '', beds: '1', label: '' })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce blocage ?')) return
    try {
      await deleteBedBlock(id)
      setRows((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const inputCls =
    'rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500'

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Blocage manuel de lits</h1>
      <p className="mt-2 text-gray-600">
        Bloquez des lits en dehors du tunnel de réservation (Airbnb, proches…).
        Ces lits sont retirés de la disponibilité en ligne. La date de fin est
        exclusive (dernière nuit = veille de la date de fin).
      </p>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 sm:grid-cols-5 sm:items-end"
      >
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Début
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Fin (exclusive)
          <input
            type="date"
            required
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Lits
          <input
            type="number"
            min={1}
            max={11}
            required
            value={form.beds}
            onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-600">
          Libellé
          <input
            type="text"
            placeholder="Airbnb, amis…"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className={inputCls}
          />
        </label>
        <button
          disabled={busy}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Ajout…' : 'Bloquer'}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Début</th>
              <th className="px-6 py-4">Fin</th>
              <th className="px-6 py-4">Lits</th>
              <th className="px-6 py-4">Libellé</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  Aucun blocage.
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700">{formatDate(b.start_date)}</td>
                <td className="px-6 py-4 text-gray-700">{formatDate(b.end_date)}</td>
                <td className="px-6 py-4 text-gray-700">{b.beds}</td>
                <td className="px-6 py-4 text-gray-700">{b.label ?? '—'}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => remove(b.id)}
                    className="text-sm font-medium text-rose-500 hover:text-rose-600"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
