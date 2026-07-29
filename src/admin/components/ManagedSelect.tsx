import { useState } from 'react'

// Select adossé à une liste gérée (ajout / renommage / suppression). Utilisé
// pour les catégories d'événements (F8). Le parent fournit les éléments et les
// callbacks CRUD ; ce composant gère uniquement l'UI.

interface Item {
  id: string
  name: string
}

export default function ManagedSelect({
  label,
  value,
  onChange,
  items,
  onAdd,
  onRename,
  onDelete,
  placeholder = 'Nouvel élément',
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: Item[]
  onAdd: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  placeholder?: string
  required?: boolean
}) {
  const [managing, setManaging] = useState(false)
  const [draft, setDraft] = useState('')

  const options = items.map((i) => i.name)
  if (value && !options.includes(value)) options.unshift(value)

  async function add() {
    const name = draft.trim()
    if (!name) return
    try {
      await onAdd(name)
      setDraft('')
      onChange(name)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function rename(item: Item) {
    const name = prompt(`Renommer « ${item.name} »`, item.name)?.trim()
    if (!name || name === item.name) return
    try {
      await onRename(item.id, name)
      if (value === item.name) onChange(name)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function del(item: Item) {
    if (!confirm(`Supprimer « ${item.name} » ?`)) return
    try {
      await onDelete(item.id)
      if (value === item.name) onChange('')
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={() => setManaging((v) => !v)}
          className="text-xs font-medium text-purple-600 hover:text-purple-700"
        >
          {managing ? 'Fermer' : 'Gérer'}
        </button>
      </div>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
      >
        <option value="">— Aucune —</option>
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
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={add}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
            >
              Ajouter
            </button>
          </div>
          <ul className="divide-y">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-800">{item.name}</span>
                <span className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => rename(item)}
                    className="font-medium text-purple-600 hover:text-purple-700"
                  >
                    Renommer
                  </button>
                  <button
                    type="button"
                    onClick={() => del(item)}
                    className="font-medium text-rose-500 hover:text-rose-600"
                  >
                    Supprimer
                  </button>
                </span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-2 text-gray-500">Aucun élément.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
