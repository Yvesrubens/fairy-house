export type FieldType = 'text' | 'multiline' | 'list' | 'image'
export interface Field {
  key: string
  label: string
  type: FieldType
  default: string
}
export interface Section {
  label: string
  fields: Field[]
}
export interface PageDef {
  key: string
  label: string
  sections: Section[]
}

export const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Accueil',
    sections: [
      {
        label: 'Hero',
        fields: [
          { key: 'home.hero.image', label: 'Image de fond (hero)', type: 'image', default: '/photo/Vue_coucher_de_soleil.jpg' },
          { key: 'home.hero.title', label: 'Titre hero', type: 'text', default: 'FAIRY HOUSE' },
          { key: 'home.hero.subtitle1', label: 'Sous-titre 1', type: 'text', default: 'Bienvenue au Sanctuaire de vos Inspirations !' },
          { key: 'home.hero.subtitle2', label: 'Sous-titre 2', type: 'text', default: 'Un lieu pour se révéler, créer, oser et ressentir' },
          { key: 'home.hero.cta1', label: 'Bouton 1', type: 'text', default: 'Entrez dans la Fairy House' },
          { key: 'home.hero.cta2', label: 'Bouton 2', type: 'text', default: 'Découvrir nos expériences' },
        ],
      },
      {
        label: 'Notre Vision',
        fields: [
          { key: 'home.vision.badge', label: 'Badge', type: 'text', default: 'Notre Vision' },
          { key: 'home.vision.title', label: 'Titre', type: 'multiline', default: 'Un sanctuaire vivant, refuge pour les âmes créatives, sensibles et indomptées.' },
          { key: 'home.vision.image', label: 'Image de fond', type: 'image', default: '/photo/PXL_20260101_081856561.jpg' },
          {
            key: 'home.vision.lines',
            label: 'Lignes (italique)',
            type: 'list',
            default: [
              "La Fairy House n'est pas un lieu de consommation.",
              "C'est un espace de passage.",
              "Un endroit où l'on dépose les rôles, les attentes, les armures sociales.",
              'Ici, on explore le corps, la présence, la créativité et le feu intérieur.',
            ].join('\n'),
          },
          {
            key: 'home.vision.emphasis',
            label: 'Lignes (accent)',
            type: 'list',
            default: ["L'art et l'intime ne sont plus séparés.", 'Ils se répondent.'].join('\n'),
          },
          { key: 'home.vision.cta', label: 'Bouton', type: 'text', default: 'Découvrir la Fairy House' },
        ],
      },
      {
        label: 'Programmation',
        fields: [
          { key: 'home.prog.badge', label: 'Badge', type: 'text', default: 'Programmation' },
          { key: 'home.prog.title', label: 'Titre', type: 'text', default: 'Au programme à la Fairy House' },
          { key: 'home.prog.cta', label: 'Bouton', type: 'text', default: 'Voir tous les événements' },
        ],
      },
      {
        label: 'Hébergements',
        fields: [
          { key: 'home.heb.badge', label: 'Badge', type: 'text', default: 'Hébergements' },
          { key: 'home.heb.title', label: 'Titre', type: 'text', default: 'Votre séjour à la Fairy House' },
          {
            key: 'home.heb.intro',
            label: "Paragraphes d'intro",
            type: 'list',
            default: [
              "Fairy House, un lieu de révélation, d'incarnation et de liberté.",
              'Ici on vous invite à prendre le temps de vous ressourcer, de prendre soin de vous tant mentalement, émotionnellement ou physiquement, et de poser la prochaine pierre vers la réalisation de vos rêves.',
              "Et si cela vous paraît ambitieux, c'est peut-être le moment de justement prendre ce temps pour vous. De vous écouter, avec patience et douceur.",
            ].join('\n'),
          },
          { key: 'home.room1.name', label: 'Chambre 1 — nom', type: 'text', default: 'Chambre Litha' },
          { key: 'home.room1.image', label: 'Chambre 1 — image', type: 'image', default: '/photo/Chambre_Litha.jpg' },
          { key: 'home.room1.subtitle', label: 'Chambre 1 — sous-titre', type: 'text', default: 'Espace intime, familial pour 2 à 3 personnes' },
          { key: 'home.room1.features', label: 'Chambre 1 — atouts', type: 'list', default: ['Lit double', 'Vue sur jardin'].join('\n') },
          { key: 'home.room2.name', label: 'Chambre 2 — nom', type: 'text', default: 'Chambre Mabon' },
          { key: 'home.room2.image', label: 'Chambre 2 — image', type: 'image', default: '/photo/Chambre_Mabbon.jpg' },
          { key: 'home.room2.subtitle', label: 'Chambre 2 — sous-titre', type: 'text', default: 'Dortoir partagé pour 5 personnes' },
          { key: 'home.room2.features', label: 'Chambre 2 — atouts', type: 'list', default: ['Vue sur jardin'].join('\n') },
          { key: 'home.room3.name', label: 'Chambre 3 — nom', type: 'text', default: 'Chambre Imbolc' },
          { key: 'home.room3.image', label: 'Chambre 3 — image', type: 'image', default: '/photo/Chambre_Imbolc.jpg' },
          { key: 'home.room3.subtitle', label: 'Chambre 3 — sous-titre', type: 'text', default: 'Dortoir 4 personnes' },
          { key: 'home.room3.features', label: 'Chambre 3 — atouts', type: 'list', default: ['Vue sur jardin'].join('\n') },
        ],
      },
      {
        label: 'Vos Projets',
        fields: [
          { key: 'home.proj.badge', label: 'Badge', type: 'text', default: 'Vos Projets' },
          { key: 'home.proj.title', label: 'Titre', type: 'text', default: 'Votre expérience sur mesure' },
          { key: 'home.proj.image', label: 'Image de fond', type: 'image', default: '/photo/PXL_20260320_085850183.jpg' },
          {
            key: 'home.proj.intro',
            label: "Paragraphes d'intro",
            type: 'list',
            default: [
              'Vous souhaitez organiser un EVJF/EVG, une retraite, une résidence artistique, une cérémonie ou juste des vacances entre ami.e.s ?',
              "La Fairy House vous est ouverte et l'équipe est à votre disposition pour vous aider à organiser un séjour inoubliable.",
            ].join('\n'),
          },
          { key: 'home.proj1.title', label: 'Projet 1 — titre', type: 'text', default: 'Privatisation simple' },
          { key: 'home.proj1.image', label: 'Projet 1 — image', type: 'image', default: '/photo/Vue_d_ensemble.jpg' },
          { key: 'home.proj1.subtitle', label: 'Projet 1 — sous-titre', type: 'text', default: 'Pour vos vacances, séminaires, retraites...' },
          {
            key: 'home.proj1.points',
            label: 'Projet 1 — points',
            type: 'list',
            default: [
              'Jusqu’à 12 personnes',
              'Maison privatisée',
              'Jardin arboré et bassin à carpes pour se détendre',
            ].join('\n'),
          },
          { key: 'home.proj1.cta', label: 'Projet 1 — bouton', type: 'text', default: 'Réserver' },
          { key: 'home.proj2.title', label: 'Projet 2 — titre', type: 'text', default: 'Organisation d’un séjour sur mesure' },
          { key: 'home.proj2.image', label: 'Projet 2 — image', type: 'image', default: '/photo/Chill_Room.jpg' },
          { key: 'home.proj2.subtitle', label: 'Projet 2 — sous-titre', type: 'text', default: 'Pour vos retraites, EVJF/EVG, cérémonies...' },
          {
            key: 'home.proj2.points',
            label: 'Projet 2 — points',
            type: 'list',
            default: [
              'Jusqu’à 12 personnes',
              'Possibilité de faire venir des accompagnant·es',
              'Accompagnement dans l’organisation et proposition de programmes thématiques',
            ].join('\n'),
          },
          { key: 'home.proj2.cta', label: 'Projet 2 — bouton', type: 'text', default: 'Découvrir nos accompagnant·es' },
        ],
      },
      {
        label: 'Résidences',
        fields: [
          { key: 'home.res.image', label: 'Résidences — image', type: 'image', default: '/photo/Ostara_1.jpg' },
          { key: 'home.res.badge', label: 'Badge', type: 'text', default: 'Résidences' },
          {
            key: 'home.res.title',
            label: 'Titre',
            type: 'list',
            default: ['Un espace imaginé comme une entité,', 'un cocon vivant'].join('\n'),
          },
          {
            key: 'home.res.intro1',
            label: 'Bloc « corps/créativité »',
            type: 'multiline',
            default: 'À la Fairy House, le corps devient langage.\nLa créativité est un chemin à explorer.',
          },
          {
            key: 'home.res.intro2',
            label: 'Bloc « barre de votre vie »',
            type: 'multiline',
            default: 'Et vous êtes à la barre de votre vie, de vos décisions.',
          },
          { key: 'home.res.refuge_title', label: 'Titre encart refuge', type: 'text', default: 'La Fairy House est un refuge pour :' },
          {
            key: 'home.res.refuge_items',
            label: 'Items refuge',
            type: 'list',
            default: [
              'se reconnecter à son corps',
              'libérer sa créativité',
              'reprendre sa place',
              'se révéler à son propre rythme',
            ].join('\n'),
          },
          {
            key: 'home.res.outro',
            label: 'Paragraphe final',
            type: 'multiline',
            default:
              'Ici, chacun·e avance à son propre rythme. À travers diverses activités proposées, en communauté ou sur réservation, nous vous invitons à mêler pratique artistique et approche thérapeutique pour ouvrir des espaces de transformation douce et profonde.',
          },
          { key: 'home.res.cta', label: 'Bouton', type: 'text', default: 'Découvrir notre programmation' },
        ],
      },
      {
        label: 'Contact',
        fields: [
          { key: 'home.contact.title', label: 'Titre', type: 'text', default: 'Contactez-nous' },
          {
            key: 'home.contact.text',
            label: 'Texte',
            type: 'multiline',
            default: 'Retraite, résidence artistique, EVJF/EVG, cérémonie :\non adapte la Fairy House à votre projet',
          },
          { key: 'home.contact.cta', label: 'Bouton', type: 'text', default: 'Nous contacter' },
        ],
      },
    ],
  },
  {
    key: 'lelieu',
    label: 'Le Lieu',
    sections: [
      {
        label: 'Hero',
        fields: [
          { key: 'lelieu.hero.image', label: 'Image hero', type: 'image', default: '/photo/Vue_coucher_de_soleil.jpg' },
          { key: 'lelieu.hero.title', label: 'Titre hero', type: 'text', default: 'Fairy House' },
          { key: 'lelieu.hero.subtitle', label: 'Sous-titre hero', type: 'text', default: 'Un lieu pour se déposer, créer et se transformer' },
        ],
      },
      {
        label: 'Intro',
        fields: [
          {
            key: 'lelieu.intro.text',
            label: 'Intro',
            type: 'multiline',
            default: "Ici, on prend le temps de se ressourcer, de prendre soin de soi, et d'avancer pas à pas vers la réalisation de ses rêves.",
          },
        ],
      },
      {
        label: 'Habiter la maison',
        fields: [
          { key: 'lelieu.habiter.badge', label: 'Badge', type: 'text', default: 'Habiter la maison' },
          { key: 'lelieu.habiter.title', label: 'Titre', type: 'text', default: 'Habiter la maison' },
          {
            key: 'lelieu.habiter.text',
            label: 'Paragraphe',
            type: 'multiline',
            default:
              "La Fairy House a été pensée comme un lieu vivant, accueillant et modulable, où chacun peut trouver sa manière d'être, de créer et de se déposer. Ici, les espaces ne sont pas figés : ils accompagnent les temps de repos, de création, de partage et d'introspection.",
          },
          { key: 'lelieu.space1.name', label: 'Espace 1 — nom', type: 'text', default: 'Se Reposer' },
          { key: 'lelieu.space1.image', label: 'Espace 1 — image', type: 'image', default: '/photo/Chambre_Mabbon.jpg' },
          {
            key: 'lelieu.space1.text',
            label: 'Espace 1 — texte',
            type: 'multiline',
            default:
              'Des chambres lumineuses et apaisantes, pensées comme des refuges. Des espaces simples et confortables, où le silence, le repos et la lenteur retrouvent leur place.',
          },
          { key: 'lelieu.space2.name', label: 'Espace 2 — nom', type: 'text', default: 'Créer' },
          { key: 'lelieu.space2.image', label: 'Espace 2 — image', type: 'image', default: '/photo/Exterieur_pique_nique.png' },
          {
            key: 'lelieu.space2.text',
            label: 'Espace 2 — texte',
            type: 'multiline',
            default:
              "Des espaces ouverts à la créativité et à l'expression. Tables partagées, lumière naturelle, matériaux simples… tout invite à écrire, danser, dessiner, fabriquer, expérimenter. Un lieu où les idées prennent forme sans pression de résultat.",
          },
          { key: 'lelieu.space3.name', label: 'Espace 3 — nom', type: 'text', default: 'Se retrouver' },
          { key: 'lelieu.space3.image', label: 'Espace 3 — image', type: 'image', default: '/photo/PXL_20260314_221152313.jpg' },
          {
            key: 'lelieu.space3.text',
            label: 'Espace 3 — texte',
            type: 'multiline',
            default:
              "Des pièces de vie chaleureuses, pensées pour les échanges, les discussions et les moments partagés. Des espaces où l'on cuisine, où l'on rit, où l'on se raconte. Un refuge pour tisser du lien en douceur.",
          },
          { key: 'lelieu.space4.name', label: 'Espace 4 — nom', type: 'text', default: 'Respirer' },
          { key: 'lelieu.space4.image', label: 'Espace 4 — image', type: 'image', default: '/photo/Bassin.jpg' },
          {
            key: 'lelieu.space4.text',
            label: 'Espace 4 — texte',
            type: 'multiline',
            default:
              "À l'extérieur, la nature comme prolongement de la maison. Jardin, arbres, air libre, silence vivant… Un espace pour marcher, s'isoler, contempler, ou simplement être.",
          },
        ],
      },
      {
        label: 'Confort',
        fields: [
          { key: 'lelieu.confort.title', label: 'Titre confort', type: 'text', default: "Le confort du lieu : l'essentiel à savoir" },
          { key: 'lelieu.confort.sejour_title', label: 'Bloc Séjour — titre', type: 'text', default: 'Séjour' },
          {
            key: 'lelieu.confort.sejour_items',
            label: 'Bloc Séjour — items',
            type: 'list',
            default: [
              'Chambres partagées (de 3 à 5 personnes)',
              '45€ / nuit / personne',
              'Privatisation à partir de 1200€',
              'Salles de bain communes',
              'Linge de maison en option : 5€ / personne',
            ].join('\n'),
          },
          { key: 'lelieu.confort.repas_title', label: 'Bloc Repas — titre', type: 'text', default: 'Repas' },
          {
            key: 'lelieu.confort.repas_items',
            label: 'Bloc Repas — items',
            type: 'list',
            default: [
              'Petit déjeuner inclus',
              'Repas partagés : 8€/repas ou 15€/jour',
              'Repas en autonomie possible',
              'Courses livrées : forfait 10€ (sur réservation)',
              'Cuisine équipée à disposition',
            ].join('\n'),
          },
          { key: 'lelieu.confort.vie_title', label: 'Bloc Vie — titre', type: 'text', default: 'Vie sur place' },
          {
            key: 'lelieu.confort.vie_items',
            label: 'Bloc Vie — items',
            type: 'list',
            default: [
              'Wifi disponible (fibre)',
              'Salle multi-activité avec miroirs',
              'Espace de travail calme',
              'Salle de détente : flipper, jukebox, ludothèque, rétroprojecteur...',
              'Bibliothèques thématiques',
              'Grand jardin avec un bassin aux carpes',
            ].join('\n'),
          },
          { key: 'lelieu.confort.plus_title', label: 'Bloc Les Plus — titre', type: 'text', default: 'Les Plus' },
          {
            key: 'lelieu.confort.plus_items',
            label: 'Bloc Les Plus — paragraphes',
            type: 'list',
            default: [
              'La Fairy House est un espace autonome dédié aux retraites et aux séjours.',
              "Une présence bienveillante vit à proximité, dans une autre maison sur le terrain, disponible si besoin tout en respectant l'intimité du lieu.",
            ].join('\n'),
          },
        ],
      },
      {
        label: 'Appel à l\'action',
        fields: [
          { key: 'lelieu.cta.title', label: 'CTA — titre', type: 'text', default: 'Prêt·e à découvrir Fairy House ?' },
          { key: 'lelieu.cta.text', label: 'CTA — texte', type: 'text', default: 'Réservez dès maintenant votre séjour dans notre havre de paix' },
          { key: 'lelieu.cta.button', label: 'CTA — bouton', type: 'text', default: 'Réserver maintenant' },
        ],
      },
      {
        label: 'Comment venir',
        fields: [
          { key: 'lelieu.venir.title', label: 'Comment venir — titre', type: 'text', default: 'Comment venir ?' },
          {
            key: 'lelieu.venir.adresse',
            label: 'Adresse',
            type: 'list',
            default: ['2 Le Grand Leu', '45230 La Chapelle sur Aveyron', 'France'].join('\n'),
          },
          {
            key: 'lelieu.venir.navette',
            label: 'Navette',
            type: 'list',
            default: ['Depuis Montargis : 25 min', 'Depuis Nogent : 15 min', '2 trajets/jour sur réservation'].join('\n'),
          },
          { key: 'lelieu.venir.phone', label: 'Téléphone', type: 'text', default: '+33 6 71 39 88 07' },
          { key: 'lelieu.venir.email', label: 'E-mail', type: 'text', default: 'contact@fairyhousecollectif.com' },
        ],
      },
    ],
  },
]

export const DEFAULTS: Record<string, string> = Object.fromEntries(
  PAGES.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => [f.key, f.default]))),
)

export function getDefault(key: string): string {
  return DEFAULTS[key] ?? ''
}
