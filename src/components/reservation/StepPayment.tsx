import { useState } from 'react'
import type { StepProps } from './types'
import {
  HOUSE_CAPACITY,
  canSplit,
  computeQuote,
  nights,
  splitPlan,
} from '../../lib/booking'
import { CreditCard } from '../icons'

export interface StepPaymentProps extends StepProps {
  onSubmit: () => void
  busy: boolean
}

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

// Formatage visuel du numéro de carte : groupes de 4 chiffres.
function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

// Formatage visuel de l'expiration : MM/AA.
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const METHODS = [
  { key: 'virement', label: 'Virement' },
  { key: 'cb', label: 'CB' },
  { key: 'paypal', label: 'PayPal' },
] as const

/**
 * Étape 5 : récapitulatif du devis et choix du moyen de paiement.
 * Virement : fonctionnel (devis + RIB par email).
 * CB / PayPal : SIMULATION uniquement — aucune donnée bancaire n'est transmise
 * ni stockée. Le vrai encaissement (Stripe / PayPal) sera branché plus tard.
 */
export default function StepPayment({
  state,
  setState,
  onBack,
  onSubmit,
  busy,
}: StepPaymentProps) {
  // Champs de carte simulés (locaux, jamais transmis).
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  // Connexion PayPal simulée.
  const [paypalConfirmed, setPaypalConfirmed] = useState(false)

  const pers =
    state.mode === 'groupe'
      ? state.wholeHouse
        ? HOUSE_CAPACITY
        : state.rooms.reduce((sum, r) => sum + r.guests, 0)
      : state.beds

  const nightsCount = nights(state.arrival, state.departure)
  const quote = computeQuote(pers, nightsCount, state.options)
  const today = new Date().toISOString().slice(0, 10)
  const plan =
    state.paymentPlan === 'split' && canSplit(state.arrival, today)
      ? splitPlan(quote.totalTtc, state.arrival)
      : null

  // Le paiement en 2 fois ne s'applique qu'au virement.
  const cardComplete =
    cardName.trim() !== '' &&
    cardNumber.replace(/\s/g, '').length >= 13 &&
    cardExpiry.length === 5 &&
    cardCvc.length >= 3

  const paymentReady =
    state.paymentMethod === 'virement' ||
    (state.paymentMethod === 'cb' && cardComplete) ||
    (state.paymentMethod === 'paypal' && paypalConfirmed)

  return (
    <div className="space-y-6">
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.label} className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-700">
                  {line.label} ({line.qty} × {line.unitPrice} €)
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {line.total.toFixed(2)} €
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">Total HT</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {quote.totalHt.toFixed(2)} €
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">TVA (10 %)</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {quote.vat.toFixed(2)} €
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 font-bold text-gray-900">Total TTC</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {quote.totalTtc.toFixed(2)} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {plan && state.paymentMethod === 'virement' && (
        <div className="p-4 border-2 border-fairy-gold/50 rounded-xl bg-fairy-gold/5 text-sm space-y-1">
          <p className="text-gray-700">
            Acompte à régler aujourd'hui :{' '}
            <span className="font-bold text-gray-900">
              {plan.deposit.toFixed(2)} €
            </span>
          </p>
          <p className="text-gray-700">
            Solde de{' '}
            <span className="font-bold text-gray-900">
              {plan.balance.toFixed(2)} €
            </span>{' '}
            dû le {plan.balanceDueDate}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <CreditCard className="w-4 h-4 inline mr-1" />
          Moyen de paiement
        </label>
        <div className="grid grid-cols-3 gap-4">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setState({ paymentMethod: m.key })}
              className={`p-4 border-2 rounded-xl text-center font-semibold transition-all ${
                state.paymentMethod === m.key
                  ? 'border-fairy-gold bg-fairy-gold/10'
                  : 'border-gray-200 hover:border-fairy-gold'
              }`}
            >
              {m.label}
              {m.key !== 'virement' && (
                <span className="block text-xs font-normal text-gray-500">
                  Simulation
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation CB : champs de carte (non transmis) */}
      {state.paymentMethod === 'cb' && (
        <div className="space-y-4 p-4 border-2 border-gray-200 rounded-xl">
          <p className="text-xs text-gray-500">
            Paiement simulé — aucune donnée bancaire n'est transmise ni stockée.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom sur la carte
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="Nom du titulaire"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className={fieldCls}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de carte
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className={fieldCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiration
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                className={fieldCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CVC
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="123"
                value={cardCvc}
                onChange={(e) =>
                  setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                className={fieldCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* Simulation PayPal : connexion factice */}
      {state.paymentMethod === 'paypal' && (
        <div className="space-y-3 p-4 border-2 border-gray-200 rounded-xl text-center">
          <p className="text-xs text-gray-500">
            Paiement simulé — aucune connexion réelle à PayPal.
          </p>
          {paypalConfirmed ? (
            <p className="font-semibold text-green-600">
              ✓ Connecté à PayPal (simulation)
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setPaypalConfirmed(true)}
              className="px-6 py-3 rounded-full font-bold bg-[#ffc439] text-[#003087] hover:brightness-95 transition-all"
            >
              Continuer avec PayPal
            </button>
          )}
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
          onClick={onSubmit}
          disabled={!paymentReady || busy}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy
            ? 'Envoi…'
            : state.paymentMethod === 'cb' || state.paymentMethod === 'paypal'
              ? 'Payer (simulation)'
              : 'Valider ma réservation'}
        </button>
      </div>
    </div>
  )
}
