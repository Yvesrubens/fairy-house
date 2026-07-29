import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import ImageUpload from '../components/ImageUpload'
import {
  upsertIntervenant,
  listDomains,
  addDomain,
  updateDomain,
  deleteDomain,
} from '../../lib/api'
import type { Intervenant, IntervenantDomain } from '../../types/db'

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
  const [domains, setDomains] = useState<IntervenantDomain[]>([])
  const [managing, setManaging] = useState(false)
  const [newDomain, setNewDomain] = useState('')

  function set<K extends keyof Intervenant>(key: K, value: Intervenant[K]) {
    setRow((prev) => ({ ...prev, [key]: value }))
  }

  async function reloadDomains() {
    try {
      setDomains(await listDomains())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    reloadDomains()
  }, [])

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

  async function onAddDomain() {
    const name = newDomain.trim()
    if (!name) return
    try {
      await addDomain(name)
      setNewDomain('')
      await reloadDomains()
      set('domain', name)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function onRenameDomain(d: IntervenantDomain) {
    const name = prompt('Renommer le domaine', d.name)?.trim()
    if (!name || name === d.name) return
    try {
      await updateDomain(d.id, name)
      if (row.domain === d.name) set('domain', name)
      await reloadDomains()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function onDeleteDomain(d: IntervenantDomain) {
    if (!confirm(`Supprimer le domaine « ${d.name} » ?`)) return
    try {
      await deleteDomain(d.id)
      if (row.domain === d.name) set('domain', '')
      await reloadDomains()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  // Garantit que le domaine déjà enregistré reste sélectionnable même s'il
  // n'est pas (encore) dans la table des domaines.
  const options = domains.map((d) => d.name)
  if (row.domain && !options.includes(row.domain)) options.unshift(row.domain)

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

      {/* Domaine : liste gérée pour éviter les doublons dus aux fautes de frappe */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Domaine</label>
          <button
            type="button"
            onClick={() => setManaging((v) => !v)}
            className="text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            {managing ? 'Fermer' : 'Gérer les domaines'}
          </button>
        </div>
        <select
          required
          value={row.domain ?? ''}
          onChange={(e) => set('domain', e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
        >
          <option value="">— Choisir un domaine —</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {managing && (
          <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="flex gap-2">
              <input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Nouveau domaine"
                className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={onAddDomain}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Ajouter
              </button>
            </div>
            <ul className="divide-y">
              {domains.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-gray-800">{d.name}</span>
                  <span className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onRenameDomain(d)}
                      className="font-medium text-purple-600 hover:text-purple-700"
                    >
                      Renommer
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDomain(d)}
                      className="font-medium text-rose-500 hover:text-rose-600"
                    >
                      Supprimer
                    </button>
                  </span>
                </li>
              ))}
              {domains.length === 0 && (
                <li className="py-2 text-gray-500">Aucun domaine pour le moment.</li>
              )}
            </ul>
          </div>
        )}
      </div>

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
