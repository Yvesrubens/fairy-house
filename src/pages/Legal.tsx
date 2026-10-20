/**
 * Pages légales : CGV, Mentions légales, Politique de confidentialité,
 * Politique relative aux cookies.
 *
 * ⚠️ Textes en VERSION PROVISOIRE (v1 fournie par Fairy House), en attente de
 * validation par une juriste. Les éléments entre crochets [ ] restent à
 * compléter (ex. coordonnées du médiateur de la consommation).
 * Les faits techniques (hébergeur, traceurs) ont été alignés sur la réalité
 * du site (React/Vite, Vercel, Supabase, Stripe, Google Maps).
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useConsent } from '../components/consent/ConsentContext'

const EMAIL = 'contact@fairyhousecollectif.com'
const MAJ = '16 octobre 2026'

const link = 'text-fairy-gold hover:underline'

function Mail() {
  return (
    <a href={`mailto:${EMAIL}`} className={link}>
      {EMAIL}
    </a>
  )
}

type Bloc = { titre: string; contenu: ReactNode }

function LegalLayout({
  titre,
  intro,
  blocs,
}: {
  titre: string
  intro?: ReactNode
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
              <div className="mb-6 rounded-xl border border-fairy-gold/30 bg-fairy-gold/5 px-5 py-4 text-sm text-gray-600">
                Version provisoire, en attente de validation juridique. Certains
                éléments entre crochets restent à compléter.
              </div>
              <p className="mb-10 text-sm text-gray-400">
                Dernière mise à jour : {MAJ}
              </p>
              {intro && (
                <div className="text-lg text-gray-700 leading-relaxed mb-10">
                  {intro}
                </div>
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

/* ------------------------------------------------------------------ CGV */
export function CGV() {
  return (
    <LegalLayout
      titre="Conditions générales de vente"
      blocs={[
        {
          titre: '1. Qui sommes-nous ?',
          contenu: (
            <>
              <p>
                Fairy House Collectif est une structure dédiée à l'accueil, à la
                création artistique et à l'organisation de séjours, d'ateliers et
                de rencontres.
              </p>
              <p>
                Les présentes conditions générales de vente (CGV) encadrent les
                réservations effectuées auprès de Fairy House Collectif, notamment
                via le site internet www.fairyhousecollectif.com.
              </p>
              <p>
                Contact : <Mail />
              </p>
            </>
          ),
        },
        {
          titre: '2. Les prestations proposées',
          contenu: (
            <>
              <p>La Fairy House propose différentes prestations :</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>des séjours et hébergements ;</li>
                <li>des stages, ateliers et événements ;</li>
                <li>des résidences artistiques ;</li>
                <li>
                  des locations et privatisations du lieu pour des projets
                  artistiques, collectifs ou professionnels.
                </li>
              </ul>
              <p>
                Les informations propres à chaque prestation — dates, durée,
                contenu, capacité d'accueil, tarifs et conditions particulières —
                sont présentées sur la page correspondante ou dans le devis
                transmis.
              </p>
            </>
          ),
        },
        {
          titre: '3. Réservation et paiement',
          contenu: (
            <>
              <p>
                Les réservations peuvent être effectuées via le site internet,
                selon les modalités indiquées pour chaque prestation.
              </p>
              <p>
                La réservation est confirmée lorsque le paiement demandé a été
                validé et que la confirmation de réservation a été envoyée.
              </p>
              <p>
                Les tarifs sont indiqués en euros. Le montant total, les
                éventuels frais supplémentaires et les modalités de paiement sont
                présentés avant la validation définitive de la commande.
              </p>
              <p>
                Pour les locations, résidences ou privatisations faisant l'objet
                d'un devis ou d'un contrat particulier, les conditions précisées
                dans ce document complètent les présentes CGV. En cas de
                contradiction, les dispositions particulières convenues entre les
                parties prévalent dans les limites autorisées par la loi.
              </p>
            </>
          ),
        },
        {
          titre: '4. Annulation, report et remboursement',
          contenu: (
            <>
              <p>
                La Fairy House privilégie, lorsque cela est possible, une approche
                souple et la recherche de solutions adaptées à chaque situation.
              </p>
              <p className="font-semibold text-gray-900">
                Annulation par la personne ayant réservé
              </p>
              <p>
                Toute demande d'annulation ou de report doit être adressée par
                écrit à <Mail />, en précisant la prestation concernée et la
                référence de réservation.
              </p>
              <p>
                Selon la prestation, la date de la demande et les possibilités
                d'organisation, Fairy House Collectif pourra proposer :
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>un report à une autre date, sous réserve de disponibilité ;</li>
                <li>un avoir, avec l'accord de la personne concernée ;</li>
                <li>
                  un remboursement total ou partiel, selon les conditions
                  applicables.
                </li>
              </ul>
              <p>
                Les conditions particulières présentées lors de la réservation
                précisent les modalités applicables à chaque prestation, notamment
                les délais d'annulation, les éventuels frais et les conditions de
                remboursement. Lorsqu'aucune condition particulière n'a été
                définie, la demande est étudiée au cas par cas, dans le respect
                des droits applicables à la prestation.
              </p>
              <p className="font-semibold text-gray-900">
                Modification ou annulation par Fairy House Collectif
              </p>
              <p>
                Si Fairy House Collectif doit modifier ou annuler une prestation,
                les personnes concernées sont informées dans les meilleurs délais.
                Une solution adaptée est proposée, pouvant notamment prendre la
                forme d'un report ou d'un remboursement des sommes versées pour la
                prestation annulée, selon la situation et les obligations légales
                applicables.
              </p>
              <p>
                Les droits légaux des personnes ayant réservé restent applicables,
                quelles que soient les possibilités de report proposées.
              </p>
            </>
          ),
        },
        {
          titre: "5. Conditions d'accueil et respect des personnes",
          contenu: (
            <>
              <p>
                La Fairy House est un lieu d'accueil, de création et de rencontre.
                Le respect des personnes, du consentement, des limites
                individuelles et des rythmes de chacun·e est essentiel.
              </p>
              <p>
                Les personnes accueillies s'engagent à respecter les lieux, les
                équipements, les consignes de sécurité et les autres
                participant·es.
              </p>
              <p>
                Pour certains stages ou événements, des règles complémentaires
                peuvent être communiquées avant ou pendant la prestation. Elles
                doivent être respectées par l'ensemble des personnes présentes.
              </p>
              <p>
                Tout comportement mettant en danger une personne, portant atteinte
                à son intégrité ou contrevenant gravement aux règles de sécurité
                peut entraîner des mesures adaptées, dans le respect de la
                réglementation et des droits de chacun·e.
              </p>
            </>
          ),
        },
        {
          titre: '6. Responsabilité et sécurité',
          contenu: (
            <>
              <p>
                Chaque personne s'engage à respecter les consignes de sécurité et
                à utiliser les équipements conformément à leur destination.
              </p>
              <p>
                Fairy House Collectif met en œuvre les mesures relevant de sa
                responsabilité pour assurer le bon déroulement des prestations. Sa
                responsabilité s'apprécie conformément aux dispositions légales
                applicables.
              </p>
              <p>
                Les participant·es restent responsables de leurs effets personnels
                et de leurs actes, dans les limites prévues par la loi. Les
                activités présentant des risques particuliers peuvent faire
                l'objet de consignes ou de conditions complémentaires communiquées
                avant la prestation.
              </p>
            </>
          ),
        },
        {
          titre: '7. Droit de rétractation',
          contenu: (
            <>
              <p>
                Le droit de rétractation dépend de la nature de la prestation
                réservée.
              </p>
              <p>
                Certaines prestations, notamment les services d'hébergement
                fournis à une date ou à une période déterminée et certaines
                activités de loisirs prévues à une date précise, sont exclues du
                droit légal de rétractation.
              </p>
              <p>
                Pour les autres prestations, le droit de rétractation et ses
                éventuelles exceptions sont appliqués conformément à la
                réglementation en vigueur. Les informations nécessaires sont
                communiquées avant la validation de la réservation.
              </p>
            </>
          ),
        },
        {
          titre: '8. Réclamations et règlement des litiges',
          contenu: (
            <>
              <p>
                Toute question ou réclamation peut être adressée à <Mail />. Fairy
                House Collectif privilégie le dialogue et la recherche d'une
                solution amiable.
              </p>
              <p>
                Lorsque la personne ayant réservé est un consommateur et que le
                différend n'a pas pu être résolu directement, elle peut, sous les
                conditions prévues par la loi, saisir le médiateur de la
                consommation dont relève Fairy House Collectif.
              </p>
              <p className="rounded bg-gray-50 px-3 py-2 text-gray-500">
                Les coordonnées du médiateur compétent seront indiquées ici après
                sa désignation : [nom, adresse et site internet du médiateur — à
                compléter].
              </p>
              <p>Les présentes CGV sont soumises au droit français.</p>
            </>
          ),
        },
        {
          titre: '9. Acceptation des conditions',
          contenu: (
            <>
              <p>
                La validation d'une réservation implique la prise de connaissance
                et l'acceptation des présentes CGV, ainsi que des éventuelles
                conditions particulières présentées avant le paiement.
              </p>
              <p>
                Les présentes conditions ne peuvent priver les consommateurs des
                droits qui leur sont reconnus par la législation applicable.
              </p>
              <p className="mt-6 text-sm text-gray-500">
                Fairy House Collectif — Contact : {EMAIL} — SIREN : 106 473 978 —
                Siège social : 2 Le Grand Leu, 45230 La Chapelle-sur-Aveyron.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}

/* ---------------------------------------------------------- Mentions légales */
export function MentionsLegales() {
  return (
    <LegalLayout
      titre="Mentions légales"
      blocs={[
        {
          titre: 'Éditeur du site',
          contenu: (
            <>
              <p>
                Le site www.fairyhousecollectif.com est édité par Fairy House
                Collectif.
              </p>
              <p>
                Forme juridique : société par actions simplifiée unipersonnelle
                (SASU)
                <br />
                Siège social : 2 Le Grand Leu, 45230 La Chapelle-sur-Aveyron,
                France
                <br />
                SIREN : 106 473 978
                <br />
                RCS : 106 473 978 Orléans
                <br />
                Capital social : 3000 €
                <br />
                Adresse e-mail : <Mail />
              </p>
              <p>Directrice de la publication : Aurélie Hazak</p>
            </>
          ),
        },
        {
          titre: 'Hébergement du site',
          contenu: (
            <>
              <p>
                Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133,
                Walnut, CA 91789, États-Unis — vercel.com.
              </p>
              <p className="text-sm text-gray-500">
                Le nom de domaine est géré via OVHcloud (OVH SAS, 2 rue
                Kellermann, 59100 Roubaix, France).
              </p>
            </>
          ),
        },
        {
          titre: 'Propriété intellectuelle',
          contenu: (
            <>
              <p>
                Les textes, photographies, illustrations, logos et autres contenus
                publiés sur ce site sont protégés par les règles relatives à la
                propriété intellectuelle.
              </p>
              <p>
                Sauf autorisation des titulaires des droits ou exception légale,
                leur reproduction, diffusion ou réutilisation n'est pas autorisée
                sans accord préalable. Les droits des artistes, photographes et
                autres contributeur·ices sont respectés selon les autorisations et
                crédits applicables.
              </p>
            </>
          ),
        },
        {
          titre: 'Données personnelles',
          contenu: (
            <>
              <p>
                Le site peut collecter des données personnelles lorsque vous
                effectuez une réservation, remplissez un formulaire ou contactez
                Fairy House Collectif.
              </p>
              <p>
                Les informations relatives aux finalités, aux bases légales, aux
                destinataires, aux durées de conservation et à l'exercice de vos
                droits sont détaillées dans notre{' '}
                <Link to="/confidentialite" className={link}>
                  politique de confidentialité
                </Link>
                .
              </p>
              <p>
                Pour toute question relative à vos données personnelles, vous
                pouvez écrire à <Mail />.
              </p>
            </>
          ),
        },
        {
          titre: 'Contact',
          contenu: (
            <p>
              Pour toute question concernant le site ou les prestations proposées
              par la Fairy House, vous pouvez nous contacter à l'adresse suivante :{' '}
              <Mail />.
            </p>
          ),
        },
      ]}
    />
  )
}

/* ------------------------------------------------- Politique de confidentialité */
export function Confidentialite() {
  return (
    <LegalLayout
      titre="Politique de confidentialité"
      blocs={[
        {
          titre: '1. Responsable du traitement',
          contenu: (
            <p>
              Le responsable du traitement des données personnelles collectées sur
              le site est Fairy House Collectif. Contact : <Mail />.
            </p>
          ),
        },
        {
          titre: '2. Quelles données peuvent être collectées ?',
          contenu: (
            <>
              <p>
                Selon votre utilisation du site et les prestations réservées, les
                données suivantes peuvent être collectées :
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>les informations d'identification et de contact ;</li>
                <li>
                  les informations nécessaires à la gestion des réservations et
                  des paiements ;
                </li>
                <li>les échanges avec Fairy House Collectif ;</li>
                <li>
                  les informations nécessaires à l'organisation et au suivi des
                  prestations ;
                </li>
                <li>
                  les données techniques relatives à la navigation, selon les
                  outils utilisés.
                </li>
              </ul>
              <p>
                Seules les données nécessaires aux finalités annoncées sont
                collectées.
              </p>
            </>
          ),
        },
        {
          titre: '3. Pourquoi ces données sont-elles utilisées ?',
          contenu: (
            <>
              <p>Les données peuvent être utilisées pour :</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>répondre aux demandes de renseignements ;</li>
                <li>
                  gérer les réservations, paiements, annulations et
                  remboursements ;
                </li>
                <li>
                  organiser les séjours, ateliers, stages et résidences ;
                </li>
                <li>assurer le suivi administratif et comptable ;</li>
                <li>respecter les obligations légales ;</li>
                <li>assurer la sécurité et le bon fonctionnement du site.</li>
              </ul>
              <p>
                Toute utilisation à des fins de communication commerciale respecte
                les règles applicables.
              </p>
            </>
          ),
        },
        {
          titre: '4. Qui peut accéder aux données ?',
          contenu: (
            <>
              <p>
                Les données sont accessibles aux personnes habilitées au sein de
                Fairy House Collectif et, lorsque cela est nécessaire, aux
                prestataires intervenant dans la gestion du site, des
                réservations, des paiements, de la comptabilité ou de
                l'hébergement informatique.
              </p>
              <p>Les données ne sont pas vendues à des tiers.</p>
            </>
          ),
        },
        {
          titre: '5. Combien de temps les données sont-elles conservées ?',
          contenu: (
            <p>
              Les données sont conservées pendant une durée adaptée à leur
              finalité et aux obligations légales applicables. Les durées précises
              sont définies selon les catégories de données, notamment pour les
              demandes de contact, les réservations, les factures et les données
              techniques.
            </p>
          ),
        },
        {
          titre: '6. Quels sont vos droits ?',
          contenu: (
            <>
              <p>
                Conformément à la réglementation applicable, vous pouvez, selon la
                situation, demander l'accès à vos données, leur rectification, leur
                effacement, la limitation de leur traitement ou vous opposer à
                certains traitements. Vous pouvez également demander la portabilité
                des données lorsque ce droit s'applique.
              </p>
              <p>
                Pour exercer vos droits, contactez <Mail />. Une vérification de
                votre identité pourra être demandée lorsqu'elle est nécessaire.
              </p>
              <p>
                Vous pouvez également introduire une réclamation auprès de la{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  CNIL
                </a>
                .
              </p>
            </>
          ),
        },
        {
          titre: '7. Sécurité',
          contenu: (
            <p>
              Fairy House Collectif met en œuvre des mesures adaptées pour protéger
              les données personnelles contre les accès non autorisés, la perte,
              l'altération ou la divulgation.
            </p>
          ),
        },
        {
          titre: '8. Cookies',
          contenu: (
            <p>
              Les informations relatives aux cookies et autres traceurs sont
              disponibles dans notre{' '}
              <Link to="/cookies" className={link}>
                politique relative aux cookies
              </Link>
              .
            </p>
          ),
        },
        {
          titre: '9. Mise à jour',
          contenu: (
            <p>
              Cette politique peut être mise à jour pour tenir compte des
              évolutions du site, des outils utilisés ou de la réglementation. Pour
              toute question, vous pouvez écrire à <Mail />.
            </p>
          ),
        },
      ]}
    />
  )
}

/* ----------------------------------------------- Politique relative aux cookies */
export function Cookies() {
  const { openPrefs } = useConsent()
  return (
    <LegalLayout
      titre="Politique relative aux cookies"
      blocs={[
        {
          titre: "1. Qu'est-ce qu'un cookie ?",
          contenu: (
            <>
              <p>
                Un cookie est un petit fichier ou traceur susceptible d'être
                enregistré sur votre appareil lorsque vous consultez un site
                internet.
              </p>
              <p>
                Il peut servir au fonctionnement du site, à la gestion des
                réservations, à la mesure de fréquentation ou à l'intégration de
                services externes.
              </p>
            </>
          ),
        },
        {
          titre: '2. Quels cookies sont utilisés sur le site ?',
          contenu: (
            <>
              <p>
                Le site de la Fairy House est développé en React et hébergé sur
                Vercel ; les réservations et les contenus sont gérés via Supabase,
                et les paiements via Stripe. Les traceurs effectivement utilisés
                sont les suivants :
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Cookies nécessaires</strong> : ils assurent le
                  fonctionnement technique du site, la gestion des réservations et
                  des paiements (Stripe) ainsi que la session de connexion de
                  l'espace d'administration (Supabase). Ils ne nécessitent pas de
                  consentement.
                </li>
                <li>
                  <strong>Mesure d'audience</strong> : aucun outil de mesure
                  d'audience n'est utilisé à ce jour.
                </li>
                <li>
                  <strong>Services externes</strong> : la carte Google Maps
                  (pages « Le Lieu » et « Contact ») peut déposer des cookies
                  Google ; elle ne se charge qu'après votre consentement. Le
                  paiement est traité par Stripe, sur son propre environnement
                  sécurisé.
                </li>
              </ul>
            </>
          ),
        },
        {
          titre: '3. Consentement et gestion des préférences',
          contenu: (
            <>
              <p>
                Les traceurs qui nécessitent votre consentement ne sont déposés
                qu'après votre accord. Vous pouvez accepter ou refuser les
                traceurs concernés, et retirer votre consentement à tout moment.
              </p>
              <p>
                <button
                  type="button"
                  onClick={openPrefs}
                  className="rounded-full bg-fairy-gold px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-black hover:text-fairy-gold"
                >
                  Gérer mes cookies
                </button>
              </p>
              <p>
                Certains cookies strictement nécessaires au fonctionnement du
                service demandé peuvent être utilisés sans consentement préalable,
                dans les limites prévues par la réglementation.
              </p>
            </>
          ),
        },
        {
          titre: '4. Comment nous contacter ?',
          contenu: (
            <>
              <p>
                Pour toute question relative aux cookies ou à leur utilisation sur
                le site, vous pouvez écrire à <Mail />.
              </p>
              <p>
                Pour en savoir plus sur les règles applicables, vous pouvez
                consulter le site de la{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  CNIL
                </a>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
