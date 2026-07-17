import type { ReactNode } from 'react'
import { TrendIcon } from '../icons'

export type StatColor = 'blue' | 'green' | 'purple' | 'pink'

const COLORS: Record<StatColor, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  pink: 'bg-pink-50 text-pink-600',
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'purple',
  trend = '0%',
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  color?: StatColor
  trend?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${COLORS[color]}`}
        >
          {icon}
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-green-600">
          <TrendIcon width={14} height={14} />
          {trend}
        </span>
      </div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  )
}
