import { useState } from 'react'
import type { StepProps } from './types'
import {
  SIMPLE_BEDS,
  DOUBLE_BEDS,
  nights,
  computeQuote,
  minIndividualDate,
  PRICE_PER_PERSON_NIGHT,
  LINGE_PER_PERSON,
  PENSION_PER_PERSON_NIGHT,
} from '../../lib/booking'
import { formatEuro2 } from '../../lib/format'
import { Calendar, Bed, Users } from '../icons'
import AvailabilityCalendar from './AvailabilityCalendar'

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

/**
 * Étape 3 (individuel) : choix des lits par type (simples / double), des dates
 * et des options. La facturation se fait sur la CAPACITÉ des lits choisis
 * (1 lit simple = 1 personne, 1 lit double = 2 personnes) — on ne demande donc
 * pas séparément le nombre de personnes.
 */
export default function StepIndividualSelection({
  state,
  setState,
  onNext,
  onBack,
}: StepProps) {
  const [error, setError] = useState('')

  const bedCapacity = state.simpleBeds + state.doubleBeds * 2
  const nightsCount = nights(state.arrival, state.departure)
  const liveQuote = computeQuote(bedCapacity, nightsCount, state.options)

  // Les lits pilotent le nombre de personnes facturées (= capacité). On garde
  // `individualGuests` synchronisé pour le devis et l'enregistrement.
  function setBeds(patch: { simpleBeds?: number; doubleBeds?: number }) {
    const simpleBeds = patch.simpleBeds ?? state.simpleBeds
    const doubleBeds = patch.doubleBeds ?? state.doubleBeds
    setState({ simpleBeds, doubleBeds, individualGuests: simpleBeds + doubleBeds * 2 })
  }

  function validateAndNext() {
    if (state.simpleBeds + state.doubleBeds < 1) {
      setError('Veuillez choisir au moins un lit.')
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Bed className="w-4 h-4 inline mr-1" />
            Lits simples
          </label>
          <select
            value={state.simpleBeds}
            onChange={(e) => setBeds({ simpleBeds: Number(e.target.value) })}
            className={fieldCls}
          >
            {Array.from({ length: SIMPLE_BEDS + 1 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n} {n <= 1 ? 'lit simple' : 'lits simples'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Bed className="w-4 h-4 inline mr-1" />
            Lits doubles
          </label>
          <select
            value={state.doubleBeds}
            onChange={(e) => setBeds({ doubleBeds: Number(e.target.value) })}
            className={fieldCls}
          >
            {Array.from({ length: DOUBLE_BEDS + 1 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n} {n <= 1 ? 'lit double' : 'lits doubles'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-fairy-gold/10 px-4 py-3">
        <Users className="mt-0.5 w-5 h-5 flex-shrink-0 text-fairy-gold" />
        <div className="text-sm text-gray-700">
          <p>
            Capacité des lits choisis :{' '}
            <strong>
              {bedCapacity} personne{bedCapacity > 1 ? 's' : ''}
            </strong>{' '}
            — la réservation est facturée sur cette base (1 lit simple = 1 pers.,
            1 lit double = 2 pers.).
          </p>
          <p className="mt-1 text-gray-600">
            Lit simple : <strong>{formatEuro2(PRICE_PER_PERSON_NIGHT)}</strong> / nuit HT
            {' · '}
            Lit double : <strong>{formatEuro2(PRICE_PER_PERSON_NIGHT * 2)}</strong> / nuit HT
            {' '}
            <span className="text-gray-400">
              ({formatEuro2(PRICE_PER_PERSON_NIGHT)} / personne / nuit HT)
            </span>
          </p>
        </div>
      </div>

      <p className="rounded-xl border border-fairy-gold/30 bg-fairy-gold/10 px-4 py-3 text-sm text-gray-700">
        La réservation d'un lit seul est possible à partir de 2 mois à l'avance.
        Les dates plus proches sont grisées ; pour un séjour plus tôt, optez pour
        la privatisation (chambres ou maison complète).
      </p>

      <AvailabilityCalendar
        arrival={state.arrival}
        departure={state.departure}
        minDate={minIndividualDate()}
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
            min={minIndividualDate()}
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
            min={state.arrival || minIndividualDate()}
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

      {bedCapacity > 0 && nightsCount >= 1 && (
        <div className="flex items-center justify-between rounded-xl bg-fairy-gold/10 px-4 py-3">
          <span className="text-sm text-gray-700">
            Total estimé ({bedCapacity} personne{bedCapacity > 1 ? 's' : ''} ·{' '}
            {nightsCount} nuit{nightsCount > 1 ? 's' : ''})
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
