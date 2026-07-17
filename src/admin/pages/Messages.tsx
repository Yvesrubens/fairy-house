import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'
import type { MessageRow } from '../../types/db'

export default function Messages() {
  const [rows, setRows] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
      <div className="mt-6 space-y-4">
        {rows.length === 0 && (
          <div className="rounded-2xl border bg-white px-6 py-12 text-center text-gray-500">
            Aucun message.
          </div>
        )}
        {rows.map((m) => (
          <div key={m.id} className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">
                {m.first_name} {m.last_name}
              </span>
              <span className="text-sm text-gray-400">
                {formatDate(m.created_at)}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {m.email}
              {m.phone ? ` · ${m.phone}` : ''}
              {m.subject ? ` · ${m.subject}` : ''}
            </div>
            <p className="mt-3 whitespace-pre-line text-gray-700">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
