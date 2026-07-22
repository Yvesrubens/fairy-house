import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEventBySlug, createReservation } from '../lib/api'
import { formatDate, formatEuro2 } from '../lib/format'
import { canSplit, splitPlan } from '../lib/booking'
import {
  computeEventQuote,
  ACCOMMODATION_LABELS,
  DEFAULT_REGLEMENT,
  DEFAULT_DROITS_IMAGE,
  DEFAULT_SHUTTLE_TTC,
  type AccommodationChoice,
  type EventPricingConfig,
} from '../lib/eventPricing'
import type { EventRow } from '../types/db'
import { CreditCard } from '../components/icons'

const fieldCls =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-fairy-gold focus:outline-none transition-colors'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`
}

const METHODS = [
  { key: 'virement', label: 'Virement' },
  { key: 'cb', label: 'CB' },
  { key: 'paypal', label: 'PayPal' },
] as const

export default function EventInscription() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Coordonnées
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [social, setSocial] = useState('')
  const [phone, setPhone] = useState('')
  const [emergency, setEmergency] = useState('')
  const [diet, setDiet] = useState('')
  const [allergies, setAllergies] = useState('')
  // Options
  const [accommodation, setAccommodation] = useState<AccommodationChoice>('aucun')
  const [shuttle, setShuttle] = useState(false)
  const [paymentPlan, setPaymentPlan] = useState<'once' | 'split'>('once')
  const [consentReglement, setConsentReglement] = useState(false)
  const [consentImage, setConsentImage] = useState(false)
  // Paiement
  const [paymentMethod, setPaymentMethod] = useState<
    'virement' | 'cb' | 'paypal' | null
  >(null)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [paypalConfirmed, setPaypalConfirmed] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getEventBySlug(slug)
      .then((e) => (e ? setEvent(e) : setNotFound(true)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const cfg: EventPricingConfig | null = useMemo(
    () =>
      event
        ? {
            eventPriceTtc: event.event_price_ttc ?? 0,
            tenteTtc: event.accommodation_tente_ttc ?? 0,
            chambreTtc: event.accommodation_chambre_ttc ?? 0,
            shuttleEnabled: event.shuttle_enabled ?? false,
            shuttlePriceTtc: event.shuttle_price_ttc ?? DEFAULT_SHUTTLE_TTC,
            splitEnabled: event.split_payment_enabled ?? false,
          }
        : null,
    [event],
  )

  const quote = useMemo(
    () => (cfg ? computeEventQuote(cfg, { accommodation, shuttle }) : null),
    [cfg, accommodation, shuttle],
  )

  const eventDate = event?.event_date ?? today()
  const splitAvailable =
    Boolean(cfg?.splitEnabled) && canSplit(eventDate, today())
  const plan =
    quote && paymentPlan === 'split' && splitAvailable
      ? splitPlan(quote.totalTtc, eventDate)
      : null

  const isFree = (quote?.totalTtc ?? 0) <= 0
  const cardComplete =
    cardName.trim() !== '' &&
    cardNumber.replace(/\s/g, '').length >= 13 &&
    cardExpiry.length === 5 &&
    cardCvc.length >= 3
  const paymentReady =
    isFree ||
    paymentMethod === 'virement' ||
    (paymentMethod === 'cb' && cardComplete) ||
    (paymentMethod === 'paypal' && paypalConfirmed)

  function goToPayment() {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Merci d’indiquer votre prénom et votre nom.')
      return
    }
    if (!email.trim() || !phone.trim()) {
      setError('Merci d’indiquer votre email et votre téléphone.')
      return
    }
    if (!consentReglement) {
      setError('Vous devez accepter le règlement intérieur pour continuer.')
      return
    }
    setError('')
    setStep(2)
  }

  async function submit() {
    if (!event || !quote) return
    setBusy(true)
    setError('')
    try {
      // Lignes stockées en HT (le devis PDF affiche des colonnes HT, puis la
      // TVA par taux via vat_breakdown, puis le Total TTC).
      const quoteLines = quote.lines.map((l) => ({
        designation: l.label,
        qty: 1,
        unitPrice: l.ht,
        vatRate: l.vatRate,
      }))
      const { id } = await createReservation({
        client_name: `${firstName} ${lastName}`.trim(),
        client_email: email,
        client_phone: phone || undefined,
        type: `Événement — ${event.title}`,
        arrival_date: eventDate,
        guests: 1,
        event_id: event.id,
        message: undefined,
        social_handle: social || undefined,
        emergency_contact: emergency || undefined,
        diet: diet || undefined,
        allergies: allergies || undefined,
        accommodation_choice: accommodation,
        shuttle,
        consent_reglement: consentReglement,
        consent_image: consentImage,
        payment_method: isFree ? undefined : paymentMethod ?? undefined,
        payment_plan: plan ? 'split' : 'once',
        total_ht: quote.totalHt,
        total_ttc: quote.totalTtc,
        quote_lines: quoteLines,
        vat_breakdown: quote.byRate,
        deposit_amount: plan?.deposit,
        balance_amount: plan?.balance,
        balance_due_date: plan?.balanceDueDate,
      })
      // Emails (non bloquant pour l'affichage du succès).
      fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id }),
      }).catch(() => {})
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Chargement…</p>
        </div>
      </main>
    )
  }
  if (notFound || !event || !quote) {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Événement introuvable</h1>
          <Link
            to="/evenements"
            className="px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all"
          >
            Retour à la programmation
          </Link>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className="flex-1">
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Votre inscription a bien été envoyée !
          </h1>
          <p className="max-w-md text-gray-600">
            Un email de confirmation vous a été adressé
            {paymentMethod === 'virement'
              ? ', ainsi qu’un devis avec nos coordonnées bancaires pour le règlement par virement.'
              : '.'}
          </p>
          <Link
            to="/evenements"
            className="mt-4 px-8 py-4 bg-fairy-gold text-black hover:bg-black hover:text-fairy-gold rounded-full font-bold transition-all"
          >
            Retour à la programmation
          </Link>
        </div>
      </main>
    )
  }

  const reglementTxt = event.reglement_texte || DEFAULT_REGLEMENT
  const droitsImageTxt = event.droits_image_texte || DEFAULT_DROITS_IMAGE

  return (
    <main className="flex-1 bg-fairy-cream/30">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link
          to={`/evenements/${slug}`}
          className="text-sm text-gray-500 hover:text-fairy-gold transition-colors"
        >
          ← Retour à l’événement
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Inscription</h1>
        <p className="mt-1 text-gray-600">
          {event.title}
          {event.event_date && ` — ${formatDate(event.event_date)}`}
        </p>

        <div className="mt-8 bg-white rounded-3xl shadow-lg p-6 md:p-8 space-y-6">
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {step === 1 && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Prénom *">
                  <input className={fieldCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Nom *">
                  <input className={fieldCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
                <Field label="Email *">
                  <input type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Téléphone *">
                  <input type="tel" className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="Compte Instagram ou Facebook">
                  <input className={fieldCls} value={social} onChange={(e) => setSocial(e.target.value)} placeholder="@votrecompte" />
                </Field>
                <Field label="Contact en cas d’urgence">
                  <input className={fieldCls} value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="Nom et téléphone" />
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Régime alimentaire">
                  <input className={fieldCls} value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="Végétarien, vegan…" />
                </Field>
                <Field label="Allergies">
                  <input className={fieldCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                </Field>
              </div>

              {/* Hébergement */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Hébergement</p>
                <div className="space-y-2">
                  {(['tente', 'chambre', 'aucun'] as AccommodationChoice[]).map((opt) => {
                    const price =
                      opt === 'tente' ? cfg!.tenteTtc : opt === 'chambre' ? cfg!.chambreTtc : 0
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer ${
                          accommodation === opt ? 'border-fairy-gold bg-fairy-gold/5' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accommodation"
                          checked={accommodation === opt}
                          onChange={() => setAccommodation(opt)}
                          className="w-4 h-4 accent-fairy-gold"
                        />
                        <span className="flex-1 text-gray-800">{ACCOMMODATION_LABELS[opt]}</span>
                        {opt !== 'aucun' && (
                          <span className="text-sm font-semibold text-gray-700">+{formatEuro2(price)}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Navette */}
              {cfg!.shuttleEnabled && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuttle}
                    onChange={(e) => setShuttle(e.target.checked)}
                    className="w-5 h-5 accent-fairy-gold"
                  />
                  <span className="text-gray-700">
                    Navette depuis la gare de Nogent-sur-Vernisson (A/R) — +{formatEuro2(cfg!.shuttlePriceTtc)}
                  </span>
                </label>
              )}

              {/* Paiement en 2 fois */}
              {splitAvailable && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentPlan === 'split'}
                    onChange={(e) => setPaymentPlan(e.target.checked ? 'split' : 'once')}
                    className="w-5 h-5 accent-fairy-gold"
                  />
                  <span className="text-gray-700">Payer en 2 fois (50 % maintenant, solde avant l’événement)</span>
                </label>
              )}

              {/* Consentements */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentReglement}
                    onChange={(e) => setConsentReglement(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-fairy-gold"
                  />
                  <span className="text-sm text-gray-700">{reglementTxt} *</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentImage}
                    onChange={(e) => setConsentImage(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-fairy-gold"
                  />
                  <span className="text-sm text-gray-700">{droitsImageTxt}</span>
                </label>
              </div>

              <PriceSummary quote={quote} plan={plan} />

              <button
                type="button"
                onClick={goToPayment}
                className="w-full px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg"
              >
                Continuer vers le paiement
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <PriceSummary quote={quote} plan={plan} />

              {!isFree && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Moyen de paiement
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {METHODS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPaymentMethod(m.key)}
                        className={`p-4 border-2 rounded-xl text-center font-semibold transition-all ${
                          paymentMethod === m.key
                            ? 'border-fairy-gold bg-fairy-gold/10'
                            : 'border-gray-200 hover:border-fairy-gold'
                        }`}
                      >
                        {m.label}
                        {m.key !== 'virement' && (
                          <span className="block text-xs font-normal text-gray-500">Simulation</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'cb' && !isFree && (
                <div className="space-y-4 p-4 border-2 border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-500">
                    Paiement simulé — aucune donnée bancaire n’est transmise ni stockée.
                  </p>
                  <input className={fieldCls} placeholder="Nom du titulaire" value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="off" />
                  <input className={fieldCls} inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} autoComplete="off" />
                  <div className="grid grid-cols-2 gap-4">
                    <input className={fieldCls} inputMode="numeric" placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} autoComplete="off" />
                    <input className={fieldCls} inputMode="numeric" placeholder="CVC" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} autoComplete="off" />
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && !isFree && (
                <div className="space-y-3 p-4 border-2 border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Paiement simulé — aucune connexion réelle à PayPal.</p>
                  {paypalConfirmed ? (
                    <p className="font-semibold text-green-600">✓ Connecté à PayPal (simulation)</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaypalConfirmed(true)}
                      className="px-6 py-3 rounded-full font-bold bg-[#ffc439] text-[#003087] hover:brightness-95 transition-all"
                    >
                      Continuer avec PayPal
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full font-semibold transition-all"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!paymentReady || busy}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-fairy-gold to-fairy-gold-light text-black hover:from-black hover:to-black hover:text-fairy-gold rounded-full font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy
                    ? 'Envoi…'
                    : paymentMethod === 'cb' || paymentMethod === 'paypal'
                      ? 'Payer (simulation)'
                      : 'Valider mon inscription'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  )
}

function PriceSummary({
  quote,
  plan,
}: {
  quote: ReturnType<typeof computeEventQuote>
  plan: { deposit: number; balance: number; balanceDueDate: string } | null
}) {
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.label} className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-700">
                {l.label}
                <span className="text-gray-400"> (TVA {l.vatRate} %)</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatEuro2(l.ttc)}
              </td>
            </tr>
          ))}
          {quote.byRate.map((g) => (
            <tr key={g.rate} className="border-b border-gray-50 text-xs text-gray-500">
              <td className="px-4 py-1">dont TVA {g.rate} %</td>
              <td className="px-4 py-1 text-right">{formatEuro2(g.vat)}</td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="px-4 py-3 font-bold text-gray-900">Total TTC</td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {formatEuro2(quote.totalTtc)}
            </td>
          </tr>
        </tbody>
      </table>
      {plan && (
        <div className="p-4 bg-fairy-gold/5 text-sm space-y-1 border-t border-gray-100">
          <p className="text-gray-700">
            Acompte aujourd’hui : <span className="font-bold">{formatEuro2(plan.deposit)}</span>
          </p>
          <p className="text-gray-700">
            Solde de <span className="font-bold">{formatEuro2(plan.balance)}</span> dû le{' '}
            {plan.balanceDueDate}
          </p>
        </div>
      )}
    </div>
  )
}
