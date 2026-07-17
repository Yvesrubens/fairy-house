import { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import EventForm from './EventForm'
import { listAllEvents, deleteEvent } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { EventRow } from '../../types/db'

export default function Events() {
  const [rows, setRows] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null)

  async function load() {
    setLoading(true)
    try {
      setRows(await listAllEvents())
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
    if (!confirm('Supprimer cet événement ?')) return
    await deleteEvent(id)
    load()
  }

  const columns: Column<EventRow>[] = [
    { key: 'title', label: 'Titre' },
    {
      key: 'event_date',
      label: 'Date',
      render: (r) => (r.event_date ? formatDate(r.event_date) : '—'),
    },
    {
      key: 'published',
      label: 'Publié',
      render: (r) => (r.published ? 'Oui' : 'Non'),
    },
  ]

  if (editing)
    return (
      <EventForm
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
        <h1 className="text-3xl font-bold text-gray-900">Événements</h1>
        <button
          onClick={() => setEditing({ published: false })}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Nouvel événement
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
            empty="Aucun événement."
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
