import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createGiftCheckout } from '../lib/api'
import { formatEuro2 } from '../lib/format'
import { GIFT_MAX, GIFT_MIN } from '../../api/_lib/gift-core'

// Bons cadeaux : présentation + achat en ligne (Stripe). Le bon PDF numéroté
// est envoyé par e-mail à l'acheteur une fois le paiement confirmé.

const PRESETS = [50, 100, 150, 200, 300]

const field =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

export default function BonsCadeaux() {
  const [preset, setPreset] = useState<number | 'autre'>(100)
  const [custom, setCustom] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [cgv, setCgv] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)

  // Retour depuis Stripe Checkout (paiement réussi).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('paid') === '1') setPaid(true)
  }, [])

  const amount = preset === 'autre' ? Number(custom) : preset
  const amountValid =
    Number.isInteger(amount) && amount >= GIFT_MIN && amount <= GIFT_MAX

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!amountValid) {
      setError(`Choisissez un montant en euros entiers, entre ${GIFT_MIN} et ${GIFT_MAX} €.`)
      return
    }
    if (!cgv) {
      setError('Merci d’accepter les conditions générales de vente.')
      return
    }
    setBusy(true)
    try {
      const origin = window.location.origin
      const { url } = await createGiftCheckout({
        amount,
        buyerName,
        buyerEmail,
        recipientName: recipientName || undefined,
        message: message || undefined,
        successUrl: `${origin}/bons-cadeaux?paid=1`,
        cancelUrl: `${origin}/bons-cadeaux`,
      })
      window.location.href = url
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="min-h-screen">
        {/* HERO */}
        <section className="relative flex items-center justify-center overflow-hidden bg-fairy-black py-28">
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold">Bons cadeaux</h1>
            <p className="mt-4 text-lg md:text-xl font-light text-white/70">
              Offrez une parenthèse à vivre à la Fairy House
            </p>
          </div>
        </section>

        {paid && (
          <section className="bg-green-50 border-b border-green-200">
            <div className="container mx-auto px-4 py-6 text-center text-green-800">
              <p className="text-lg font-semibold">Merci pour votre achat ! ✨</p>
              <p className="mt-1">
                Votre bon cadeau vient de vous être envoyé par e-mail (pensez à vérifier
                vos courriers indésirables). Il ne reste plus qu’à l’offrir !
              </p>
            </div>
          </section>
        )}

        {/* PRÉSENTATION */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <img
                src="/photo/bon-cadeau-vignette.webp"
                alt="Bon cadeau Fairy House — Offrez une parenthèse à vivre à la Fairy House"
                width={900}
                height={1125}
                className="w-full h-auto rounded-3xl shadow-xl"
              />
              <div className="space-y-5 text-gray-700 leading-relaxed">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Et si vous offriez du temps pour rêver ?
                </h2>
                <p className="text-lg">
                  Un moment pour se ressourcer, un stage pour explorer, un lieu pour laisser
                  libre cours à sa créativité…
                </p>
                <p className="text-lg">
                  Avec les bons cadeaux Fairy House, offrez bien plus qu’un présent :
                  offrez des souvenirs.
                </p>
                <p className="text-lg">
                  Choisissez un montant ou une expérience, et laissez la magie opérer.
                </p>
                <p className="text-sm text-gray-500">
                  Montant au choix dès {GIFT_MIN} € (tarif d’une nuit) ou expérience à offrir.
                  Bons cadeaux valables 1 an, envoyés par e-mail.
                </p>
                <a
                  href="#offrir"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg"
                >
                  Découvrir les bons cadeaux
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ACHAT */}
        <section id="offrir" className="py-20 bg-gradient-to-b from-gray-50 to-white scroll-mt-20">
          <div className="container mx-auto px-4">
            <form
              onSubmit={submit}
              className="max-w-2xl mx-auto space-y-6 rounded-3xl bg-white p-6 md:p-10 shadow-xl border border-gray-100"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
                Offrir un bon cadeau
              </h2>

              {error && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div>
                <p className="block text-sm font-semibold text-gray-700 mb-2">Montant du bon</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      className={`px-5 py-2.5 rounded-full border-2 font-semibold transition-colors ${
                        preset === p
                          ? 'border-fairy-gold bg-fairy-gold/15 text-gray-900'
                          : 'border-gray-200 text-gray-700 hover:border-fairy-gold'
                      }`}
                    >
                      {p} €
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPreset('autre')}
                    className={`px-5 py-2.5 rounded-full border-2 font-semibold transition-colors ${
                      preset === 'autre'
                        ? 'border-fairy-gold bg-fairy-gold/15 text-gray-900'
                        : 'border-gray-200 text-gray-700 hover:border-fairy-gold'
                    }`}
                  >
                    Autre montant
                  </button>
                </div>
                {preset === 'autre' && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={GIFT_MIN}
                      max={GIFT_MAX}
                      step={1}
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder={`${GIFT_MIN} à ${GIFT_MAX}`}
                      className={`${field} max-w-[180px]`}
                    />
                    <span className="text-gray-500">€</span>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Votre nom *
                  <input required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} maxLength={80} className={`${field} mt-2 font-normal`} />
                </label>
                <label className="block text-sm font-semibold text-gray-700">
                  Votre e-mail *
                  <input required type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} maxLength={160} className={`${field} mt-2 font-normal`} />
                  <span className="mt-1 block text-xs font-normal text-gray-400">Le bon vous sera envoyé à cette adresse.</span>
                </label>
              </div>

              <label className="block text-sm font-semibold text-gray-700">
                Prénom et nom du ou de la bénéficiaire
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={80} className={`${field} mt-2 font-normal`} />
              </label>

              <label className="block text-sm font-semibold text-gray-700">
                Petit message (imprimé sur le bon)
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={300}
                  className={`${field} mt-2 font-normal resize-none`}
                />
                <span className="mt-1 block text-right text-xs font-normal text-gray-400">{message.length}/300</span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" checked={cgv} onChange={(e) => setCgv(e.target.checked)} className="mt-0.5 w-5 h-5 accent-fairy-gold" />
                <span>
                  J’accepte les{' '}
                  <Link to="/cgv" target="_blank" className="text-fairy-gold hover:underline">
                    conditions générales de vente
                  </Link>
                  . Bon valable 1 an, non remboursable, utilisable en une ou plusieurs fois.
                </span>
              </label>

              <button
                disabled={busy}
                className="w-full px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold text-lg transition-all shadow-lg disabled:opacity-60"
              >
                {busy
                  ? 'Redirection vers le paiement…'
                  : amountValid
                    ? `Payer ${formatEuro2(amount)} et recevoir le bon`
                    : 'Payer et recevoir le bon'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Paiement sécurisé par carte (Stripe). Le bon PDF numéroté vous est envoyé par
                e-mail dès le paiement confirmé.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
