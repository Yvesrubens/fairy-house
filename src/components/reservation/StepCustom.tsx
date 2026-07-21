import { useState } from 'react'
import type { StepProps } from './types'
import { Mail, Phone, Calendar, Users, MessageSquare } from '../icons'

export interface StepCustomProps extends StepProps {
  onSubmit: () => void
  busy: boolean
}

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Parcours « Séjour sur mesure » : l'utilisateur laisse ses coordonnées, ses
 * dates approximatives, le nombre de personnes et décrit son projet. Aucun
 * paiement : l'équipe établit un devis personnalisé ensuite.
 */
export default function StepCustom({
  state,
  setState,
  onBack,
  onSubmit,
  busy,
}: StepCustomProps) {
  const [touched, setTouched] = useState(false)

  const valid =
    state.firstName.trim() !== '' &&
    state.lastName.trim() !== '' &&
    state.email.trim() !== '' &&
    state.phone.trim() !== '' &&
    state.arrival !== ''

  function submit() {
    if (!valid) {
      setTouched(true)
      return
    }
    onSubmit()
  }

  return (
    <div className="space-y-6">
      {touched && !valid && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          Veuillez renseigner vos coordonnées et une date d'arrivée souhaitée.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
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
            placeholder="+33 6 12 34 56 78"
            value={state.phone}
            onChange={(e) => setState({ phone: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date d'arrivée souhaitée *
          </label>
          <input
            type="date"
            min={today()}
            value={state.arrival}
            onChange={(e) => setState({ arrival: e.target.value })}
            className={fieldCls}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date de départ souhaitée
          </label>
          <input
            type="date"
            min={state.arrival || today()}
            value={state.departure}
            onChange={(e) => setState({ departure: e.target.value })}
            className={fieldCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-1" />
          Nombre de personnes
        </label>
        <input
          type="number"
          min={1}
          value={state.customGuests}
          onChange={(e) =>
            setState({ customGuests: Math.max(1, Number(e.target.value) || 1) })
          }
          className={fieldCls}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Décrivez votre projet
        </label>
        <textarea
          rows={4}
          placeholder="Vos envies, le type de séjour, les activités souhaitées, le budget approximatif…"
          value={state.message}
          onChange={(e) => setState({ message: e.target.value })}
          className={`${fieldCls} resize-none`}
        />
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
          onClick={submit}
          disabled={busy}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </div>
    </div>
  )
}
