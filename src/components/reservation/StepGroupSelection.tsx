import { useEffect, useState } from 'react'
import type { StepProps } from './types'
import {
  WHOLE_HOUSE_CAPACITY,
  WHOLE_HOUSE_NIGHT_HT,
  nights,
  computeQuote,
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
 * Étape 2 (groupe) : privatisation de la maison complète uniquement.
 * Forfait maison entière (600 € / nuit HT, jusqu'à 14 personnes) — pas de
 * sélection chambre par chambre ni de tarif par personne.
 */
export default function StepGroupSelection({
  state,
  setState,
  onNext,
  onBack,
}: StepProps) {
  const [error, setError] = useState('')

  // La réservation de groupe est toujours une privatisation complète.
  useEffect(() => {
    if (!state.wholeHouse || state.rooms.length > 0) {
      setState({ wholeHouse: true, rooms: [] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pers = WHOLE_HOUSE_CAPACITY
  const nightsCount = nights(state.arrival, state.departure)
  const liveQuote = computeQuote(pers, nightsCount, state.options, true)

  function validateAndNext() {
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

      <div className="flex items-start gap-3 rounded-xl border-2 border-fairy-gold/30 bg-fairy-gold/5 p-4">
        <Bed className="mt-0.5 w-6 h-6 flex-shrink-0 text-fairy-gold" />
        <div>
          <p className="font-semibold text-gray-900">
            Privatisation de la maison complète
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Vous privatisez l'ensemble du lieu, jusqu'à {WHOLE_HOUSE_CAPACITY}{' '}
            personnes.
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Tarif :{' '}
            <strong>{formatEuro2(WHOLE_HOUSE_NIGHT_HT)} / nuit HT</strong> —
            forfait (indépendant du nombre de personnes).
          </p>
        </div>
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
              (+{formatEuro2(LINGE_PER_PERSON)} / personne HT)
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
              (+{formatEuro2(PENSION_PER_PERSON_NIGHT)} / personne / nuit HT)
            </span>
          </span>
        </label>
      </div>

      {nightsCount >= 1 && (
        <div className="flex items-center justify-between rounded-xl bg-fairy-gold/10 px-4 py-3">
          <span className="text-sm text-gray-700">
            Total estimé (maison complète · {nightsCount} nuit
            {nightsCount > 1 ? 's' : ''})
          </span>
          <span className="text-right">
            <span className="block text-xl font-bold text-gray-900">
              {formatEuro2(liveQuote.totalTtc)}
            </span>
            <span className="block text-xs text-gray-500">TTC (TVA 10 %)</span>
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
