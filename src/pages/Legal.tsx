/**
 * Pages légales : Mentions légales, CGV, Politique de confidentialité.
 *
 * ⚠️ Ces textes sont des MODÈLES TYPES à faire valider juridiquement
 * avant mise en ligne définitive. Les zones entre crochets [ ] doivent
 * être complétées / vérifiées par Fairy House.
 */
import type { ReactNode } from 'react'

const EMAIL = 'fairyhouse.collectif@gmail.com'
const PHONE = '+33 6 71 39 88 07'
const ADRESSE = '2 Le Grand Leu, 45230 La Chapelle sur Aveyron'

type Bloc = { titre: string; contenu: ReactNode }

function LegalLayout({
  titre,
  intro,
  blocs,
}: {
  titre: string
  intro?: string
  blocs: Bloc[]
}) {
  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative flex items-center justify-center overflow-hidden bg-fairy-black py-32">
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold">{titre}</h1>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="mb-10 rounded-xl border border-fairy-gold/30 bg-fairy-gold/5 px-5 py-4 text-sm text-gray-600">
                Modèle de texte à faire valider juridiquement. Les éléments
                entre crochets restent à compléter par Fairy House.
              </div>
              {intro && (
                <p className="text-lg text-gray-700 leading-relaxed mb-10">
                  {intro}
                </p>
              )}
              <div className="space-y-10">
                {blocs.map((b) => (
                  <div key={b.titre}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {b.titre}
                    </h2>
                    <div className="space-y-3 text-gray-700 leading-relaxed">
                      {b.contenu}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export function MentionsLegales() {
  return (
    <LegalLayout
      titre="Mentions légales"
      blocs={[
        {
          titre: 'Éditeur du site',
          contenu: (
            <>
              <p>Le présent site est édité par Fairy House.</p>
              <p>
                Statut / forme juridique : [à compléter — association,
                micro-entreprise, SAS…]
                <br />
                SIREN / SIRET : [à compléter]
                <br />
                Adresse : {ADRESSE}
                <br />
                Téléphone : {PHONE}
                <br />
                Email :{' '}
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-fairy-gold hover:underline"
                >
                  {EMAIL}
                </a>
              </p>
              <p>Directeur / directrice de la publication : [à compléter]</p>
            </>
          ),
        },
        {
          titre: 'Hébergement',
          contenu: (
            <p>
              Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133,
              Walnut, CA 91789, États-Unis. [à confirmer selon l'hébergeur
              retenu]
            </p>
          ),
        },
        {
          titre: 'Propriété intellectuelle',
          contenu: (
            <p>
              L'ensemble des contenus présents sur ce site (textes, images,
              logo, éléments graphiques) est la propriété de Fairy House, sauf
              mention contraire. Toute reproduction ou utilisation sans
              autorisation préalable est interdite.
            </p>
          ),
        },
        {
          titre: 'Responsabilité',
          contenu: (
            <p>
              Fairy House s'efforce d'assurer l'exactitude des informations
              diffusées sur ce site mais ne saurait être tenue responsable des
              erreurs ou omissions, ni de l'usage qui en est fait.
            </p>
          ),
        },
      ]}
    />
  )
}

export function CGV() {
  return (
    <LegalLayout
      titre="Conditions générales de vente"
      intro="Les présentes conditions générales de vente (CGV) régissent les réservations de séjours et de prestations proposées par Fairy House."
      blocs={[
        {
          titre: 'Article 1 — Objet',
          contenu: (
            <p>
              Les présentes CGV définissent les droits et obligations des
              parties dans le cadre de la réservation d'un séjour ou d'une
              prestation à la Fairy House, située {ADRESSE}.
            </p>
          ),
        },
        {
          titre: 'Article 2 — Réservation',
          contenu: (
            <p>
              Toute réservation est effective à réception de [l'acompte / du
              paiement] et de la confirmation adressée par Fairy House. Les
              tarifs en vigueur sont ceux affichés sur le site au moment de la
              réservation.
            </p>
          ),
        },
        {
          titre: 'Article 3 — Tarifs et paiement',
          contenu: (
            <p>
              Les prix sont indiqués en euros, toutes taxes comprises. Le
              paiement s'effectue selon les modalités précisées lors de la
              réservation. [Préciser acompte, solde, moyens de paiement.]
            </p>
          ),
        },
        {
          titre: 'Article 4 — Annulation et remboursement',
          contenu: (
            <p>
              [Définir les conditions d'annulation : délais, montants retenus,
              remboursement de l'acompte, cas de force majeure.]
            </p>
          ),
        },
        {
          titre: 'Article 5 — Responsabilité et règlement intérieur',
          contenu: (
            <p>
              Les personnes accueillies s'engagent à respecter le lieu et son
              règlement intérieur. [Préciser assurances, dépôt de garantie,
              responsabilité en cas de dommages.]
            </p>
          ),
        },
        {
          titre: 'Article 6 — Contact',
          contenu: (
            <p>
              Pour toute question relative à une réservation :{' '}
              <a
                href={`mailto:${EMAIL}`}
                className="text-fairy-gold hover:underline"
              >
                {EMAIL}
              </a>{' '}
              — {PHONE}.
            </p>
          ),
        },
      ]}
    />
  )
}

export function Confidentialite() {
  return (
    <LegalLayout
      titre="Politique de confidentialité"
      intro="Fairy House accorde une grande importance à la protection de vos données personnelles. La présente politique explique quelles données sont collectées et comment elles sont utilisées."
      blocs={[
        {
          titre: 'Responsable du traitement',
          contenu: (
            <p>
              Le responsable du traitement des données est Fairy House,{' '}
              {ADRESSE} — {PHONE} —{' '}
              <a
                href={`mailto:${EMAIL}`}
                className="text-fairy-gold hover:underline"
              >
                {EMAIL}
              </a>
              .
            </p>
          ),
        },
        {
          titre: 'Données collectées',
          contenu: (
            <p>
              Via le formulaire de contact et les réservations, nous collectons
              les données que vous nous transmettez : nom, prénom, adresse
              email, numéro de téléphone et contenu de votre message. Ces
              données sont utilisées uniquement pour répondre à vos demandes et
              gérer votre séjour.
            </p>
          ),
        },
        {
          titre: 'Finalité et base légale',
          contenu: (
            <p>
              Vos données sont traitées pour le suivi des demandes de contact et
              des réservations, sur la base de votre consentement et de
              l'exécution des mesures précontractuelles ou contractuelles.
            </p>
          ),
        },
        {
          titre: 'Durée de conservation',
          contenu: (
            <p>
              Les données sont conservées pendant la durée nécessaire au
              traitement de votre demande, puis [durée à préciser].
            </p>
          ),
        },
        {
          titre: 'Vos droits',
          contenu: (
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de
              rectification, d'effacement, de limitation et d'opposition sur vos
              données. Pour l'exercer, écrivez-nous à{' '}
              <a
                href={`mailto:${EMAIL}`}
                className="text-fairy-gold hover:underline"
              >
                {EMAIL}
              </a>
              .
            </p>
          ),
        },
        {
          titre: 'Cookies',
          contenu: (
            <p>
              [Préciser si le site utilise des cookies de mesure d'audience ou
              tiers, et le cas échéant les modalités de consentement.]
            </p>
          ),
        },
      ]}
    />
  )
}
