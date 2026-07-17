import { useEffect, useState } from 'react'
import { useAuth } from '../AuthProvider'
import StatCard from '../components/StatCard'
import { listReservations, listAllEvents } from '../../lib/api'
import {
  reservationsThisMonth,
  revenueThisMonth,
  occupancyRate,
  activeEvents,
} from '../../lib/stats'
import { formatEuro, formatDate } from '../../lib/format'
import { ClipboardIcon, EuroIcon, DashboardIcon, CalendarIcon } from '../icons'
import type { EventRow, Reservation, ReservationStatus } from '../../types/db'

// Capacité mensuelle indicative : ~2 chambres louables x 30 nuits.
const CAPACITY_NIGHTS = 60

const STATUS: Record<ReservationStatus, { label: string; badge: string; bar: string }> = {
  pending: { label: 'En attente', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' },
  confirmed: { label: 'Confirmée', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500' },
  cancelled: { label: 'Annulée', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-400' },
}

export default function Dashboard() {
  const { admin } = useAuth()
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
  const recent = reservations.slice(0, 5)

  const counts: Record<ReservationStatus, number> = {
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    cancelled: reservations.filter((r) => r.status === 'cancelled').length,
  }
  const total = reservations.length || 1

  return (
    <div>
      {/* Bandeau de bienvenue */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 p-8 text-white shadow-sm">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Bonjour {admin?.full_name ?? 'admin'} 👋
        </h1>
        <p className="mt-2 text-white/85">
          Voici l'activité de la Fairy House aujourd'hui.
        </p>
      </div>

      {/* Tuiles de stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Réservations ce mois"
          value={String(reservationsThisMonth(reservations, now))}
          icon={<ClipboardIcon />}
          color="blue"
        />
        <StatCard
          label="CA ce mois"
          value={formatEuro(revenueThisMonth(reservations, now))}
          icon={<EuroIcon />}
          color="green"
        />
        <StatCard
          label="Taux d'occupation"
          value={`${occupancyRate(reservations, now, CAPACITY_NIGHTS)}%`}
          sub="Ce mois"
          icon={<DashboardIcon />}
          color="purple"
        />
        <StatCard
          label="Événements actifs"
          value={String(activeEvents(events, now))}
          sub="Total publiés"
          icon={<CalendarIcon />}
          color="pink"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Réservations récentes */}
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900">
            Réservations récentes
          </h2>
          {recent.length === 0 ? (
            <p className="mt-8 text-center text-gray-500">
              Aucune réservation pour le moment
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">
                      {r.client_name}
                    </p>
                    <p className="truncate text-sm text-gray-500">
                      {r.reference} · {r.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatDate(r.arrival_date)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS[r.status].badge}`}
                    >
                      {STATUS[r.status].label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Répartition par statut */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-600">
              Répartition des réservations
            </h3>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
              {(['confirmed', 'pending', 'cancelled'] as ReservationStatus[]).map(
                (s) =>
                  counts[s] > 0 && (
                    <div
                      key={s}
                      className={STATUS[s].bar}
                      style={{ width: `${(counts[s] / total) * 100}%` }}
                    />
                  ),
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {(['confirmed', 'pending', 'cancelled'] as ReservationStatus[]).map(
                (s) => (
                  <span key={s} className="flex items-center gap-2 text-gray-600">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${STATUS[s].bar}`}
                    />
                    {STATUS[s].label} ({counts[s]})
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Prochains événements */}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Prochains événements
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-8 text-center text-gray-500">
              Aucun événement à venir
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-purple-50 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white">
                    <CalendarIcon width={16} height={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {e.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {e.event_date ? formatDate(e.event_date) : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
