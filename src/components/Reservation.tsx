import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'
import type { FormEvent, ReactNode } from 'react'
import { createReservation } from '../lib/api'
import { Mail, Phone, Calendar, Users, MessageSquare, Close } from './icons'

interface ReservationValue {
  open: () => void
  close: () => void
}

const Ctx = createContext<ReservationValue | undefined>(undefined)

export function useReservation(): ReservationValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useReservation must be used within ReservationProvider')
  return v
}

const ACCOMMODATIONS = [
  '1 personne / 1 lit',
  'Chambre Litha (2-3 personnes)',
  'Chambre Mabbon (5 personnes)',
  'Chambre Imbolc (4 personnes)',
  'Privatisation simple',
  'Séjour sur mesure',
]

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  checkIn: '',
  checkOut: '',
  guests: '1',
  accommodation: '',
  message: '',
}

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const open = useCallback(() => {
    setForm({ ...EMPTY })
    setDone(false)
    setError('')
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

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
      })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-fairy-gold to-fairy-gold-light p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-black">
                    Réserver votre séjour
                  </h2>
                  <p className="text-black/70 mt-1">
                    Remplissez le formulaire ci-dessous
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="Fermer"
                  className="w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <Close className="w-6 h-6 text-black" />
                </button>
              </div>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  Votre demande a bien été envoyée !
                </h3>
                <p className="mt-4 text-gray-600">
                  Merci, nous revenons vers vous sous 48h pour confirmer votre séjour.
                </p>
                <button
                  onClick={close}
                  className="mt-8 px-8 py-3 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black rounded-full font-bold transition-all hover:from-black hover:to-black hover:text-fairy-gold"
                >
                  Fermer
                </button>
              </div>
            ) : (
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
                      Date d'arrivée *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.checkIn}
                      onChange={(e) => set('checkIn', e.target.value)}
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
                      value={form.checkOut}
                      onChange={(e) => set('checkOut', e.target.value)}
                      className={fieldCls}
                    />
                  </div>
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
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold transition-all"
                  >
                    Annuler
                  </button>
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
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
