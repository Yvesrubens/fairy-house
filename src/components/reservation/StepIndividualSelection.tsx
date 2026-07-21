import { useState } from 'react'
import type { StepProps } from './types'
import { SIMPLE_BEDS, DOUBLE_BEDS, nights } from '../../lib/booking'
import { Calendar, Bed, Users } from '../icons'

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Étape 3 (individuel) : choix des lits par type (simples / double), des dates,
 * des options et du nombre de personnes.
 * Capacité d'accueil = lits simples + 2 × lits doubles.
 */
export default function StepIndividualSelection({
  state,
  setState,
  onNext,
  onBack,
}: StepProps) {
  const [error, setError] = useState('')

  const bedCapacity = state.simpleBeds + state.doubleBeds * 2

  function validateAndNext() {
    if (state.simpleBeds + state.doubleBeds < 1) {
      setError('Veuillez choisir au moins un lit.')
      return
    }
    if (state.individualGuests < 1) {
      setError('Veuillez indiquer le nombre de personnes.')
      return
    }
    if (state.individualGuests > bedCapacity) {
      setError(
        `Le nombre de personnes (${state.individualGuests}) dépasse la capacité des lits choisis (${bedCapacity}).`,
      )
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
            onChange={(e) => setState({ simpleBeds: Number(e.target.value) })}
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
            onChange={(e) => setState({ doubleBeds: Number(e.target.value) })}
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

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-1" />
          Nombre de personnes *
        </label>
        <input
          type="number"
          min={1}
          max={bedCapacity || undefined}
          value={state.individualGuests}
          onChange={(e) =>
            setState({
              individualGuests: Math.max(1, Number(e.target.value) || 1),
            })
          }
          className={fieldCls}
        />
        <p className="mt-1 text-xs text-gray-500">
          Capacité des lits choisis : {bedCapacity} personne
          {bedCapacity > 1 ? 's' : ''}.
        </p>
      </div>

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
          <span className="text-gray-700">Linge de maison</span>
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
          <span className="text-gray-700">Pension complète</span>
        </label>
      </div>

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
