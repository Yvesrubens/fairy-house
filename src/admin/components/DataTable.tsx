import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  renderActions,
  empty = 'Aucun élément.',
}: {
  columns: Column<T>[]
  rows: T[]
  renderActions?: (row: T) => ReactNode
  empty?: string
}) {
  if (rows.length === 0)
    return (
      <div className="rounded-2xl border bg-white px-6 py-12 text-center text-gray-500">
        {empty}
      </div>
    )

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs uppercase tracking-wider text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-6 py-4 font-medium">
                {c.label}
              </th>
            ))}
            {renderActions && <th className="px-6 py-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-6 py-4 text-gray-700">
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
              {renderActions && (
                <td className="px-6 py-4">{renderActions(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
