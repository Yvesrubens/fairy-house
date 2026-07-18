import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublishedIntervenants } from '../lib/api'
import type { Intervenant } from '../types/db'
import { ExternalLink, Mail } from '../components/icons'

function PersonCard({ person }: { person: Intervenant }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      className="cursor-pointer rounded-3xl shadow-xl flip-card"
      style={{ perspective: '1000px', height: '440px' }}
      onClick={() => setFlipped((v) => !v)}
    >
      <div className={`flip-card-inner rounded-3xl ${flipped ? 'is-flipped' : ''}`}>
        {/* Recto */}
        <div className="flip-card-face rounded-3xl">
          {person.photo_url && (
            <img
              src={person.photo_url}
              alt={person.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
            <span className="inline-block bg-fairy-gold/90 text-black text-xs font-bold px-3 py-1 rounded-full mb-3 self-start">
              {person.domain}
            </span>
            <h3 className="text-2xl font-bold text-white mb-2">{person.name}</h3>
            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
              {person.bio}
            </p>
            <p className="text-fairy-gold text-xs mt-3 font-medium">
              Cliquer pour en savoir plus →
            </p>
          </div>
        </div>
        {/* Verso */}
        <div className="flip-card-face flip-card-back bg-gradient-to-br from-gray-900 to-black flex flex-col p-7 text-white rounded-3xl">
          <span className="inline-block bg-fairy-gold/20 text-fairy-gold text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
            {person.domain}
          </span>
          <h3 className="text-xl font-bold mb-4">{person.name}</h3>
          <p className="text-gray-300 text-sm leading-relaxed flex-1 overflow-y-auto">
            {person.bio}
          </p>
          <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
            {person.price && (
              <p className="text-2xl font-bold text-fairy-gold">{person.price}</p>
            )}
            {person.website && (
              <a
                href={person.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-fairy-gold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Site web
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Intervenants() {
  const [people, setPeople] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    listPublishedIntervenants()
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoading(false))
  }, [])

  const domains = useMemo(
    () => [...new Set(people.map((p) => p.domain))],
    [people],
  )

  const list = people.filter((p) => !filter || p.domain === filter)

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden mt-20">
          <div className="absolute inset-0">
            <img
              src="/photo/Vue_coucher_de_soleil.jpg"
              alt="Les accompagnant·es"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold mb-6">
              Les accompagnant·es
            </h1>
            <p className="text-base md:text-2xl lg:text-3xl font-light max-w-3xl mx-auto">
              Les visages des ateliers
              <br />
              Des artistes, thérapeutes et créateur·ices qui font vivre la Fairy House et
              vous accompagnent dans votre cheminement.
            </p>
          </div>
        </section>

        {/* LISTE */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
              <p className="text-gray-500 text-sm">
                Cliquez sur une carte pour en savoir plus
              </p>
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border-2 border-fairy-gold/40 hover:border-fairy-gold rounded-full text-sm font-medium text-gray-700 focus:outline-none focus:border-fairy-gold cursor-pointer shadow-sm"
                >
                  <option value="">Tous les domaines</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fairy-gold">
                  ▾
                </span>
              </div>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-12">Chargement…</p>
            ) : list.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                Aucun·e accompagnant·e pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((p) => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Contactez nos accompagnant·es
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Vous souhaitez organiser une session ou en savoir plus sur nos
                accompagnant·es ?
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 px-10 py-5 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold text-lg transition-all shadow-lg"
              >
                <Mail className="w-5 h-5" />
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
