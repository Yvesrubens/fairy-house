import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedEvents } from '../lib/api'
import { formatDate } from '../lib/format'
import type { EventRow } from '../types/db'
import { Filter, Mail } from '../components/icons'

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
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-20">
          <div className="absolute inset-0">
            <img
              src="/photo/Exterieur_pique_nique.png"
              alt="Notre programmation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Notre programmation
            </h1>
          </div>
        </section>

        {/* FILTRES */}
        <section className="py-8 bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <button className="px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all bg-fairy-gold text-white">
                Tous les événements
              </button>
            </div>
          </div>
        </section>

        {/* LISTE */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center text-gray-500 py-20">Chargement…</p>
            ) : events.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-screen-2xl mx-auto">
                {events.map((e) => (
                  <article
                    key={e.id}
                    className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col"
                  >
                    {e.image_url && (
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={e.image_url}
                          alt={e.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      {e.event_date && (
                        <p className="text-sm font-semibold uppercase tracking-wider text-fairy-gold">
                          {formatDate(e.event_date)}
                        </p>
                      )}
                      <h3 className="mt-2 text-xl font-bold text-gray-900 group-hover:text-fairy-gold transition-colors">
                        {e.title}
                      </h3>
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
            ) : (
              <div className="text-center py-20">
                <div className="max-w-2xl mx-auto">
                  <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
                    La Fairy House évolue au fil des saisons et des inspirations…
                    <br />
                    D'autres expériences arrivent bientôt
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/evenements"
                      className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all"
                    >
                      Voir tous les événements
                    </Link>
                    <Link
                      to="/contact"
                      className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Être informé(e) des prochains événements
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-6">
              Vous souhaitez créer votre propre retraite à la Fairy House ?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Ce lieu peut aussi devenir le vôtre le temps d'un événement, d'un cercle ou
              d'une retraite sur mesure.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-full bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-white shadow-lg hover:shadow-2xl hover:scale-105 animate-glow px-8 py-4 text-lg"
            >
              <span>Nous contacter</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
