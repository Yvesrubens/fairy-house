import { useConsent } from './ConsentContext'

// Carte Google Maps chargée uniquement après consentement « services externes ».
// Tant que l'accord n'est pas donné, aucun appel à Google n'est effectué : on
// affiche un espace réservé avec un bouton d'activation.

export default function MapEmbed({
  query,
  title,
}: {
  query: string
  title: string
}) {
  const { consent, save } = useConsent()

  if (!consent.external) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-100 px-6 text-center">
        <p className="max-w-sm text-sm text-gray-600">
          La carte est fournie par Google Maps, qui peut déposer des cookies.
          Elle ne s'affiche qu'avec votre accord.
        </p>
        <button
          type="button"
          onClick={() => save({ analytics: consent.analytics, external: true })}
          className="rounded-full bg-fairy-gold px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-black hover:text-fairy-gold"
        >
          Afficher la carte
        </button>
      </div>
    )
  }

  return (
    <iframe
      src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={title}
    />
  )
}
