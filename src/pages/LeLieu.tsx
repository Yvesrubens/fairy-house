import { Link } from 'react-router-dom'
import { Eyebrow, CTASection } from '../components/ui'

const SPACES = [
  {
    name: 'Se reposer',
    img: '/photo/Chambre_Mabbon.jpg',
    label: 'SE REPOSER',
    text: 'Des chambres lumineuses et apaisantes, pensées comme des refuges. Des espaces simples et confortables, où le silence, le repos et la lenteur retrouvent leur place.',
  },
  {
    name: 'Créer',
    img: '/photo/Exterieur_pique_nique.png',
    label: 'CRÉER',
    text: "Des espaces ouverts à la créativité et à l'expression. Tables partagées, lumière naturelle, matériaux simples… tout invite à écrire, danser, dessiner, fabriquer, expérimenter. Un lieu où les idées prennent forme sans pression de résultat.",
  },
  {
    name: 'Se retrouver',
    img: '/photo/PXL_20260314_221152313.jpg',
    label: 'SE RETROUVER',
    text: "Des pièces de vie chaleureuses, pensées pour les échanges, les discussions et les moments partagés. Des espaces où l'on cuisine, où l'on rit, où l'on se raconte. Un refuge pour tisser du lien en douceur.",
  },
  {
    name: 'Respirer',
    img: '/photo/Bassin.jpg',
    label: 'RESPIRER',
    text: "À l'extérieur, la nature comme prolongement de la maison. Jardin, arbres, air libre, silence vivant… Un espace pour marcher, s'isoler, contempler, ou simplement être.",
  },
]

const COMFORT = [
  {
    title: 'Séjour',
    items: [
      'Chambres partagées (de 3 à 5 personnes)',
      'Salles de bain partagées',
      'Linge de maison en option : 5€ / personne',
    ],
  },
  {
    title: 'Repas',
    items: [
      'Petit déjeuner inclus',
      'Repas partagés : 8€/repas ou 15€/jour',
      'Repas en autonomie possible',
      'Courses livrées : forfait 10€ (sur réservation)',
      'Cuisine équipée à disposition',
    ],
  },
  {
    title: 'Vie sur place',
    items: [
      'Wifi disponible (fibre)',
      'Salle multi-activité avec miroirs',
      'Espace de travail calme',
      'Salle de détente : flipper, jukebox, ludothèque, rétroprojecteur...',
      'Bibliothèques thématiques',
      'Grand jardin avec un bassin aux carpes',
    ],
  },
]

export default function LeLieu() {
  return (
    <main>
      <PageHeroLocal />

      {/* HABITER LA MAISON */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Eyebrow>HABITER LA MAISON</Eyebrow>
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">Habiter la maison</h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            La Fairy House a été pensée comme un lieu vivant, accueillant et modulable, où
            chacun peut trouver sa manière d'être, de créer et de se déposer. Ici, les
            espaces ne sont pas figés : ils accompagnent les temps de repos, de création,
            de partage et d'introspection.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {SPACES.map((s) => (
            <div key={s.name} className="group relative h-96 overflow-hidden rounded-2xl">
              <img
                src={s.img}
                alt={s.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <h3 className="text-2xl font-bold">{s.name}</h3>
                <p className="mt-1 text-sm text-white/70 transition-opacity duration-300 group-hover:opacity-0">
                  Survolez pour en savoir plus
                </p>
                <p className="absolute inset-x-6 bottom-6 translate-y-4 text-sm leading-relaxed text-white/90 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONFORT */}
      <section className="bg-cream-light py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            Le confort du lieu : l'essentiel à savoir
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {COMFORT.map((c) => (
              <div key={c.title} className="rounded-2xl border border-cream bg-white p-8">
                <h3 className="text-xl font-bold text-gold">{c.title}</h3>
                <ul className="mt-5 space-y-3 text-gray-600">
                  {c.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-cream bg-white p-8 text-center">
            <h3 className="text-xl font-bold text-ink">Les Plus</h3>
            <p className="mt-4 leading-relaxed text-gray-600">
              La Fairy House est un espace autonome dédié aux retraites et aux séjours. Une
              présence bienveillante vit à proximité, dans une autre maison sur le terrain,
              disponible si besoin tout en respectant l'intimité du lieu.
            </p>
          </div>
        </div>
      </section>

      {/* COMMENT VENIR */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-ink sm:text-4xl">
            Comment venir ?
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3 text-center">
            <div>
              <h3 className="text-lg font-bold text-gold">Adresse</h3>
              <p className="mt-3 text-gray-600">
                Le Grand Leu<br />45230 La Chapelle sur Aveyron<br />France
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gold">Navette</h3>
              <p className="mt-3 text-gray-600">
                Depuis Montargis : 25 min<br />Depuis Nogent : 15 min<br />
                2 trajets/jour sur réservation
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gold">Contact</h3>
              <p className="mt-3 text-gray-600">
                <a href="tel:+33123456789" className="hover:text-gold">+33 1 23 45 67 89</a>
                <br />
                <a href="mailto:contact@fairyhousecollectif.com" className="hover:text-gold">
                  contact@fairyhousecollectif.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Prêt(e) à découvrir Fairy House ?"
        text="Réservez dès maintenant votre séjour dans notre havre de paix"
        cta="Réserver maintenant"
        to="/reserver"
      />
    </main>
  )
}

function PageHeroLocal() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-24">
      <img
        src="/photo/Vue_coucher_de_soleil.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center text-white">
        <h1 className="text-4xl font-bold sm:text-6xl">Fairy House</h1>
        <p className="mt-6 text-xl font-light sm:text-2xl">
          Un lieu pour se déposer, créer et se transformer
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/90">
          Ici, on prend le temps de se ressourcer, de prendre soin de soi, et d'avancer pas
          à pas vers la réalisation de ses rêves.
        </p>
        <Link
          to="/reserver"
          className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
        >
          Réserver maintenant
        </Link>
      </div>
    </section>
  )
}
