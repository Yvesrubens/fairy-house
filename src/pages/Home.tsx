import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Heart,
  Sparkles,
  HomeIcon,
  Leaf,
  CheckCircle,
  ArrowRight,
} from '../components/icons'
import { listPublishedEvents } from '../lib/api'
import { formatDate } from '../lib/format'
import type { EventRow } from '../types/db'

// Nombre maximum d'événements affichés dans la section Programmation
const MAX_EVENEMENTS_ACCUEIL = 3

const ROOMS = [
  {
    name: 'Chambre Litha',
    img: '/photo/Chambre_Litha.jpg',
    subtitle: 'Espace intime, familial pour 2 à 3 personnes',
    features: ['Lit double', 'Vue sur jardin'],
  },
  {
    name: 'Chambre Mabon',
    img: '/photo/Chambre_Mabbon.jpg',
    subtitle: 'Dortoir partagé pour 5 personnes',
    features: ['Vue sur jardin'],
  },
  {
    name: 'Chambre Imbolc',
    img: '/photo/Chambre_Imbolc.jpg',
    subtitle: 'Dortoir 4 personnes',
    features: ['Vue sur jardin'],
  },
]

const PROJECTS = [
  {
    title: 'Privatisation simple',
    img: '/photo/Vue_d_ensemble.jpg',
    subtitle: 'Pour vos vacances, séminaires, retraites...',
    points: [
      'Jusqu’à 12 personnes',
      'Maison privatisée',
      'Jardin arboré et bassin à carpes pour se détendre',
    ],
    cta: 'Réserver',
    to: '/reserver',
  },
  {
    title: 'Organisation d’un séjour sur mesure',
    img: '/photo/Chill_Room.jpg',
    subtitle: 'Pour vos retraites, EVJF/EVG, cérémonies...',
    points: [
      'Jusqu’à 12 personnes',
      'Possibilité de faire venir des intervenant.e.s',
      'Accompagnement dans l’organisation et proposition de programmes thématiques',
    ],
    cta: 'Découvrir les intervenant(e)s',
    to: '/intervenants',
  },
]

// Positions fixes des points lumineux animés (section Résidences)
const SPARKLE_DOTS = [
  [42.9, 49.2, 1.68], [3.7, 44.9, 0.37], [85.7, 40.0, 1.92], [79.0, 88.6, 0.35],
  [63.9, 35.7, 1.68], [55.0, 4.6, 0.0], [68.0, 52.3, 0.62], [14.1, 90.8, 0.99],
  [14.5, 9.1, 1.98], [62.0, 23.9, 0.64], [31.3, 46.5, 0.92], [33.9, 11.7, 1.43],
  [77.2, 58.3, 0.05], [22.8, 63.4, 1.82], [69.9, 86.4, 0.03], [97.4, 44.4, 0.44],
  [77.5, 50.8, 0.51], [91.3, 44.4, 1.55], [1.1, 79.3, 1.26], [23.4, 77.9, 0.16],
]

