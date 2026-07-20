import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventBySlug } from '../lib/api'
import { formatDate } from '../lib/format'
import type { EventRow } from '../types/db'
import { useReservation } from '../components/Reservation'
import { Calendar, MapPin, Users, ArrowRight } from '../components/icons'

export default function EvenementDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { open: openReservation } = useReservation()
  const [event, setEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getEventBySlug(slug)
      .then((e) => {
        if (e) setEvent(e)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function reserver() {
    if (!event) return
    openReservation({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.event_date,
    })
  }

  if (loading) {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Chargement…</p>
        </div>
      </main>
    )
  }

  if (notFound || !event) {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Événement introuvable
          </h1>
          <Link
            to="/evenements"
            className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all"
          >
            Retour à la programmation
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-fairy-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            {event.event_date && (
              <p className="text-sm md:text-base font-semibold uppercase tracking-widest text-fairy-gold mb-4">
                {formatDate(event.event_date)}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
              {event.title}
            </h1>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Link
                to="/evenements"
                className="text-sm text-gray-500 hover:text-fairy-gold transition-colors"
              >
                ← Retour à la programmation
              </Link>

              {/* Infos clés */}
              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {event.event_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Date
                      </p>
                      <p className="font-medium text-gray-800">
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Lieu
                      </p>
                      <p className="font-medium text-gray-800">{event.location}</p>
                    </div>
                  </div>
                )}
                {event.capacity != null && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-fairy-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Places
                      </p>
                      <p className="font-medium text-gray-800">
                        {event.capacity} places
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description / contenu */}
              <div className="mt-10 space-y-4 text-lg text-gray-700 leading-relaxed">
                {event.description && (
                  <p className="font-medium text-gray-800">{event.description}</p>
                )}
                {event.content &&
                  event.content
                    .split('\n')
                    .filter((p) => p.trim())
                    .map((p, i) => <p key={i}>{p}</p>)}
              </div>

              {/* CTA réserver */}
              <div className="mt-12 rounded-2xl bg-gradient-to-br from-fairy-gold/10 to-white border border-fairy-gold/30 p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Réserver ma place
                </h2>
                <p className="text-gray-600 mb-6">
                  Envoyez votre demande de réservation pour cet événement. Nous
                  revenons vers vous sous 48h pour confirmer.
                </p>
                <button
                  onClick={reserver}
                  className="inline-flex items-center gap-2 px-10 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold text-lg transition-all shadow-lg"
                >
                  Réserver ma place
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
