import { Link } from 'react-router-dom'
import { PageHero, CTASection } from '../components/ui'

export default function Evenements() {
  return (
    <main>
      <PageHero
        eyebrow="NOTRE PROGRAMMATION"
        title="Tous les événements"
        subtitle="La Fairy House évolue au fil des saisons et des inspirations…"
        image="/photo/Ostara_1.jpg"
      />

      <section className="bg-cream-light py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="rounded-2xl border border-cream bg-white px-8 py-20">
            <p className="text-xl font-medium text-ink">
              D'autres expériences arrivent bientôt
            </p>
            <Link
              to="/evenements"
              className="mt-8 inline-block rounded-full border-2 border-gold px-8 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold hover:text-black"
            >
              Voir tous les événements
            </Link>
          </div>
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
