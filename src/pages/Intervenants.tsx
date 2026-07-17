import { useState } from 'react'
import { PageHero, CTASection } from '../components/ui'

type Person = {
  name: string
  domain: string
  bio: string
  price: string
  site?: boolean
}

const PEOPLE: Person[] = [
  {
    name: 'Marie Dubois',
    domain: 'Mouvement Conscient & Danse Intuitive',
    bio: 'Danseuse et thérapeute psychocorporelle, Marie accompagne depuis 15 ans les personnes dans leur reconnexion au corps à travers le mouvement conscient.',
    price: '80€/h',
    site: true,
  },
  {
    name: 'Sophie Laurent',
    domain: 'Burlesque & Empowerment',
    bio: "Artiste burlesque et coach en développement personnel, Sophie utilise l'art de la scène comme outil de libération et d'affirmation de soi.",
    price: '75€/h',
    site: true,
  },
  {
    name: 'Thomas Martin',
    domain: 'Yoga & Méditation',
    bio: 'Professeur de yoga certifié et méditant depuis 20 ans, Thomas propose une approche douce et profonde de la pratique.',
    price: '70€/h',
  },
]

const DOMAINS = [
  'Tous les domaines',
  'Burlesque & Empowerment',
  'Mouvement Conscient & Danse Intuitive',
  'Yoga & Méditation',
]

export default function Intervenants() {
  const [filter, setFilter] = useState('Tous les domaines')
  const [flipped, setFlipped] = useState<string | null>(null)

  const list = PEOPLE.filter((p) => filter === 'Tous les domaines' || p.domain === filter)

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
            {DOMAINS.map((d) => (
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

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {list.map((p) => {
              const isFlipped = flipped === p.name
              return (
                <button
                  key={p.name}
                  onClick={() => setFlipped(isFlipped ? null : p.name)}
                  className="group flex h-80 flex-col rounded-2xl border border-cream bg-cream-light p-8 text-left transition-shadow hover:shadow-xl"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {p.domain}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-ink">{p.name}</h3>
                  {!isFlipped ? (
                    <>
                      <p className="mt-4 flex-1 leading-relaxed text-gray-600">{p.bio}</p>
                      <span className="mt-4 text-sm font-medium text-gold">
                        Cliquer pour en savoir plus →
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 flex-1 leading-relaxed text-gray-600">{p.bio}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-bold text-ink">{p.price}</span>
                        {p.site && (
                          <span className="text-sm font-medium text-gold">Site web</span>
                        )}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <CTASection
        title="Contactez nos accompagnant·es"
        text="Vous souhaitez organiser une session ou en savoir plus sur nos accompagnant·es ?"
      />
    </main>
  )
}
