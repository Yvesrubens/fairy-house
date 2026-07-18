import { useState } from 'react'
import {
  HomeIcon,
  Bed,
  Utensils,
  Wifi,
  MapPin,
  Car,
  Phone,
} from '../components/icons'
import { useReservation } from '../components/Reservation'

const SPACES = [
  {
    name: 'Se Reposer',
    img: '/photo/Chambre_Mabbon.jpg',
    text: 'Des chambres lumineuses et apaisantes, pensées comme des refuges. Des espaces simples et confortables, où le silence, le repos et la lenteur retrouvent leur place.',
  },
  {
    name: 'Créer',
    img: '/photo/Exterieur_pique_nique.png',
    text: "Des espaces ouverts à la créativité et à l'expression. Tables partagées, lumière naturelle, matériaux simples… tout invite à écrire, danser, dessiner, fabriquer, expérimenter. Un lieu où les idées prennent forme sans pression de résultat.",
  },
  {
    name: 'Se retrouver',
    img: '/photo/PXL_20260314_221152313.jpg',
    text: "Des pièces de vie chaleureuses, pensées pour les échanges, les discussions et les moments partagés. Des espaces où l'on cuisine, où l'on rit, où l'on se raconte. Un refuge pour tisser du lien en douceur.",
  },
  {
    name: 'Respirer',
    img: '/photo/Bassin.jpg',
    text: "À l'extérieur, la nature comme prolongement de la maison. Jardin, arbres, air libre, silence vivant… Un espace pour marcher, s'isoler, contempler, ou simplement être.",
  },
]

const COMFORT = [
  {
    title: 'Séjour',
    Icon: Bed,
    items: [
      'Chambres partagées (de 3 à 5 personnes)',
      'Salles de bain partagées',
      'Linge de maison en option : 5€ / personne',
    ],
  },
  {
    title: 'Repas',
    Icon: Utensils,
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
    Icon: Wifi,
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

function FlipCard({ space }: { space: { name: string; img: string; text: string } }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      className="flip-card cursor-pointer rounded-2xl shadow-xl"
      style={{ perspective: '1000px', height: '360px' }}
      onClick={() => setFlipped((v) => !v)}
    >
      <div className={`flip-card-inner rounded-2xl ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-card-face rounded-2xl">
          <img
            src={space.img}
            alt={space.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div>
              <h3 className="text-3xl font-bold text-white">{space.name}</h3>
              <p className="text-white/70 text-sm mt-1">
                Touchez ou survolez pour en savoir plus
              </p>
            </div>
          </div>
        </div>
        <div className="flip-card-face flip-card-back bg-amber-50 flex flex-col justify-center p-8">
          <div className="inline-flex items-center gap-2 bg-fairy-gold/15 px-4 py-1.5 rounded-full mb-4 self-start">
            <span className="text-fairy-gold font-semibold text-sm uppercase tracking-wide">
              {space.name}
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">{space.text}</p>
        </div>
      </div>
    </div>
  )
}

export default function LeLieu() {
  const { open: openReservation } = useReservation()
  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden mt-20">
          <div className="absolute inset-0">
            <img
              src="/photo/Vue_coucher_de_soleil.jpg"
              alt="Fairy House"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">Fairy House</h1>
            <p className="text-xl md:text-3xl font-light">
              Un lieu pour se déposer, créer et se transformer
            </p>
          </div>
        </section>

        {/* INTRO */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-2xl text-gray-700 leading-relaxed">
                Ici, on prend le temps de se ressourcer, de prendre soin de soi, et
                d'avancer pas à pas vers la réalisation de ses rêves.
              </p>
            </div>
          </div>
        </section>

        {/* HABITER LA MAISON */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-fairy-gold/10 px-6 py-2 rounded-full mb-6">
                <HomeIcon className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Habiter la maison
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-900">
                Habiter la maison
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-8" />
              <p className="text-xl text-gray-700 leading-relaxed">
                La Fairy House a été pensée comme un lieu vivant, accueillant et modulable,
                où chacun peut trouver sa manière d'être, de créer et de se déposer. Ici,
                les espaces ne sont pas figés : ils accompagnent les temps de repos, de
                création, de partage et d'introspection.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SPACES.map((s) => (
                <FlipCard key={s.name} space={s} />
              ))}
            </div>
          </div>
        </section>

        {/* CONFORT */}
        <section className="pt-10 pb-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold mb-12 text-center text-gray-900">
                Le confort du lieu : l'essentiel à savoir
              </h2>
              <div className="grid md:grid-cols-2 gap-12">
                {COMFORT.map(({ title, Icon, items }) => (
                  <div
                    key={title}
                    className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-fairy-gold" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                    </div>
                    <ul className="space-y-3 text-gray-700">
                      {items.map((it) => (
                        <li key={it} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-fairy-gold rounded-full mt-2 flex-shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Les Plus */}
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-fairy-gold" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Les Plus</h3>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <p className="leading-relaxed">
                      La Fairy House est un espace autonome dédié aux retraites et aux
                      séjours.
                    </p>
                    <p className="leading-relaxed">
                      Une présence bienveillante vit à proximité, dans une autre maison sur
                      le terrain, disponible si besoin tout en respectant l'intimité du
                      lieu.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMENT VENIR */}
        <section className="py-24 bg-gradient-to-br from-fairy-gold/5 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold mb-12 text-center text-fairy-black">
                Comment venir ?
              </h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-fairy-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">Adresse</h3>
                      <p className="text-gray-600">
                        Le Grand Leu
                        <br />
                        45230 La Chapelle sur Aveyron
                        <br />
                        France
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car className="w-6 h-6 text-fairy-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">Navette</h3>
                      <p className="text-gray-600">
                        Depuis Montargis : 25 min
                        <br />
                        Depuis Nogent : 15 min
                        <br />
                        2 trajets/jour sur réservation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-fairy-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-fairy-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">Contact</h3>
                      <p className="text-gray-600">
                        <a
                          href="tel:+33123456789"
                          className="hover:text-fairy-gold transition-colors"
                        >
                          +33 1 23 45 67 89
                        </a>
                        <br />
                        <a
                          href="mailto:contact@fairyhousecollectif.com"
                          className="hover:text-fairy-gold transition-colors"
                        >
                          contact@fairyhousecollectif.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-2xl h-96 overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps?q=Le+Grand+Leu,+45230+La+Chapelle-sur-Aveyron&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localisation Fairy House"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-fairy-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-6">
              Prêt(e) à découvrir Fairy House ?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Réservez dès maintenant votre séjour dans notre havre de paix
            </p>
            <button
              onClick={openReservation}
              className="inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-full bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-white shadow-lg hover:shadow-2xl hover:scale-105 animate-glow px-10 py-5 text-xl"
            >
              <span>Réserver maintenant</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
