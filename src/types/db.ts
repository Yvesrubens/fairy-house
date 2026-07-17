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
  confirmation_sent_at: string | null
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
  published: boolean
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
