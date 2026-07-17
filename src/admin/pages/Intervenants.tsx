import { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import IntervenantForm from './IntervenantForm'
import { listAllIntervenants, deleteIntervenant } from '../../lib/api'
import type { Intervenant } from '../../types/db'

export default function Intervenants() {
  const [rows, setRows] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Partial<Intervenant> | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await listAllIntervenants())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    if (!confirm('Supprimer cet·te accompagnant·e ?')) return
    await deleteIntervenant(id)
    load()
  }

  const columns: Column<Intervenant>[] = [
    { key: 'name', label: 'Nom' },
    { key: 'domain', label: 'Domaine' },
    {
      key: 'published',
      label: 'Publié',
      render: (r) => (r.published ? 'Oui' : 'Non'),
    },
  ]

  if (editing)
    return (
      <IntervenantForm
        initial={editing}
        onSaved={() => {
          setEditing(null)
          load()
        }}
        onCancel={() => setEditing(null)}
      />
    )

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Intervenants</h1>
        <button
          onClick={() => setEditing({ published: true })}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Nouvel accompagnant·e
        </button>
      </div>
      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>
      )}
      <div className="mt-6">
        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            empty="Aucun·e accompagnant·e."
            renderActions={(r) => (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(r)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="text-sm font-medium text-rose-500 hover:text-rose-600"
                >
                  Supprimer
                </button>
              </div>
            )}
          />
        )}
      </div>
    </div>
  )
}
