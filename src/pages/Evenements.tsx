import { useEffect, useState } from 'react'
import { PageHero, CTASection } from '../components/ui'
import { listPublishedEvents } from '../lib/api'
import { formatDate } from '../lib/format'
import type { EventRow } from '../types/db'

export default function Evenements() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPublishedEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <PageHero
        eyebrow="NOTRE PROGRAMMATION"
        title="Tous les événements"
        subtitle="La Fairy House évolue au fil des saisons et des inspirations…"
        image="/photo/Ostara_1.jpg"
      />

      <section className="bg-cream-light py-24">
        <div className="mx-auto max-w-6xl px-6">
          {loading ? (
            <p className="text-center text-gray-500">Chargement…</p>
          ) : events.length === 0 ? (
            <div className="mx-auto max-w-4xl rounded-2xl border border-cream bg-white px-8 py-20 text-center">
              <p className="text-xl font-medium text-ink">
                D'autres expériences arrivent bientôt
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <article
                  key={e.id}
                  className="overflow-hidden rounded-2xl border border-cream bg-white"
                >
                  {e.image_url && (
                    <img
                      src={e.image_url}
                      alt={e.title}
                      className="h-52 w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    {e.event_date && (
                      <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                        {formatDate(e.event_date)}
                      </p>
                    )}
                    <h3 className="mt-2 text-xl font-bold text-ink">{e.title}</h3>
                    {e.location && (
                      <p className="mt-1 text-sm text-gray-500">{e.location}</p>
                    )}
                    {e.description && (
                      <p className="mt-3 leading-relaxed text-gray-600">
                        {e.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">
            Être informé(e) des prochains événements
          </h2>
          <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 rounded-full border border-cream px-6 py-3 outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-dark"
            >
              S'inscrire
            </button>
          </form>
        </div>
      </section>

      <CTASection
        title="Vous souhaitez créer votre propre retraite à la Fairy House ?"
        text="Ce lieu peut aussi devenir le vôtre le temps d'un événement, d'un cercle ou d'une retraite sur mesure."
      />
    </main>
  )
}
