import { PageHero } from '../components/ui'

export default function Contact() {
  return (
    <main>
      <PageHero
        eyebrow="NOUS CONTACTER"
        title="Une question, une envie, un projet ?"
        subtitle="Écrivez-nous pour échanger autour de la Fairy House, des retraites ou des expériences que vous aimeriez y imaginer."
        image="/photo/Chill_Room.jpg"
      />

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div className="rounded-2xl border border-cream bg-cream-light p-8">
            <h2 className="text-2xl font-bold text-ink">Écrivez-nous</h2>
            <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Prénom *" />
                <Field label="Nom *" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email *" type="email" />
                <Field label="Téléphone" type="tel" />
              </div>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Sujet</span>
                <select className="w-full rounded-lg border border-cream bg-white px-4 py-3 outline-none focus:border-gold">
                  <option>Réservation</option>
                  <option>Événement</option>
                  <option>Résidence artistique</option>
                  <option>Intervenant</option>
                  <option>Autre</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Votre message *</span>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-cream bg-white px-4 py-3 outline-none focus:border-gold"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-dark"
              >
                Envoyer le message
              </button>
              <p className="text-sm text-gray-500">
                Nous vous répondrons dans les 48 heures
              </p>
            </form>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-2xl font-bold text-ink">Informations de contact</h2>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Email</h3>
                <a href="mailto:contact@fairyhouse.com" className="mt-1 block text-gray-700 hover:text-gold">
                  contact@fairyhouse.com
                </a>
                <p className="text-sm text-gray-500">Réponse sous 48h</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">Adresse</h3>
                <p className="mt-1 text-gray-700">
                  Le Grand Leu<br />45230 La Chapelle sur Aveyron<br />France
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                  Réseaux sociaux
                </h3>
                <div className="mt-2 flex gap-4">
                  <a href="https://www.facebook.com/FairyHouse" className="text-gray-700 hover:text-gold">
                    Facebook
                  </a>
                  <a href="https://www.instagram.com/fairyhouse" className="text-gray-700 hover:text-gold">
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({ label, type = 'text' }: { label: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        className="w-full rounded-lg border border-cream bg-white px-4 py-3 outline-none focus:border-gold"
      />
    </label>
  )
}
