import { useState } from 'react'
import type { StepProps } from './types'
import { canSplit } from '../../lib/booking'
import { Mail, Phone, MessageSquare } from '../icons'

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Étape 4 : coordonnées, demandes spécifiques et choix du plan de paiement.
 */
export default function StepDetails({
  state,
  setState,
  onNext,
  onBack,
}: StepProps) {
  const [error, setError] = useState('')
  const splitAvailable = canSplit(state.arrival, today())

  function validateAndNext() {
    if (
      !state.firstName.trim() ||
      !state.lastName.trim() ||
      !state.email.trim() ||
      !state.phone.trim()
    ) {
      setError('Veuillez renseigner tous les champs obligatoires.')
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
            Prénom *
          </label>
          <input
            type="text"
            required
            placeholder="Votre prénom"
            value={state.firstName}
            onChange={(e) => setState({ firstName: e.target.value })}
            className={fieldCls}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            required
            placeholder="Votre nom"
            value={state.lastName}
            onChange={(e) => setState({ lastName: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            required
            placeholder="votre@email.com"
            value={state.email}
            onChange={(e) => setState({ email: e.target.value })}
            className={fieldCls}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Téléphone *
          </label>
          <input
            type="tel"
            required
            placeholder="+33 6 12 34 56 78"
            value={state.phone}
            onChange={(e) => setState({ phone: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      {state.mode === 'groupe' && (
        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={state.activitiesRequested}
            onChange={(e) =>
              setState({ activitiesRequested: e.target.checked })
            }
            className="w-5 h-5 mt-0.5 accent-fairy-gold"
          />
          <span className="text-gray-700">
            Je veux être contactée pour organiser des activités sur place
            (construction d'un séjour sur mesure)
          </span>
        </label>
      )}

      {state.mode === 'individuel' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Allergies alimentaires
          </label>
          <input
            type="text"
            placeholder="Précisez vos allergies éventuelles"
            value={state.allergies}
            onChange={(e) => setState({ allergies: e.target.value })}
            className={fieldCls}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Demandes diverses
        </label>
        <textarea
          rows={4}
          placeholder="Parlez-nous de votre projet..."
          value={state.message}
          onChange={(e) => setState({ message: e.target.value })}
          className={`${fieldCls} resize-none`}
        />
      </div>

      {splitAvailable && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Modalité de paiement
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`p-4 border-2 rounded-xl cursor-pointer text-center font-semibold transition-all ${
                state.paymentPlan === 'once'
                  ? 'border-fairy-gold bg-fairy-gold/10'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="paymentPlan"
                className="sr-only"
                checked={state.paymentPlan === 'once'}
                onChange={() => setState({ paymentPlan: 'once' })}
              />
              Paiement en 1 fois
            </label>
            <label
              className={`p-4 border-2 rounded-xl cursor-pointer text-center font-semibold transition-all ${
                state.paymentPlan === 'split'
                  ? 'border-fairy-gold bg-fairy-gold/10'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="paymentPlan"
                className="sr-only"
                checked={state.paymentPlan === 'split'}
                onChange={() => setState({ paymentPlan: 'split' })}
              />
              Paiement en 2 fois
            </label>
          </div>
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
