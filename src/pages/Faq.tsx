import { PageHero, CTASection } from '../components/ui'

export default function Faq() {
  return (
    <main>
      <PageHero
        eyebrow="FAQ"
        title="Questions fréquentes"
        subtitle="Tout ce que vous devez savoir sur la Fairy House"
        image="/photo/PXL_20260101_081856561.jpg"
      />

      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="rounded-2xl border border-cream bg-cream-light px-8 py-16 text-lg text-gray-500">
            Le contenu de la FAQ arrive bientôt.
          </p>
        </div>
      </section>

      <CTASection
        title="Vous n'avez pas trouvé la réponse à votre question ?"
        cta="Contactez-nous"
      />
    </main>
  )
}
