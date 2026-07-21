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
  created_at: string
}

export interface EventRow {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  event_date: string | null
  location: string | null
  image_url: string | null
  capacity: number | null
  published: boolean
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
  created_at: string
}
