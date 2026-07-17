import type { Reservation, EventRow } from '../types/db'

const sameMonth = (iso: string, now: Date) => {
  const d = new Date(iso)
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth()
  )
}

export function reservationsThisMonth(res: Reservation[], now: Date): number {
  return res.filter((r) => sameMonth(r.created_at, now)).length
}

export function revenueThisMonth(res: Reservation[], now: Date): number {
  return res
    .filter((r) => r.status === 'confirmed' && sameMonth(r.created_at, now))
    .reduce((s, r) => s + Number(r.amount), 0)
}

export function occupancyRate(
  res: Reservation[],
  now: Date,
  capacityNights: number,
): number {
  const nights = res
    .filter((r) => r.status === 'confirmed' && sameMonth(r.arrival_date, now))
    .reduce((s, r) => {
      if (!r.departure_date) return s + 1
      const a = new Date(r.arrival_date).getTime()
      const b = new Date(r.departure_date).getTime()
      return s + Math.max(1, Math.round((b - a) / 86400000))
    }, 0)
  if (capacityNights <= 0) return 0
  return Math.round((nights / capacityNights) * 1000) / 10
}

export function activeEvents(events: EventRow[], now: Date): number {
  const today = now.toISOString().slice(0, 10)
  return events.filter(
    (e) => e.published && e.event_date && e.event_date >= today,
  ).length
}
