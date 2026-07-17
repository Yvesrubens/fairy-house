import { PageHero, CTASection } from '../components/ui'

export default function Blog() {
  return (
    <main>
      <PageHero
        eyebrow="JOURNAL"
        title="Journal de la Fairy House"
        subtitle="Un espace pour partager les histoires, les inspirations et les mouvements qui traversent la Fairy House au fil des saisons."
        image="/photo/PXL_20260320_085953235.jpg"
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">Derniers articles</h2>
          <p className="mt-10 rounded-2xl border border-cream bg-cream-light px-8 py-16 text-lg text-gray-500">
            Aucun article pour le moment.
          </p>
        </div>
      </section>

      <CTASection
        title="Rejoindre la communauté"
        text="Entrez dans le cercle de la Fairy House. Recevez des nouvelles du lieu, des retraites et des mouvements qui le traversent au fil du temps."
        cta="Entrer dans le cercle"
      />
    </main>
  )
}
