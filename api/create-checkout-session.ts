// Crée une session Stripe Checkout pour une réservation. Le montant est relu en
// base (source de vérité), jamais fourni par le client. Public (le client vient
// de créer sa réservation et en possède l'id).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Configuration paiement manquante.' })
    return
  }
  const body =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { reservationId, successUrl, cancelUrl, label } = body
  if (!reservationId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: 'Paramètres manquants.' })
    return
  }
  // Anti open-redirect : les URLs de retour doivent être sur l'origine du site.
  const origin = req.headers.origin || ''
  if (
    origin &&
    (!String(successUrl).startsWith(origin) || !String(cancelUrl).startsWith(origin))
  ) {
    res.status(400).json({ error: 'URLs de retour invalides.' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: r, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle()
  if (error || !r) {
    res.status(404).json({ error: 'Réservation introuvable' })
    return
  }
  const amount = Number(r.amount) || 0
  if (amount <= 0) {
    res.status(400).json({ error: 'Montant invalide pour un paiement.' })
    return
  }
  if (r.payment_status === 'paid') {
    res.status(400).json({ error: 'Réservation déjà payée.' })
    return
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amount * 100),
          product_data: { name: String(label || `Réservation ${r.reference}`) },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: reservationId,
    metadata: { reservationId },
    customer_email: r.client_email || undefined,
  })

  await supabase
    .from('reservations')
    .update({ stripe_session_id: session.id })
    .eq('id', reservationId)

  res.status(200).json({ url: session.url })
}
