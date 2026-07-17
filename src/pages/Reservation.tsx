import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/ui'
import { createReservation } from '../lib/api'

const TYPES = [
  'Privatisation complète',
  'Chambre Litha',
  'Chambre Mabon',
  'Chambre Imbolc',
  'Séjour sur mesure',
]

export default function Reservation() {
  const [form, setForm] = useState({
    type: TYPES[0],
    arrival_date: '',
    departure_date: '',
    guests: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    message: '',
  })
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createReservation({
        type: form.type,
        arrival_date: form.arrival_date,
        departure_date: form.departure_date || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || undefined,
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
    <main>
      <PageHero
        eyebrow="RÉSERVATION"
        title="Réservez votre séjour"
        subtitle="Envoyez-nous votre demande, nous revenons vers vous sous 48h pour confirmer."
        image="/photo/Vue_coucher_de_soleil.jpg"
      />

      <section className="bg-cream-light py-24">
        <div className="mx-auto max-w-2xl px-6">
          {done ? (
            <div className="rounded-2xl border border-cream bg-white px-8 py-16 text-center">
              <h2 className="text-2xl font-bold text-ink">
                Votre demande a bien été envoyée !
              </h2>
              <p className="mt-4 text-gray-600">
                Merci, nous revenons vers vous sous 48h pour confirmer votre
                séjour.
              </p>
              <Link
                to="/"
                className="mt-8 inline-block rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black hover:bg-gold-dark"
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-5 rounded-2xl border border-cream bg-white p-8"
            >
              {error && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              <label className="block text-sm font-medium text-ink">
                Type de séjour
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                >
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink">
                  Date d'arrivée *
                  <input
                    type="date"
                    required
                    value={form.arrival_date}
                    onChange={(e) => set('arrival_date', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Date de départ
                  <input
                    type="date"
                    value={form.departure_date}
                    onChange={(e) => set('departure_date', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-ink">
                Nombre de personnes
                <input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) => set('guests', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink">
                  Nom complet *
                  <input
                    required
                    value={form.client_name}
                    onChange={(e) => set('client_name', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Email *
                  <input
                    type="email"
                    required
                    value={form.client_email}
                    onChange={(e) => set('client_email', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-ink">
                Téléphone
                <input
                  type="tel"
                  value={form.client_phone}
                  onChange={(e) => set('client_phone', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Votre message
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-cream px-4 py-3 outline-none focus:border-gold"
                />
              </label>

              <button
                disabled={busy}
                className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-dark disabled:opacity-60"
              >
                {busy ? 'Envoi…' : 'Envoyer ma demande'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
