import type { ReactNode } from 'react'
import { TrendIcon } from '../icons'

export type StatColor = 'blue' | 'green' | 'purple' | 'pink'

const STYLES: Record<StatColor, { card: string; badge: string }> = {
  blue: { card: 'from-blue-50', badge: 'bg-blue-500 text-white' },
  green: { card: 'from-green-50', badge: 'bg-green-500 text-white' },
  purple: { card: 'from-purple-50', badge: 'bg-purple-500 text-white' },
  pink: { card: 'from-pink-50', badge: 'bg-pink-500 text-white' },
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
  const s = STYLES[color]
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${s.card} to-white p-6 shadow-sm transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${s.badge}`}
        >
          {icon}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs font-medium text-green-600">
          <TrendIcon width={12} height={12} />
          {trend}
        </span>
      </div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  )
}
