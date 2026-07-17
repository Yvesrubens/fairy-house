import { Link } from 'react-router-dom'

function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p
      className={`mb-4 text-sm font-semibold uppercase tracking-[0.25em] ${
        light ? 'text-gold' : 'text-gold'
      }`}
    >
      {children}
    </p>
  )
}

const ROOMS = [
  {
    name: 'Chambre Litha',
    img: '/photo/Chambre_Litha.jpg',
    features: ['Espace intime, familial pour 2 à 3 personnes', 'Lit double', 'Vue sur jardin'],
  },
  {
    name: 'Chambre Mabon',
    img: '/photo/Chambre_Mabbon.jpg',
    features: ['Dortoir partagé pour 5 personnes', 'Vue sur jardin'],
  },
  {
    name: 'Chambre Imbolc',
    img: '/photo/Chambre_Imbolc.jpg',
    features: ['Dortoir 4 personnes', 'Vue sur jardin'],
  },
]

const PROJECTS = [
  {
    title: 'Privatisation simple',
    subtitle: 'Pour vos vacances, séminaires, retraites...',
    img: '/photo/Vue_d_ensemble.jpg',
    points: [
      'Jusqu’à 12 personnes',
      'Maison privatisée',
      'Jardin arboré et bassin à carpes pour se détendre',
    ],
    cta: 'Réserver',
  },
  {
    title: 'Organisation d’un séjour sur mesure',
    subtitle: 'Pour vos retraites, EVJF/EVG, cérémonies...',
    img: '/photo/Chill_Room.jpg',
    points: [
      'Jusqu’à 12 personnes',
      'Possibilité de faire venir des intervenant.e.s',
      'Accompagnement dans l’organisation et proposition de programmes thématiques',
    ],
    cta: 'Découvrir les intervenant(e)s',
  },
]

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden">
        <img
          src="/photo/Vue_coucher_de_soleil.jpg"
          alt="Fairy House"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            FAIRY HOUSE
          </h1>
          <p className="mt-6 text-2xl font-light sm:text-3xl">
            Bienvenue au Sanctuaire de vos Inspirations !
          </p>
          <p className="mt-3 text-lg text-white/90 sm:text-xl">
            Un lieu pour se révéler, créer, oser et ressentir
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/le-lieu"
              className="rounded-full bg-gold px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
            >
              Entrez dans la Fairy House
            </Link>
            <Link
              to="/evenements"
              className="rounded-full bg-gold px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
            >
              Découvrir nos expériences
            </Link>
          </div>
        </div>
      </section>

      {/* NOTRE VISION */}
      <section className="relative overflow-hidden py-28">
        <img
          src="/photo/PXL_20260101_081856561.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white">
          <Eyebrow light>NOTRE VISION</Eyebrow>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Un sanctuaire vivant, refuge pour les âmes créatives, sensibles et indomptées.
          </h2>
          <div className="mt-8 space-y-4 text-lg leading-relaxed text-white/90">
            <p>La Fairy House n'est pas un lieu de consommation.</p>
            <p>C'est un espace de passage.</p>
            <p>Un endroit où l'on dépose les rôles, les attentes, les armures sociales.</p>
            <p>Ici, on explore le corps, la présence, la créativité et le feu intérieur.</p>
            <p>L'art et l'intime ne sont plus séparés.</p>
            <p>Ils se répondent.</p>
          </div>
          <Link
            to="/le-lieu"
            className="mt-10 inline-block rounded-full border-2 border-white px-10 py-4 text-base font-semibold text-white transition-colors hover:bg-white hover:text-ink"
          >
            Découvrir la Fairy House
          </Link>
        </div>
      </section>

      {/* PROGRAMMATION */}
      <section className="bg-cream-light py-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Eyebrow>PROGRAMMATION</Eyebrow>
          <h2 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            Au programme à la Fairy House
          </h2>
          <div className="mt-12 rounded-2xl border border-cream bg-white px-8 py-16 text-lg text-gray-500">
            Aucun événement à venir
          </div>
        </div>
      </section>

      {/* HÉBERGEMENTS */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>HÉBERGEMENTS</Eyebrow>
            <h2 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
              Votre séjour à la Fairy House
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-gray-600">
              <p>Fairy House, un lieu de révélation, d'incarnation et de liberté.</p>
              <p>
                Ici on vous invite à prendre le temps de vous ressourcer, de prendre soin
                de vous tant mentalement, émotionnellement ou physiquement, et de poser la
                prochaine pierre vers la réalisation de vos rêves.
              </p>
              <p>
                Et si cela vous paraît ambitieux, c'est peut-être le moment de justement
                prendre ce temps pour vous. De vous écouter, avec patience et douceur.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {ROOMS.map((room) => (
              <div
                key={room.name}
                className="group overflow-hidden rounded-2xl border border-cream bg-white shadow-sm transition-shadow hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.img}
                    alt={room.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-green-700">
                    Disponible
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-ink">{room.name}</h3>
                  <ul className="mt-4 space-y-2 text-gray-600">
                    {room.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/reserver"
                    className="mt-6 inline-block rounded-full border-2 border-gold px-8 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold hover:text-black"
                  >
                    Réserver maintenant
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VOS PROJETS */}
      <section className="bg-cream-light py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>VOS PROJETS</Eyebrow>
            <h2 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
              Votre expérience sur mesure
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Vous souhaitez organiser un EVJF/EVG, une retraite, une résidence artistique,
              une cérémonie ou juste des vacances entre ami.e.s ? La Fairy House vous est
              ouverte et l'équipe est à votre disposition pour vous aider à organiser un
              séjour inoubliable.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {PROJECTS.map((p) => (
              <div key={p.title} className="group relative overflow-hidden rounded-2xl">
                <img
                  src={p.img}
                  alt={p.title}
                  className="h-[28rem] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                  <h3 className="text-2xl font-bold">{p.title}</h3>
                  <p className="mt-1 text-white/80">{p.subtitle}</p>
                  <ul className="mt-4 space-y-2 text-sm text-white/90">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/contact"
                    className="mt-6 inline-block rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-dark"
                  >
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RÉSIDENCES */}
      <section className="relative overflow-hidden py-28">
        <img
          src="/photo/Ostara_1.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white">
          <Eyebrow light>RÉSIDENCES</Eyebrow>
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Un espace imaginé comme une entité, un cocon vivant
          </h2>
          <div className="mt-8 space-y-4 text-lg leading-relaxed text-white/90">
            <p>
              À la Fairy House, le corps devient langage. La créativité est un chemin à
              explorer. Et vous êtes à la barre de votre vie, de vos décisions.
            </p>
            <p>La Fairy House est un refuge pour :</p>
          </div>
          <ul className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-left text-lg text-white/90">
            {['se reconnecter à son corps', 'libérer sa créativité', 'reprendre sa place', 'se révéler à son propre rythme'].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                {b}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/90">
            Ici, chacun·e avance à son propre rythme. À travers diverses activités
            proposées, en communauté ou sur réservation, nous vous invitons à mêler
            pratique artistique et approche thérapeutique pour ouvrir des espaces de
            transformation douce et profonde.
          </p>
          <Link
            to="/evenements"
            className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
          >
            Découvrir notre programmation
          </Link>
        </div>
      </section>

      {/* CONTACTEZ-NOUS */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Eyebrow>CONTACTEZ-NOUS</Eyebrow>
          <h2 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl">
            Contactez-nous
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            Retraite, résidence artistique, EVJF/EVG, cérémonie : on adapte la Fairy House
            à votre projet
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold text-black transition-colors hover:bg-gold-dark"
          >
            Nous contacter
          </Link>
        </div>
      </section>
    </main>
  )
}
