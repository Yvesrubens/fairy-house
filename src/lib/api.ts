import { supabase } from './supabase'
import type {
  Article,
  EventRow,
  Intervenant,
  NewsletterSubscriber,
  Reservation,
  ReservationStatus,
} from '../types/db'

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return data as T
}

// ---------------------------------------------------------- Public reads
export async function listPublishedEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('event_date', { ascending: true })
  return unwrap(data, error)
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  return unwrap(data, error)
}

export async function listPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
  return unwrap(data, error)
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  return unwrap(data, error)
}

export async function listPublishedIntervenants(): Promise<Intervenant[]> {
  const { data, error } = await supabase
    .from('intervenants')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: true })
  return unwrap(data, error)
}

// --------------------------------------------------------- Public writes
export interface ReservationInput {
  client_name: string
  client_email: string
  client_phone?: string
  type: string
  arrival_date: string
  departure_date?: string
  guests?: number
  message?: string
  event_id?: string
  // Tunnel de réservation
  mode?: 'groupe' | 'individuel' | 'sur-mesure'
  rooms?: { room: string; guests: number }[] | { wholeHouse: true }
  beds?: number
  options?: { linge: boolean; pension: boolean }
  activities_requested?: boolean
  allergies?: string
  payment_method?: 'virement' | 'cb' | 'paypal'
  payment_plan?: 'once' | 'split'
  total_ht?: number
  vat_rate?: number
  total_ttc?: number
  deposit_amount?: number
  balance_amount?: number
  balance_due_date?: string
  // Inscription à un événement
  social_handle?: string
  emergency_contact?: string
  diet?: string
  accommodation_choice?: 'tente' | 'chambre' | 'aucun'
  shuttle?: boolean
  consent_reglement?: boolean
  consent_image?: boolean
  quote_lines?: { designation: string; qty: number; unitPrice: number; vatRate: number }[]
  vat_breakdown?: { rate: number; ht: number; vat: number; ttc: number }[]
}

export async function createReservation(
  input: ReservationInput,
): Promise<{ id: string; reference: string }> {
  const { data: ref, error: rErr } = await supabase.rpc(
    'next_reservation_reference',
  )
  if (rErr) throw new Error(rErr.message)
  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('reservations')
    .insert({ ...input, id, reference: ref, amount: input.total_ttc ?? 0 })
  if (error) throw new Error(error.message)
  return { id, reference: ref as string }
}

// ------------------------------------------------------------ Newsletter
export async function subscribeNewsletter(
  email: string,
  source?: string,
): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function listNewsletterSubscribers(): Promise<
  NewsletterSubscriber[]
> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  return unwrap(data, error)
}

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export interface MessageInput {
  first_name: string
  last_name: string
  email: string
  phone?: string
  subject?: string
  body: string
}

export async function createMessage(input: MessageInput): Promise<void> {
  const { error } = await supabase.from('messages').insert(input)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------- Admin: reservations
export async function listReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
  return unwrap(data, error)
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export interface ManualReservationInput {
  client_name: string
  client_email: string
  client_phone?: string
  type: string
  arrival_date: string
  departure_date?: string
  guests?: number
  amount?: number
  status?: ReservationStatus
  message?: string
}

export async function createReservationManual(
  input: ManualReservationInput,
): Promise<void> {
  const { data: ref, error: rErr } = await supabase.rpc(
    'next_reservation_reference',
  )
  if (rErr) throw new Error(rErr.message)
  const { error } = await supabase
    .from('reservations')
    .insert({ ...input, reference: ref })
  if (error) throw new Error(error.message)
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from('reservations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAllReservations(): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .not('id', 'is', null)
  if (error) throw new Error(error.message)
}

// ------------------------------------------------------ Admin: events CRUD
export async function listAllEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false })
  return unwrap(data, error)
}

export async function upsertEvent(row: Partial<EventRow>): Promise<void> {
  const { error } = await supabase.from('events').upsert(row)
  if (error) throw new Error(error.message)
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------- Admin: articles CRUD
export async function listAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  return unwrap(data, error)
}

export async function upsertArticle(row: Partial<Article>): Promise<void> {
  const { error } = await supabase.from('articles').upsert(row)
  if (error) throw new Error(error.message)
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ------------------------------------------------ Admin: intervenants CRUD
export async function listAllIntervenants(): Promise<Intervenant[]> {
  const { data, error } = await supabase
    .from('intervenants')
    .select('*')
    .order('created_at', { ascending: true })
  return unwrap(data, error)
}

export async function upsertIntervenant(
  row: Partial<Intervenant>,
): Promise<void> {
  const { error } = await supabase.from('intervenants').upsert(row)
  if (error) throw new Error(error.message)
}

export async function deleteIntervenant(id: string): Promise<void> {
  const { error } = await supabase.from('intervenants').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ------------------------------------------------------- Admin: media + admins
export async function uploadMedia(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from('media').upload(path, file)
  if (error) throw new Error(error.message)
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export async function listAdmins(): Promise<
  { id: string; email: string; full_name: string | null }[]
> {
  const { data, error } = await supabase
    .from('admins')
    .select('id,email,full_name')
    .order('created_at')
  return unwrap(data, error)
}

export async function inviteAdmin(email: string): Promise<void> {
  // Envoie un lien magique. Après première connexion de l'invité·e, un admin
  // doit ajouter sa ligne dans `admins` (voir l'écran Paramètres).
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw new Error(error.message)
}
