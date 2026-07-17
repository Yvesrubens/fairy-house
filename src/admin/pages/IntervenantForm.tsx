import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { upsertIntervenant } from '../../lib/api'
import type { Intervenant } from '../../types/db'

export default function IntervenantForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Partial<Intervenant>
  onSaved: () => void
  onCancel: () => void
}) {
  const [row, setRow] = useState<Partial<Intervenant>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Intervenant>(key: K, value: Intervenant[K]) {
    setRow((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await upsertIntervenant(row)
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border bg-white p-6"
    >
      <h2 className="text-lg font-bold text-gray-900">
        {row.id ? 'Modifier' : 'Nouvel'} accompagnant·e
      </h2>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Field
        label="Nom"
        value={row.name ?? ''}
        onChange={(v) => set('name', v)}
        required
      />
      <Field
        label="Domaine"
        value={row.domain ?? ''}
        onChange={(v) => set('domain', v)}
        required
      />
      <Field
        label="Bio"
        textarea
        value={row.bio ?? ''}
        onChange={(v) => set('bio', v)}
      />
      <Field
        label="Tarif"
        value={row.price ?? ''}
        onChange={(v) => set('price', v)}
      />
      <Field
        label="Site web"
        value={row.website ?? ''}
        onChange={(v) => set('website', v)}
      />
      <ImageUpload
        value={row.photo_url ?? null}
        onChange={(url) => set('photo_url', url)}
      />
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={row.published ?? true}
          onChange={(e) => set('published', e.target.checked)}
        />
        Publié
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
