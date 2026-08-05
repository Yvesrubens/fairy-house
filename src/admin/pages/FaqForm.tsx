import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import { upsertFaq } from '../../lib/api'
import type { Faq } from '../../types/db'

export default function FaqForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Partial<Faq>
  onSaved: () => void
  onCancel: () => void
}) {
  const [row, setRow] = useState<Partial<Faq>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Faq>(key: K, value: Faq[K]) {
    setRow((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await upsertFaq(row)
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        {row.id ? 'Modifier la' : 'Nouvelle'} question
      </h2>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <Field
        label="Question"
        value={row.question ?? ''}
        onChange={(v) => set('question', v)}
        required
      />
      <Field
        label="Réponse"
        textarea
        value={row.answer ?? ''}
        onChange={(v) => set('answer', v)}
        required
      />

      <label className="block text-sm font-medium text-gray-700">
        Ordre d'affichage
        <input
          type="number"
          value={row.position ?? 0}
          onChange={(e) => set('position', Number(e.target.value))}
          className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Les questions sont affichées par ordre croissant (0, 1, 2…).
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={row.published ?? true}
          onChange={(e) => set('published', e.target.checked)}
        />
        Publiée
      </label>

      <div className="flex gap-3">
        <button
          disabled={busy}
          className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
