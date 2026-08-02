export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  reference: string
  client_name: string
  client_email: string
  client_phone: string | null
  type: string
  arrival_date: string
  departure_date: string | null
  guests: number | null
  amount: number
  status: ReservationStatus
  message: string | null
  event_id: string | null
  mode: 'groupe' | 'individuel' | 'sur-mesure' | null
  rooms: { room: string; guests: number }[] | { wholeHouse: true } | null
  beds: number | null
  options: { linge: boolean; pension: boolean } | null
  activities_requested: boolean
  allergies: string | null
  payment_method: 'virement' | 'cb' | 'paypal' | null
  payment_plan: 'once' | 'split' | null
  total_ht: number | null
  vat_rate: number | null
  total_ttc: number | null
  deposit_amount: number | null
  balance_amount: number | null
  balance_due_date: string | null
  confirmation_sent_at: string | null
  // Inscription à un événement
  social_handle: string | null
  emergency_contact: string | null
  diet: string | null
  accommodation_choice: 'tente' | 'chambre' | 'aucun' | null
  shuttle: boolean | null
  consent_reglement: boolean | null
  consent_image: boolean | null
  quote_lines:
    | { designation: string; qty: number; unitPrice: number; vatRate: number }[]
    | null
  vat_breakdown: { rate: number; ht: number; vat: number; ttc: number }[] | null
  // Contact / adresse de facturation distincts (optionnels)
  billing_name: string | null
  billing_email: string | null
  billing_address: string | null
  // Paiement carte (Stripe)
  payment_status: 'unpaid' | 'paid'
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  created_at: string
}

export interface EventRow {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  event_date: string | null
  event_end_date: string | null
  category: string | null
  location: string | null
  image_url: string | null
  capacity: number | null
  published: boolean
  // Réservation interne (formulaire du site) ou externe (lien partenaire)
  reservation_type: 'interne' | 'externe'
  external_url: string | null
  partner_name: string | null
  // Config tarifaire de l'inscription (nullable ; défauts côté code)
  event_price_ttc: number | null
  accommodation_tente_ttc: number | null
  accommodation_chambre_ttc: number | null
  shuttle_enabled: boolean | null
  shuttle_price_ttc: number | null
  split_payment_enabled: boolean | null
  reglement_texte: string | null
  droits_image_texte: string | null
  created_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
}

export interface Intervenant {
  id: string
  name: string
  domain: string
  bio: string | null
  price: string | null
  website: string | null
  photo_url: string | null
  published: boolean
  created_at: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source: string | null
  created_at: string
}

export interface MessageRow {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  subject: string | null
  body: string
  read: boolean
  treated: boolean
  archived: boolean
  created_at: string
}

export interface IntervenantDomain {
  id: string
  name: string
  created_at: string
}

export interface OrgSettings {
  id: string
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  siret: string | null
  tva: string | null
  rib_iban: string | null
  rib_bic: string | null
  rib_titulaire: string | null
  total_beds: number | null
  updated_at: string
}

export interface EventCategory {
  id: string
  name: string
  created_at: string
}

export interface FactureRow {
  id: string
  reference: string
  reservation_id: string | null
  client_name: string | null
  client_email: string | null
  client_address: string | null
  lines: { designation: string; qty: number; unitPrice: number; vatRate?: number }[]
  total_ht: number
  vat_rate: number
  total_ttc: number
  issued_at: string | null
  created_at: string
  // event_id de la réservation liée (rempli par listFactures) : permet de
  // dispatcher les factures d'événements et celles de séjours.
  reservation_event_id?: string | null
}

export interface BedBlock {
  id: string
  start_date: string
  end_date: string
  beds: number
  label: string | null
  created_at: string
}

export interface SiteContentRow {
  key: string
  value: string | null
  updated_at: string
}
