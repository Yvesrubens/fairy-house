import { useEffect, useMemo, useState } from 'react'
import { availabilityCalendar } from '../../lib/api'

// Calendrier de disponibilité (F1) : affiche les lits restants par jour sur le
// mois visible et permet de sélectionner une plage arrivée → départ. Les jours
// complets (0 lit) et passés sont désactivés. C'est une aide visuelle ; le
// contrôle définitif reste `check_availability` à la validation.

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function firstOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1))
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export default function AvailabilityCalendar({
  arrival,
  departure,
  onSelect,
}: {
  arrival: string
  departure: string
  onSelect: (arrival: string, departure: string) => void
}) {
  const now = new Date()
  const [view, setView] = useState({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  })
  const [remaining, setRemaining] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const todayIso = iso(new Date())

  const range = useMemo(() => {
    const start = firstOfMonth(view.year, view.month)
    const end = new Date(Date.UTC(view.year, view.month + 1, 0)) // dernier jour
    return { from: iso(start), to: iso(end), start, end }
  }, [view])

  useEffect(() => {
    let active = true
    setLoading(true)
    availabilityCalendar(range.from, range.to)
      .then((rows) => {
        if (!active) return
        const map: Record<string, number> = {}
        for (const r of rows) map[r.day.slice(0, 10)] = r.remaining
        setRemaining(map)
      })
      .catch(() => active && setRemaining({}))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [range.from, range.to])

  function pick(day: string) {
    // 1er clic (ou reset) → arrivée ; 2e clic postérieur → départ.
    if (!arrival || (arrival && departure) || day <= arrival) {
      onSelect(day, '')
    } else {
      onSelect(arrival, day)
    }
  }

  // Cases du mois, alignées sur lundi.
  const cells: (string | null)[] = []
  const firstWeekday = (range.start.getUTCDay() + 6) % 7 // lundi = 0
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  const daysInMonth = range.end.getUTCDate()
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(iso(new Date(Date.UTC(view.year, view.month, d))))
  }

  function inRange(day: string): boolean {
    if (!arrival) return false
    const end = departure || arrival
    return day >= arrival && day <= end
  }

  function prevMonth() {
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 },
    )
  }
  function nextMonth() {
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 },
    )
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[view.month]} {view.year}
          {loading && <span className="ml-2 text-gray-400">…</span>}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1 font-medium">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const rem = remaining[day]
          const past = day < todayIso
          const full = rem === 0
          const disabled = past || full
          const selected = inRange(day)
          const dayNum = Number(day.slice(8, 10))
          let cls =
            'flex flex-col items-center justify-center rounded-lg py-1.5 text-sm transition-colors '
          if (disabled) cls += 'text-gray-300 cursor-not-allowed line-through'
          else if (selected) cls += 'bg-fairy-gold text-black font-bold'
          else cls += 'hover:bg-fairy-gold/20 text-gray-800 cursor-pointer'
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => pick(day)}
              className={cls}
            >
              <span>{dayNum}</span>
              {rem !== undefined && !past && (
                <span
                  className={`text-[10px] ${
                    full
                      ? 'text-gray-300'
                      : rem <= 3
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                >
                  {full ? 'complet' : `${rem} lit${rem > 1 ? 's' : ''}`}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Cliquez une date d'arrivée puis une date de départ. Les lits indiqués
        sont ceux restants par nuit.
      </p>
    </div>
  )
}
