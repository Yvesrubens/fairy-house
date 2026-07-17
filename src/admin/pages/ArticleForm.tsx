import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { upsertArticle } from '../../lib/api'
import { slugify } from '../../lib/format'
import type { Article } from '../../types/db'

export default function ArticleForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Partial<Article>
  onSaved: () => void
  onCancel: () => void
}) {
  const [row, setRow] = useState<Partial<Article>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof Article>(key: K, value: Article[K]) {
    setRow((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const slug = row.slug?.trim() || slugify(row.title ?? '')
      const published_at =
        row.published && !row.published_at
          ? new Date().toISOString()
          : (row.published_at ?? null)
      await upsertArticle({ ...row, slug, published_at })
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
        {row.id ? 'Modifier' : 'Nouvel'} article
      </h2>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Field
        label="Titre"
        value={row.title ?? ''}
        onChange={(v) => set('title', v)}
        required
      />
      <Field
        label="Extrait"
        textarea
        value={row.excerpt ?? ''}
        onChange={(v) => set('excerpt', v)}
      />
      <Field
        label="Contenu"
        textarea
        value={row.content ?? ''}
        onChange={(v) => set('content', v)}
        required
      />
      <ImageUpload
        value={row.image_url ?? null}
        onChange={(url) => set('image_url', url)}
      />
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={row.published ?? false}
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
