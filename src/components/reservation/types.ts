// Types partagés du tunnel de réservation (wizard). Consommés par les
// composants d'étape (Task 6) et par l'orchestrateur src/pages/Reservation.tsx (Task 7).

export interface BookingState {
  mode: 'groupe' | 'individuel' | 'sur-mesure' | null
  rooms: { room: string; guests: number }[] // groupe (vide si maison complète)
  wholeHouse: boolean // groupe
  simpleBeds: number // individuel (0..10)
  doubleBeds: number // individuel (0..1)
  individualGuests: number // individuel (nombre de personnes)
  customGuests: number // sur-mesure (nombre de personnes souhaité)
  arrival: string
  departure: string
  options: { linge: boolean; pension: boolean }
  firstName: string
  lastName: string
  email: string
  phone: string
  activitiesRequested: boolean // groupe
  allergies: string // individuel
  message: string
  paymentPlan: 'once' | 'split'
  paymentMethod: 'virement' | 'cb' | 'paypal' | null
}

export interface StepProps {
  state: BookingState
  setState: (patch: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
}
