import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import { upsertEvent } from '../../lib/api'
import { slugify } from '../../lib/format'
import type { EventRow } from '../../types/db'

export default function EventForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Partial<EventRow>
  onSaved: () => void
  onCancel: () => void
}) {
  const [row, setRow] = useState<Partial<EventRow>>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof EventRow>(key: K, value: EventRow[K]) {
    setRow((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const slug = row.slug?.trim() || slugify(row.title ?? '')
      await upsertEvent({ ...row, slug })
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
        {row.id ? 'Modifier' : 'Nouvel'} événement
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
        label="Date"
        type="date"
        value={row.event_date ?? ''}
        onChange={(v) => set('event_date', v)}
      />
      <Field
        label="Lieu"
        value={row.location ?? ''}
        onChange={(v) => set('location', v)}
      />
      <Field
        label="Nombre de places (quota)"
        type="number"
        value={row.capacity != null ? String(row.capacity) : ''}
        onChange={(v) => set('capacity', v ? Number(v) : null)}
      />
      <Field
        label="Description"
        textarea
        value={row.description ?? ''}
        onChange={(v) => set('description', v)}
      />
      <Field
        label="Contenu"
        textarea
        value={row.content ?? ''}
        onChange={(v) => set('content', v)}
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

      {/* --- Inscription payante (événement) --- */}
      <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="text-sm font-bold text-gray-900">
          Inscription payante (prix TTC, TVA incluse)
        </h3>
        <Field
          label="Prix de l'inscription TTC (€) — part animation, TVA 20 %"
          type="number"
          value={row.event_price_ttc != null ? String(row.event_price_ttc) : ''}
          onChange={(v) => set('event_price_ttc', v ? Number(v) : null)}
        />
        <Field
          label="Hébergement en tente — prix TTC (€), TVA 10 %"
          type="number"
          value={
            row.accommodation_tente_ttc != null
              ? String(row.accommodation_tente_ttc)
              : ''
          }
          onChange={(v) => set('accommodation_tente_ttc', v ? Number(v) : null)}
        />
        <Field
          label="Chambre mixte partagée — prix TTC (€), TVA 10 %"
          type="number"
          value={
            row.accommodation_chambre_ttc != null
              ? String(row.accommodation_chambre_ttc)
              : ''
          }
          onChange={(v) => set('accommodation_chambre_ttc', v ? Number(v) : null)}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={row.shuttle_enabled ?? false}
            onChange={(e) => set('shuttle_enabled', e.target.checked)}
          />
          Proposer la navette (gare de Nogent-sur-Vernisson)
        </label>
        <Field
          label="Prix navette A/R TTC (€), TVA 10 %"
          type="number"
          value={row.shuttle_price_ttc != null ? String(row.shuttle_price_ttc) : ''}
          onChange={(v) => set('shuttle_price_ttc', v ? Number(v) : null)}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={row.split_payment_enabled ?? false}
            onChange={(e) => set('split_payment_enabled', e.target.checked)}
          />
          Autoriser le paiement en 2 fois
        </label>
        <Field
          label="Texte règlement intérieur (vide = texte par défaut)"
          textarea
          value={row.reglement_texte ?? ''}
          onChange={(v) => set('reglement_texte', v || null)}
        />
        <Field
          label="Texte droits à l'image (vide = texte par défaut)"
          textarea
          value={row.droits_image_texte ?? ''}
          onChange={(v) => set('droits_image_texte', v || null)}
        />
      </div>

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
