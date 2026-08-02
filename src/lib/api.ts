import { supabase } from './supabase'
import type {
  Article,
  BedBlock,
  EventRow,
  EventCategory,
  FactureRow,
  Intervenant,
  IntervenantDomain,
  MessageRow,
  NewsletterSubscriber,
  OrgSettings,
  Reservation,
  ReservationStatus,
  SiteContentRow,
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

/** Places déjà prises par événement (inscriptions non annulées). */
export async function eventsSeatsTaken(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('events_seats_taken')
  if (error) throw new Error(error.message)
  const map: Record<string, number> = {}
  for (const r of (data ?? []) as { event_id: string; taken: number }[]) {
    map[r.event_id] = r.taken
  }
  return map
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

/** Crée une session Stripe Checkout pour une réservation et renvoie l'URL. */
export async function createCheckoutSession(input: {
  reservationId: string
  successUrl: string
  cancelUrl: string
  label: string
}): Promise<{ url: string }> {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.url) throw new Error(body.error || 'Paiement indisponible')
  return { url: body.url as string }
}

// ------------------------------------------------------- Disponibilités
/** Vrai si la demande tient dans les lits restants (RPC SECURITY DEFINER). */
export async function checkAvailability(
  arrival: string,
  departure: string | undefined,
  beds: number,
  wholeHouse: boolean,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_availability', {
    p_arrival: arrival,
    p_departure: departure ?? null,
    p_beds: beds,
    p_whole_house: wholeHouse,
  })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

/** Lits restants par date sur une plage (pour le calendrier). */
export async function availabilityCalendar(
  from: string,
  to: string,
): Promise<{ day: string; remaining: number }[]> {
  const { data, error } = await supabase.rpc('availability_calendar', {
    p_from: from,
    p_to: to,
  })
  return unwrap(data, error)
}

// ------------------------------------------------------------ Newsletter
export async function subscribeNewsletter(
  email: string,
  source?: string,
): Promise<void> {
  // Insert simple (ne requiert que la policy INSERT). Un email déjà inscrit
  // déclenche une violation d'unicité (23505) que l'on considère comme un
  // succès — on évite ainsi l'upsert, dont le chemin ON CONFLICT exigerait une
  // policy UPDATE.
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email, source })
  if (error && error.code !== '23505') throw new Error(error.message)
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

// ------------------------------------------------------- Admin: messages
export async function listMessages(): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
  return unwrap(data, error)
}

export async function updateMessage(
  id: string,
  patch: Partial<Pick<MessageRow, 'read' | 'treated' | 'archived'>>,
): Promise<void> {
  const { error } = await supabase.from('messages').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --------------------------------------------- Admin: domaines accompagnant·es
export async function listDomains(): Promise<IntervenantDomain[]> {
  const { data, error } = await supabase
    .from('intervenant_domains')
    .select('*')
    .order('name', { ascending: true })
  return unwrap(data, error)
}

export async function addDomain(name: string): Promise<void> {
  const { error } = await supabase.from('intervenant_domains').insert({ name })
  if (error) throw new Error(error.message)
}

export async function updateDomain(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('intervenant_domains')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteDomain(id: string): Promise<void> {
  const { error } = await supabase
    .from('intervenant_domains')
    .delete()
    .eq('id', id)
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

// Champs de réservation modifiables en back-office (dont facturation).
export type ReservationEditable = Partial<
  Pick<
    Reservation,
    | 'client_name'
    | 'client_email'
    | 'client_phone'
    | 'arrival_date'
    | 'departure_date'
    | 'guests'
    | 'amount'
    | 'message'
    | 'billing_name'
    | 'billing_email'
    | 'billing_address'
  >
>

export async function updateReservation(
  id: string,
  patch: ReservationEditable,
): Promise<void> {
  const { error } = await supabase.from('reservations').update(patch).eq('id', id)
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
  event_id?: string
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

// --------------------------------------------------- Admin: blocages de lits
export async function listBedBlocks(): Promise<BedBlock[]> {
  const { data, error } = await supabase
    .from('bed_blocks')
    .select('*')
    .order('start_date', { ascending: false })
  return unwrap(data, error)
}

export async function createBedBlock(input: {
  start_date: string
  end_date: string
  beds: number
  label?: string
}): Promise<void> {
  const { error } = await supabase.from('bed_blocks').insert(input)
  if (error) throw new Error(error.message)
}

export async function updateBedBlock(
  id: string,
  input: { start_date: string; end_date: string; beds: number; label?: string },
): Promise<void> {
  const { error } = await supabase.from('bed_blocks').update(input).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteBedBlock(id: string): Promise<void> {
  const { error } = await supabase.from('bed_blocks').delete().eq('id', id)
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

// ------------------------------------------- Catégories d'événements (F8)
export async function listEventCategories(): Promise<EventCategory[]> {
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('name', { ascending: true })
  return unwrap(data, error)
}

export async function addEventCategory(name: string): Promise<void> {
  const { error } = await supabase.from('event_categories').insert({ name })
  if (error) throw new Error(error.message)
}

export async function updateEventCategory(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('event_categories')
    .update({ name })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteEventCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('event_categories')
    .delete()
    .eq('id', id)
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

// ------------------------------------------------------- Admin: factures
export async function listFactures(): Promise<FactureRow[]> {
  const { data, error } = await supabase
    .from('factures')
    .select('*')
    .order('created_at', { ascending: false })
  const rows = unwrap(data, error) as FactureRow[]
  // On rattache l'event_id de la réservation liée pour pouvoir dispatcher
  // les factures d'événements et celles de séjours (le champ n'est pas
  // stocké sur la facture elle-même).
  const resIds = [
    ...new Set(rows.map((f) => f.reservation_id).filter(Boolean)),
  ] as string[]
  if (resIds.length) {
    const { data: resv } = await supabase
      .from('reservations')
      .select('id, event_id')
      .in('id', resIds)
    const eventOf = new Map(
      ((resv ?? []) as { id: string; event_id: string | null }[]).map((r) => [
        r.id,
        r.event_id,
      ]),
    )
    for (const f of rows) {
      f.reservation_event_id = f.reservation_id
        ? eventOf.get(f.reservation_id) ?? null
        : null
    }
  }
  return rows
}

export async function updateFacture(
  id: string,
  patch: Partial<
    Pick<
      FactureRow,
      | 'lines'
      | 'total_ht'
      | 'vat_rate'
      | 'total_ttc'
      | 'client_name'
      | 'client_email'
      | 'client_address'
    >
  >,
): Promise<void> {
  const { error } = await supabase.from('factures').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

// -------------------------------------------- Admin: coordonnées & facturation
export async function getOrgSettings(): Promise<OrgSettings | null> {
  const { data, error } = await supabase
    .from('org_settings')
    .select('*')
    .eq('id', 'org')
    .maybeSingle()
  return unwrap(data, error)
}

export async function updateOrgSettings(
  patch: Partial<Omit<OrgSettings, 'id' | 'updated_at'>>,
): Promise<void> {
  const { error } = await supabase
    .from('org_settings')
    .upsert({ id: 'org', ...patch, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
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

// ------------------------------------------------- Contenu des pages (CMS)
export async function listSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase.from('site_content').select('*')
  return unwrap(data, error)
}

export async function upsertSiteContent(
  entries: { key: string; value: string }[],
): Promise<void> {
  if (entries.length === 0) return
  const rows = entries.map((e) => ({
    key: e.key,
    value: e.value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('site_content').upsert(rows)
  if (error) throw new Error(error.message)
}
