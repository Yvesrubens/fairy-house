import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import { listReservations, listAllEvents } from '../../lib/api'
import {
  reservationsThisMonth,
  revenueThisMonth,
  occupancyRate,
  activeEvents,
} from '../../lib/stats'
import { formatEuro, formatDate } from '../../lib/format'
import type { EventRow, Reservation } from '../../types/db'

// Capacité mensuelle indicative : ~2 chambres louables x 30 nuits.
const CAPACITY_NIGHTS = 60

export default function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([listReservations(), listAllEvents()])
      .then(([r, e]) => {
        setReservations(r)
        setEvents(e)
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Chargement…</p>
  if (error)
    return <p className="rounded bg-red-50 px-3 py-2 text-red-600">{error}</p>

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const upcoming = events
    .filter((e) => e.published && e.event_date && e.event_date >= today)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Réservations ce mois"
          value={String(reservationsThisMonth(reservations, now))}
        />
        <StatCard
          label="CA ce mois"
          value={formatEuro(revenueThisMonth(reservations, now))}
        />
        <StatCard
          label="Taux d'occupation"
          value={`${occupancyRate(reservations, now, CAPACITY_NIGHTS)}%`}
          sub="Ce mois"
        />
        <StatCard
          label="Événements actifs"
          value={String(activeEvents(events, now))}
          sub="Total publiés"
        />
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Prochains événements</h2>
        {upcoming.length === 0 ? (
          <p className="mt-6 text-center text-gray-500">
            Aucun événement à venir
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {upcoming.map((e) => (
              <li key={e.id} className="flex justify-between py-3 text-sm">
                <span className="font-medium text-gray-800">{e.title}</span>
                <span className="text-gray-500">
                  {e.event_date ? formatDate(e.event_date) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
