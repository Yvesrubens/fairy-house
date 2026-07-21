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

/**
 * Étape 5 : récapitulatif du devis et choix du moyen de paiement.
 */
export default function StepPayment({
  state,
  setState,
  onBack,
  onSubmit,
  busy,
}: StepPaymentProps) {
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

      {plan && (
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
          <button
            type="button"
            onClick={() => setState({ paymentMethod: 'virement' })}
            className={`p-4 border-2 rounded-xl text-center font-semibold transition-all ${
              state.paymentMethod === 'virement'
                ? 'border-fairy-gold bg-fairy-gold/10'
                : 'border-gray-200 hover:border-fairy-gold'
            }`}
          >
            Virement
          </button>
          <button
            type="button"
            disabled
            className="p-4 border-2 border-gray-200 rounded-xl text-center font-semibold text-gray-400 opacity-50 cursor-not-allowed"
          >
            CB
            <span className="block text-xs font-normal">
              Bientôt disponible
            </span>
          </button>
          <button
            type="button"
            disabled
            className="p-4 border-2 border-gray-200 rounded-xl text-center font-semibold text-gray-400 opacity-50 cursor-not-allowed"
          >
            PayPal
            <span className="block text-xs font-normal">
              Bientôt disponible
            </span>
          </button>
        </div>
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
          onClick={onSubmit}
          disabled={!state.paymentMethod || busy}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Envoi…' : 'Valider ma réservation'}
        </button>
      </div>
    </div>
  )
}
