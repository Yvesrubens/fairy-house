import { useState } from 'react'
import type { StepProps } from './types'
import {
  ROOMS,
  HOUSE_CAPACITY,
  nights,
  computeQuote,
  PRICE_PER_PERSON_NIGHT,
  LINGE_PER_PERSON,
  PENSION_PER_PERSON_NIGHT,
} from '../../lib/booking'
import { formatEuro2 } from '../../lib/format'
import { Calendar, Bed } from '../icons'
import AvailabilityCalendar from './AvailabilityCalendar'

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Étape 2 : sélection des chambres (ou maison complète) pour un séjour groupe.
 */
export default function StepGroupSelection({
  state,
  setState,
  onNext,
  onBack,
}: StepProps) {
  const [error, setError] = useState('')

  const pers = state.wholeHouse
    ? HOUSE_CAPACITY
    : state.rooms.reduce((s, r) => s + r.guests, 0)
  const nightsCount = nights(state.arrival, state.departure)
  const liveQuote = computeQuote(pers, nightsCount, state.options)

  function toggleWholeHouse() {
    const wholeHouse = !state.wholeHouse
    setState({ wholeHouse, rooms: wholeHouse ? [] : state.rooms })
  }

  function toggleRoom(name: string) {
    const exists = state.rooms.some((r) => r.room === name)
    if (exists) {
      setState({ rooms: state.rooms.filter((r) => r.room !== name) })
    } else {
      setState({ rooms: [...state.rooms, { room: name, guests: 1 }] })
    }
  }

  function setRoomGuests(name: string, guests: number) {
    setState({
      rooms: state.rooms.map((r) => (r.room === name ? { ...r, guests } : r)),
    })
  }

  function validateAndNext() {
    const hasSelection = state.wholeHouse || state.rooms.length > 0
    if (!hasSelection) {
      setError('Veuillez choisir la maison complète ou au moins une chambre.')
      return
    }
    if (nights(state.arrival, state.departure) < 1) {
      setError('Veuillez choisir des dates valides (au moins une nuit).')
      return
    }
    setError('')
    onNext()
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer">
        <input
          type="checkbox"
          checked={state.wholeHouse}
          onChange={toggleWholeHouse}
          className="w-5 h-5 accent-fairy-gold"
        />
        <span className="font-semibold text-gray-900">
          Maison complète ({HOUSE_CAPACITY} personnes)
        </span>
      </label>

      {!state.wholeHouse && (
        <div className="space-y-3">
          {ROOMS.map((room) => {
            const selected = state.rooms.find((r) => r.room === room.name)
            return (
              <div
                key={room.name}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl"
              >
                <input
                  type="checkbox"
                  checked={Boolean(selected)}
                  onChange={() => toggleRoom(room.name)}
                  className="w-5 h-5 accent-fairy-gold"
                />
                <Bed className="w-5 h-5 text-fairy-gold" />
                <span className="flex-1 font-semibold text-gray-900">
                  {room.name} (max {room.capacity})
                </span>
                {selected && (
                  <select
                    value={selected.guests}
                    onChange={(e) =>
                      setRoomGuests(room.name, Number(e.target.value))
                    }
                    className={`${fieldCls} w-auto`}
                  >
                    {Array.from({ length: room.capacity }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'personne' : 'personnes'}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-fairy-gold/10 px-4 py-3">
        <Bed className="mt-0.5 w-5 h-5 flex-shrink-0 text-fairy-gold" />
        <p className="text-sm text-gray-700">
          Tarif : <strong>{formatEuro2(PRICE_PER_PERSON_NIGHT)} / personne / nuit</strong>{' '}
          — la réservation est facturée selon le nombre de personnes
          {state.wholeHouse
            ? ` (maison complète : ${HOUSE_CAPACITY} personnes)`
            : ''}
          .
        </p>
      </div>

      <AvailabilityCalendar
        arrival={state.arrival}
        departure={state.departure}
        onSelect={(arrival, departure) => setState({ arrival, departure })}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date d'arrivée *
          </label>
          <input
            type="date"
            required
            min={today()}
            value={state.arrival}
            onChange={(e) => setState({ arrival: e.target.value })}
            className={fieldCls}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date de départ *
          </label>
          <input
            type="date"
            required
            min={state.arrival || today()}
            value={state.departure}
            onChange={(e) => setState({ departure: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.options.linge}
            onChange={(e) =>
              setState({ options: { ...state.options, linge: e.target.checked } })
            }
            className="w-5 h-5 accent-fairy-gold"
          />
          <span className="text-gray-700">
            Linge de maison{' '}
            <span className="text-gray-500">
              (+{formatEuro2(LINGE_PER_PERSON)} / personne)
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.options.pension}
            onChange={(e) =>
              setState({
                options: { ...state.options, pension: e.target.checked },
              })
            }
            className="w-5 h-5 accent-fairy-gold"
          />
          <span className="text-gray-700">
            Pension complète{' '}
            <span className="text-gray-500">
              (+{formatEuro2(PENSION_PER_PERSON_NIGHT)} / personne / nuit)
            </span>
          </span>
        </label>
      </div>

      {pers > 0 && nightsCount >= 1 && (
        <div className="flex items-center justify-between rounded-xl bg-fairy-gold/10 px-4 py-3">
          <span className="text-sm text-gray-700">
            Total estimé ({pers} personne{pers > 1 ? 's' : ''} · {nightsCount} nuit
            {nightsCount > 1 ? 's' : ''})
          </span>
          <span className="text-xl font-bold text-gray-900">
            {formatEuro2(liveQuote.totalTtc)}
          </span>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold transition-all"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={validateAndNext}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