export default function Home() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    listPublishedEvents()
      .then((all) => {
        // On ne garde que les événements à venir (ou sans date), triés au plus proche
        const today = new Date().toISOString().slice(0, 10)
        const upcoming = all.filter((e) => !e.event_date || e.event_date >= today)
        setEvents(upcoming.slice(0, MAX_EVENEMENTS_ACCUEIL))
      })
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false))
  }, [])

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/photo/Vue_coucher_de_soleil.jpg"
              alt="Fairy House"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 pointer-events-none" />
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight animate-fade-in-up">
                FAIRY HOUSE
              </h1>
              <p
                className="text-xl md:text-3xl font-light mb-4 animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                Bienvenue au Sanctuaire de vos Inspirations !
              </p>
              <p
                className="text-base md:text-2xl font-light mb-12 max-w-3xl mx-auto animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                Un lieu pour se révéler, créer, oser et ressentir
              </p>
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
                style={{ animationDelay: '0.3s' }}
              >
                <Link
                  to="/le-lieu"
                  className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-semibold transition-all text-center"
                >
                  Entrez dans la Fairy House
                </Link>
                <Link
                  to="/evenements"
                  className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-semibold transition-all"
                >
                  Découvrir nos expériences
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-white" />
          </div>
        </section>

        {/* NOTRE VISION */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/photo/PXL_20260101_081856561.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-black/90" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-fairy-gold/20 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
                  <Heart className="w-5 h-5 text-fairy-gold" />
                  <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                    Notre Vision
                  </span>
                </div>
                <h2 className="text-2xl md:text-5xl font-bold mb-6 text-white leading-tight">
                  Un sanctuaire vivant, refuge pour les âmes créatives, sensibles et
                  indomptées.
                </h2>
                <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-8" />
              </div>
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-amber-50/95 backdrop-blur-md rounded-3xl p-6 md:p-12 border border-amber-100/50">
                  <div className="space-y-3 text-center">
                    <p className="text-xl leading-snug text-gray-800 font-light italic">
                      La Fairy House n'est pas un lieu de consommation.
                    </p>
                    <p className="text-xl leading-snug text-gray-800 font-light italic">
                      C'est un espace de passage.
                    </p>
                    <p className="text-xl leading-snug text-gray-800 font-light italic">
                      Un endroit où l'on dépose les rôles, les attentes, les armures
                      sociales.
                    </p>
                    <p className="text-xl leading-snug text-gray-800 font-light italic">
                      Ici, on explore le corps, la présence, la créativité et le feu
                      intérieur.
                    </p>
                    <div className="pt-3">
                      <p className="text-xl leading-snug text-gray-900 font-semibold">
                        L'art et l'intime ne sont plus séparés.
                      </p>
                      <p className="text-xl leading-snug text-gray-900 font-semibold">
                        Ils se répondent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Link
                  to="/le-lieu"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-white hover:to-white rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-fairy-gold/50 hover:scale-105"
                >
                  Découvrir la Fairy House
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PROGRAMMATION */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-fairy-gold/10 px-6 py-2 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Programmation
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
                Au programme à la Fairy House
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-6" />
            </div>
            {eventsLoading ? (
              <p className="text-center text-gray-500 py-12">Chargement…</p>
            ) : events.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {events.map((e) => (
                    <Link
                      key={e.id}
                      to={`/evenements/${e.slug}`}
                      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col"
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
                    </Link>
                  ))}
                </div>
                <div className="text-center mt-12">
                  <Link
                    to="/evenements"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all"
                  >
                    Voir tous les événements
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Aucun événement à venir pour le moment.
              </div>
            )}
          </div>
        </section>

        {/* HÉBERGEMENTS */}
        <section
          id="hebergements"
          className="py-24 bg-gradient-to-b from-gray-50 to-white scroll-mt-20"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-fairy-gold/10 px-6 py-2 rounded-full mb-6">
                <HomeIcon className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Hébergements
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
                Votre séjour à la Fairy House
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-6" />
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-xl text-gray-700 leading-relaxed">
                  Fairy House, un lieu de révélation, d'incarnation et de liberté.
                </p>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Ici on vous invite à prendre le temps de vous ressourcer, de prendre
                  soin de vous tant mentalement, émotionnellement ou physiquement, et de
                  poser la prochaine pierre vers la réalisation de vos rêves.
                </p>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Et si cela vous paraît ambitieux, c'est peut-être le moment de justement
                  prendre ce temps pour vous. De vous écouter, avec patience et douceur.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
              {ROOMS.map((room) => (
                <div
                  key={room.name}
                  className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-fairy-gold/20 transition-all duration-500 flex flex-col"
                >
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={room.img}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-6 right-6">
                      <div className="bg-fairy-gold px-4 py-2 rounded-full shadow-lg">
                        <span className="text-black font-bold text-sm">Disponible</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-8 flex flex-col flex-grow">
                    <h3 className="text-3xl font-bold mb-3 text-gray-900 group-hover:text-fairy-gold transition-colors">
                      {room.name}
                    </h3>
                    <p className="text-lg text-gray-600 mb-6">{room.subtitle}</p>
                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 flex-grow">
                      {room.features.map((f) => (
                        <div key={f} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-fairy-gold flex-shrink-0" />
                          <p className="text-sm text-gray-700 font-medium">{f}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/reserver')}
                      className="w-full px-8 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg hover:shadow-xl mt-auto text-center block"
                    >
                      Réserver maintenant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VOS PROJETS */}
        <section className="relative py-32 overflow-hidden bg-white">
          <div className="absolute inset-0 opacity-5">
            <img
              src="/photo/PXL_20260320_085850183.jpg"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-fairy-gold/10 px-6 py-2 rounded-full mb-6">
                <Leaf className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Vos Projets
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
                Votre expérience sur mesure
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-6" />
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-xl text-gray-700 leading-relaxed">
                  Vous souhaitez organiser un EVJF/EVG, une retraite, une résidence
                  artistique, une cérémonie ou juste des vacances entre ami.e.s ?
                </p>
                <p className="text-xl text-gray-700 leading-relaxed">
                  La Fairy House vous est ouverte et l'équipe est à votre disposition pour
                  vous aider à organiser un séjour inoubliable.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {PROJECTS.map((p) => (
                <div
                  key={p.title}
                  className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{p.title}</h3>
                    </div>
                  </div>
                  <div className="bg-white p-6 flex flex-col flex-grow">
                    <p className="text-gray-600 mb-6 text-lg">{p.subtitle}</p>
                    <ul className="space-y-3 mb-6 flex-grow">
                      {p.points.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-center gap-3 text-gray-700"
                        >
                          <div className="w-6 h-6 bg-fairy-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 bg-fairy-gold rounded-full" />
                          </div>
                          <span className="font-medium">{pt}</span>
                        </li>
                      ))}
                    </ul>
                    {p.to === '/reserver' ? (
                      <button
                        onClick={() => navigate('/reserver')}
                        className="w-full px-6 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-md hover:shadow-lg text-center block mt-auto"
                      >
                        {p.cta}
                      </button>
                    ) : (
                      <Link
                        to={p.to}
                        className="w-full px-6 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-md hover:shadow-lg text-center block mt-auto"
                      >
                        {p.cta}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RÉSIDENCES */}
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
          <img
            src="/photo/Ostara_1.jpg"
            alt="Résidences"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
          <div className="absolute inset-0">
            {SPARKLE_DOTS.map(([top, left, delay], i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-fairy-gold/30 rounded-full animate-pulse"
                style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${delay}s` }}
              />
            ))}
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-white py-20">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-8">
                <Sparkles className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Résidences
                </span>
              </div>
              <h2 className="text-2xl md:text-5xl font-bold mb-8 leading-tight">
                Un espace imaginé comme une entité,
                <br />
                un cocon vivant
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-12" />
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-xl text-gray-200 leading-relaxed space-y-6">
                  <p className="text-2xl font-light">
                    À la Fairy House, le corps devient langage.
                    <br />
                    La créativité est un chemin à explorer.
                  </p>
                  <p className="text-xl">
                    Et vous êtes à la barre de votre vie, de vos décisions.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <p className="font-semibold text-white text-xl mb-6 text-center">
                    La Fairy House est un refuge pour :
                  </p>
                  <ul className="space-y-4 text-lg text-gray-200 max-w-md mx-auto text-center">
                    {[
                      'se reconnecter à son corps',
                      'libérer sa créativité',
                      'reprendre sa place',
                      'se révéler à son propre rythme',
                    ].map((b) => (
                      <li key={b} className="flex items-center justify-center gap-3">
                        <span className="text-fairy-gold text-2xl">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xl text-gray-200 leading-relaxed">
                  Ici, chacun·e avance à son propre rythme. À travers diverses activités
                  proposées, en communauté ou sur réservation, nous vous invitons à mêler
                  pratique artistique et approche thérapeutique pour ouvrir des espaces de
                  transformation douce et profonde.
                </p>
              </div>
              <div className="mt-12">
                <Link
                  to="/evenements"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-white hover:to-white rounded-full font-bold text-lg transition-all shadow-2xl hover:shadow-fairy-gold/50 hover:scale-105"
                >
                  Découvrir notre programmation
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTEZ-NOUS */}
        <section className="relative py-32 bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-fairy-gold/20 to-transparent" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full mb-8">
                <Heart className="w-5 h-5 text-fairy-gold" />
                <span className="text-fairy-gold font-semibold uppercase tracking-wider text-sm">
                  Contactez-nous
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
                Contactez-nous
              </h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-fairy-gold to-transparent mx-auto mb-8" />
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Retraite, résidence artistique, EVJF/EVG, cérémonie :
                <br />
                on adapte la Fairy House à votre projet
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-white hover:to-white rounded-full font-bold text-xl transition-all shadow-2xl hover:shadow-fairy-gold/50 hover:scale-105"
              >
                Nous contacter
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
