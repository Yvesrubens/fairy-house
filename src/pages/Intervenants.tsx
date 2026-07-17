import { useEffect, useMemo, useState } from 'react'
import { PageHero, CTASection } from '../components/ui'
import { listPublishedIntervenants } from '../lib/api'
import type { Intervenant } from '../types/db'

export default function Intervenants() {
  const [people, setPeople] = useState<Intervenant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous les domaines')
  const [flipped, setFlipped] = useState<string | null>(null)

  useEffect(() => {
    listPublishedIntervenants()
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoading(false))
  }, [])

  const domains = useMemo(
    () => ['Tous les domaines', ...new Set(people.map((p) => p.domain))],
    [people],
  )

  const list = people.filter(
    (p) => filter === 'Tous les domaines' || p.domain === filter,
  )

  return (
    <main>
      <PageHero
        eyebrow="LES ACCOMPAGNANT·ES"
        title="Les visages des ateliers"
        subtitle="Des artistes, thérapeutes et créateur·ices qui font vivre la Fairy House et vous accompagnent dans votre cheminement."
        image="/photo/Chill_Room.jpg"
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-gray-500">Cliquez sur une carte pour en savoir plus</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  filter === d
                    ? 'bg-gold text-black'
                    : 'border border-cream text-ink hover:border-gold'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-14 text-center text-gray-500">Chargement…</p>
          ) : list.length === 0 ? (
            <p className="mx-auto mt-14 max-w-2xl rounded-2xl border border-cream bg-cream-light px-8 py-16 text-center text-gray-500">
              Aucun·e accompagnant·e pour le moment.
            </p>
          ) : (
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {list.map((p) => {
                const isFlipped = flipped === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setFlipped(isFlipped ? null : p.id)}
                    className="group flex h-80 flex-col overflow-hidden rounded-2xl border border-cream bg-cream-light text-left transition-shadow hover:shadow-xl"
                  >
                    {p.photo_url && (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="h-32 w-full object-cover"
                      />
                    )}
                    <div className="flex flex-1 flex-col p-8">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                        {p.domain}
                      </span>
                      <h3 className="mt-3 text-2xl font-bold text-ink">{p.name}</h3>
                      <p className="mt-4 flex-1 leading-relaxed text-gray-600">
                        {p.bio}
                      </p>
                      {!isFlipped ? (
                        <span className="mt-4 text-sm font-medium text-gold">
                          Cliquer pour en savoir plus →
                        </span>
                      ) : (
                        <div className="mt-4 flex items-center justify-between">
                          {p.price && (
                            <span className="text-lg font-bold text-ink">
                              {p.price}
                            </span>
                          )}
                          {p.website && (
                            <a
                              href={p.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium text-gold hover:text-gold-dark"
                            >
                              Site web
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <CTASection
        title="Contactez nos accompagnant·es"
        text="Vous souhaitez organiser une session ou en savoir plus sur nos accompagnant·es ?"
      />
    </main>
  )
}
