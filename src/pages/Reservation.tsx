import { useState } from 'react'
import { Calendar } from '../components/icons'
import type { BookingState } from '../components/reservation/types'
import StepStayType from '../components/reservation/StepStayType'
import StepGroupSelection from '../components/reservation/StepGroupSelection'
import StepIndividualSelection from '../components/reservation/StepIndividualSelection'
import StepDetails from '../components/reservation/StepDetails'
import StepPayment from '../components/reservation/StepPayment'
import { createReservation } from '../lib/api'
import { HOUSE_CAPACITY, computeQuote, nights, splitPlan } from '../lib/booking'

const INITIAL_STATE: BookingState = {
  mode: null,
  rooms: [],
  wholeHouse: false,
  beds: 1,
  arrival: '',
  departure: '',
  options: { linge: false, pension: false },
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  activitiesRequested: false,
  allergies: '',
  message: '',
  paymentPlan: 'once',
  paymentMethod: null,
}

const STEP_LABELS = ['Séjour', 'Sélection', 'Coordonnées', 'Paiement']

export default function Reservation() {
  const [step, setStep] = useState(0)
  const [state, setStateRaw] = useState<BookingState>(INITIAL_STATE)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setState = (patch: Partial<BookingState>) =>
    setStateRaw((s) => ({ ...s, ...patch }))

  const onNext = () => setStep((s) => s + 1)
  const onBack = () => setStep((s) => s - 1)

  async function onSubmit() {
    const pers = state.wholeHouse
      ? HOUSE_CAPACITY
      : state.mode === 'groupe'
        ? state.rooms.reduce((s, r) => s + r.guests, 0)
        : state.beds
    const n = nights(state.arrival, state.departure)
    const quote = computeQuote(pers, n, state.options)
    const split =
      state.paymentPlan === 'split'
        ? splitPlan(quote.totalTtc, state.arrival)
        : null
    const typeLabel =
      state.mode === 'groupe'
        ? state.wholeHouse
          ? 'Séjour groupe — Maison complète'
          : `Séjour groupe — ${state.rooms.map((r) => r.room).join(', ')}`
        : `Séjour individuel — ${state.beds} lit(s)`
    try {
      setBusy(true)
      const { id } = await createReservation({
        client_name: `${state.firstName} ${state.lastName}`.trim(),
        client_email: state.email,
        client_phone: state.phone || undefined,
        type: typeLabel,
        arrival_date: state.arrival,
        departure_date: state.departure || undefined,
        guests: pers,
        message: state.message || undefined,
        mode: state.mode ?? undefined,
        rooms: state.wholeHouse ? { wholeHouse: true } : state.rooms,
        beds: state.mode === 'individuel' ? state.beds : undefined,
        options: state.options,
        activities_requested: state.activitiesRequested,
        allergies: state.allergies || undefined,
        payment_method: state.paymentMethod ?? undefined,
        payment_plan: state.paymentPlan,
        total_ht: quote.totalHt,
        vat_rate: 10,
        total_ttc: quote.totalTtc,
        deposit_amount: split?.deposit,
        balance_amount: split?.balance,
        balance_due_date: split?.balanceDueDate,
      })
      // Déclenche les mails (non bloquant pour l'affichage du succès)
      fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id }),
      }).catch(() => {})
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-28 pb-24">
        <div className="container mx-auto px-4">
          {/* En-tête */}
          <div className="max-w-2xl mx-auto text-center mb-10">
            <div className="w-16 h-16 bg-fairy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-fairy-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Réserver votre séjour
            </h1>
            <p className="text-gray-600">
              Choisissez vos dates, votre hébergement et le nombre de personnes.
              Nous revenons vers vous sous 48h pour confirmer la disponibilité.
            </p>
          </div>

          {/* Tunnel de réservation */}
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-fairy-gold to-fairy-gold-light px-8 py-6">
              <h2 className="text-2xl font-bold text-black">
                Votre demande de réservation
              </h2>
              {!done && (
                <div className="mt-4 flex items-center gap-2">
                  {STEP_LABELS.map((label, i) => (
                    <div key={label} className="flex-1 flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          i <= step
                            ? 'bg-black text-fairy-gold'
                            : 'bg-black/20 text-black/50'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-xs font-semibold hidden sm:inline ${
                          i <= step ? 'text-black' : 'text-black/50'
                        }`}
                      >
                        {label}
                      </span>
                      {i < STEP_LABELS.length - 1 && (
                        <div className="flex-1 h-0.5 bg-black/20" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8">
              {done ? (
                <div className="text-center py-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Votre demande a bien été envoyée !
                  </h3>
                  <p className="mt-4 text-gray-600">
                    Un email de confirmation vous a été adressé. Pour un
                    règlement par virement, vous recevrez un devis avec nos
                    coordonnées bancaires.
                  </p>
                </div>
              ) : (
                <>
                  {error && (
                    <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  {step === 0 && (
                    <StepStayType
                      state={state}
                      setState={setState}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 1 &&
                    (state.mode === 'groupe' ? (
                      <StepGroupSelection
                        state={state}
                        setState={setState}
                        onNext={onNext}
                        onBack={onBack}
                      />
                    ) : (
                      <StepIndividualSelection
                        state={state}
                        setState={setState}
                        onNext={onNext}
                        onBack={onBack}
                      />
                    ))}
                  {step === 2 && (
                    <StepDetails
                      state={state}
                      setState={setState}
                      onNext={onNext}
                      onBack={onBack}
                    />
                  )}
                  {step === 3 && (
                    <StepPayment
                      state={state}
                      setState={setState}
                      onNext={onNext}
                      onBack={onBack}
                      onSubmit={onSubmit}
                      busy={busy}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
