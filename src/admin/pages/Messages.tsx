import { useEffect, useMemo, useState } from 'react'
import { listMessages, updateMessage, deleteMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { MessageRow } from '../../types/db'

type Filter = 'actifs' | 'non-lus' | 'non-traites' | 'archives'

export default function Messages() {
  const [rows, setRows] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('actifs')

  useEffect(() => {
    listMessages()
      .then(setRows)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'archives':
        return rows.filter((m) => m.archived)
      case 'non-lus':
        return rows.filter((m) => !m.archived && !m.read)
      case 'non-traites':
        return rows.filter((m) => !m.archived && !m.treated)
      default:
        return rows.filter((m) => !m.archived)
    }
  }, [rows, filter])

  async function patch(
    id: string,
    p: Partial<Pick<MessageRow, 'read' | 'treated' | 'archived'>>,
  ) {
    try {
      await updateMessage(id, p)
      setRows((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)))
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer définitivement ce message ?')) return
    try {
      await deleteMessage(id)
      setRows((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      alert((err as Error).message)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'actifs', label: 'Actifs' },
    { key: 'non-lus', label: 'Non lus' },
    { key: 'non-traites', label: 'Non traités' },
    { key: 'archives', label: 'Archivés' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Messages</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f.key
                ? 'bg-purple-600 text-white'
                : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl border bg-white px-6 py-12 text-center text-gray-500">
            Aucun message.
          </div>
        )}
        {filtered.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border bg-white p-6 ${
              !m.read && !m.archived ? 'border-l-4 border-l-purple-500' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-800">
                {m.first_name} {m.last_name}
              </span>
              <div className="flex items-center gap-2">
                {!m.read && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Non lu
                  </span>
                )}
                {m.treated && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Traité
                  </span>
                )}
                <span className="text-sm text-gray-400">
                  {formatDate(m.created_at)}
                </span>
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {m.email}
              {m.phone ? ` · ${m.phone}` : ''}
              {m.subject ? ` · ${m.subject}` : ''}
            </div>
            <p className="mt-3 whitespace-pre-line text-gray-700">{m.body}</p>

            <div className="mt-4 flex flex-wrap gap-3 border-t pt-4 text-sm font-medium">
              <button
                onClick={() => patch(m.id, { read: !m.read })}
                className="text-purple-600 hover:text-purple-700"
              >
                {m.read ? 'Marquer non lu' : 'Marquer lu'}
              </button>
              <button
                onClick={() => patch(m.id, { treated: !m.treated })}
                className="text-green-600 hover:text-green-700"
              >
                {m.treated ? 'Marquer non traité' : 'Marquer traité'}
              </button>
              <button
                onClick={() => patch(m.id, { archived: !m.archived })}
                className="text-gray-600 hover:text-gray-800"
              >
                {m.archived ? 'Désarchiver' : 'Archiver'}
              </button>
              <button
                onClick={() => remove(m.id)}
                className="text-rose-500 hover:text-rose-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
