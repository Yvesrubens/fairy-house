import { useEffect, useState } from 'react'
import {
  listNewsletterSubscribers,
  deleteNewsletterSubscriber,
} from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { NewsletterSubscriber } from '../../types/db'

export default function Newsletter() {
  const [rows, setRows] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setRows(await listNewsletterSubscribers())
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
    if (!confirm('Supprimer cet abonné ?')) return
    await deleteNewsletterSubscriber(id)
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function exportCsv() {
    const header = 'email,source,date\n'
    const body = rows
      .map((r) => `${r.email},${r.source ?? ''},${r.created_at}`)
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter-fairy-house.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyAll() {
    navigator.clipboard.writeText(rows.map((r) => r.email).join(', '))
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Newsletter{' '}
          <span className="text-lg font-normal text-gray-400">
            ({rows.length})
          </span>
        </h1>
        {rows.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={copyAll}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Copier les emails
            </button>
            <button
              onClick={exportCsv}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Exporter en CSV
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Aucun abonné pour le moment.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Inscrit le</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {r.email}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{r.source ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
