import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConsent } from './ConsentContext'

// Bandeau de consentement + fenêtre de préférences.
// - Le refus est aussi simple que l'acceptation (deux boutons de même niveau).
// - Aucun traceur soumis à consentement n'est chargé tant qu'aucun choix n'a
//   été exprimé (voir MapEmbed / ConsentContext).

export default function CookieBanner() {
  const {
    decided,
    consent,
    acceptAll,
    refuseAll,
    save,
    prefsOpen,
    openPrefs,
    closePrefs,
  } = useConsent()

  const [external, setExternal] = useState(consent.external)

  function openPreferences() {
    setExternal(consent.external)
    openPrefs()
  }

  // Fenêtre de préférences (prioritaire sur le bandeau).
  if (prefsOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900">
            Préférences de cookies
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vous pouvez accepter ou refuser les traceurs non essentiels. Votre
            choix peut être modifié à tout moment. Plus d'informations dans notre{' '}
            <Link
              to="/cookies"
              onClick={closePrefs}
              className="text-fairy-gold hover:underline"
            >
              politique relative aux cookies
            </Link>
            .
          </p>

          <div className="mt-5 space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
              <div>
                <p className="font-semibold text-gray-900">Cookies nécessaires</p>
                <p className="text-sm text-gray-600">
                  Indispensables au fonctionnement du site (réservation,
                  paiement, sécurité). Toujours actifs.
                </p>
              </div>
              <span className="mt-1 text-sm font-medium text-gray-400">
                Toujours actifs
              </span>
            </div>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer">
              <div>
                <p className="font-semibold text-gray-900">
                  Cartes et services externes
                </p>
                <p className="text-sm text-gray-600">
                  Affichage de la carte Google Maps (« Le Lieu » et « Contact »).
                  Google peut déposer des cookies.
                </p>
              </div>
              <input
                type="checkbox"
                checked={external}
                onChange={(e) => setExternal(e.target.checked)}
                className="mt-1 h-5 w-5 flex-shrink-0 accent-fairy-gold"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={refuseAll}
              className="flex-1 rounded-full border-2 border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={() => save({ external })}
              className="flex-1 rounded-full border-2 border-fairy-gold px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-fairy-gold/10"
            >
              Enregistrer mes choix
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="flex-1 rounded-full bg-fairy-gold px-5 py-3 text-sm font-bold text-black hover:bg-black hover:text-fairy-gold"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Bandeau initial : tant qu'aucun choix n'a été fait.
  if (decided) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-fairy-gold/40 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-gray-700">
          Ce site utilise uniquement des cookies nécessaires à son
          fonctionnement. La carte Google Maps, elle, ne se charge qu'avec votre
          accord. Vous pouvez accepter ou refuser les traceurs non essentiels.{' '}
          <Link to="/cookies" className="text-fairy-gold hover:underline">
            En savoir plus
          </Link>
          .
        </p>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={refuseAll}
            className="rounded-full border-2 border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Tout refuser
          </button>
          <button
            type="button"
            onClick={openPreferences}
            className="rounded-full border-2 border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Personnaliser
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-full bg-fairy-gold px-5 py-2.5 text-sm font-bold text-black hover:bg-black hover:text-fairy-gold"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  )
}
