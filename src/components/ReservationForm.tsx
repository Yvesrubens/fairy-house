import { useState } from 'react'
import type { FormEvent } from 'react'
import { createReservation } from '../lib/api'
import { Mail, Phone, Calendar, Users, MessageSquare } from './icons'

export interface ReservationContext {
  eventId?: string
  eventTitle?: string
  eventDate?: string | null
}

const ACCOMMODATIONS = [
  '1 personne / 1 lit',
  'Chambre Litha (2-3 personnes)',
  'Chambre Mabbon (5 personnes)',
  'Chambre Imbolc (4 personnes)',
  'Privatisation',
]

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

// Date du jour au format YYYY-MM-DD, pour empêcher la sélection de dates passées.
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(ctx?: ReservationContext | null) {
  return {
    name: '',
    email: '',
    phone: '',
    checkIn: ctx?.eventDate ?? '',
    checkOut: '',
    guests: '1',
    accommodation: ctx?.eventTitle ? `Événement : ${ctx.eventTitle}` : '',
    message: '',
  }
}

interface Props {
  ctx?: ReservationContext | null
  /** Si fourni, affiche un bouton « Annuler » (utilisé dans la modale). */
  onCancel?: () => void
}

/**
 * Formulaire de réservation (séjour ou événement).
 * Partagé entre la modale (ReservationProvider) et la page /reserver.
 */
export default function ReservationForm({ ctx, onCancel }: Props) {
  const [form, setForm] = useState(() => emptyForm(ctx))
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isEvent = Boolean(ctx?.eventId)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createReservation({
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone || undefined,
        type: form.accommodation || 'Non précisé',
        arrival_date: form.checkIn,
        departure_date: form.checkOut || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        message: form.message || undefined,
        event_id: ctx?.eventId,
      })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-2xl font-bold text-gray-900">
          Votre demande a bien été envoyée !
        </h3>
        <p className="mt-4 text-gray-600">
          Merci, nous revenons vers vous sous 48h pour confirmer votre{' '}
          {isEvent ? 'place' : 'séjour'}.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black rounded-full font-bold transition-all hover:from-black hover:to-black hover:text-fairy-gold"
          >
            Fermer
          </button>
        )}
      </div>
    )
  }

  return (
    <form className="p-8 space-y-6" onSubmit={submit}>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nom complet *
        </label>
        <input
          type="text"
          required
          placeholder="Votre nom"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className={fieldCls}
        />
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
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
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
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={fieldCls}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            {isEvent ? "Date de l'événement *" : "Date d'arrivée *"}
          </label>
          <input
            type="date"
            required
            min={today()}
            value={form.checkIn}
            onChange={(e) => set('checkIn', e.target.value)}
            className={fieldCls}
          />
        </div>
        {!isEvent && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de départ *
            </label>
            <input
              type="date"
              required
              min={form.checkIn || today()}
              value={form.checkOut}
              onChange={(e) => set('checkOut', e.target.value)}
              className={fieldCls}
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Nombre de personnes *
          </label>
          <select
            required
            value={form.guests}
            onChange={(e) => set('guests', e.target.value)}
            className={fieldCls}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'personne' : 'personnes'}
              </option>
            ))}
          </select>
        </div>
        {!isEvent && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'hébergement
            </label>
            <select
              value={form.accommodation}
              onChange={(e) => set('accommodation', e.target.value)}
              className={fieldCls}
            >
              <option value="">Choisir...</option>
              {ACCOMMODATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Message (optionnel)
        </label>
        <textarea
          rows={4}
          placeholder="Parlez-nous de votre projet..."
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={`${fieldCls} resize-none`}
        />
      </div>

      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold transition-all"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        * Champs obligatoires • Réponse sous 48h
      </p>
    </form>
  )
}
