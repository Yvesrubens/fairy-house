// Webhook Stripe : confirme le paiement d'une réservation. Corps brut requis
// pour vérifier la signature. Marque la réservation payée + confirmée et envoie
// l'e-mail de confirmation (idempotent).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { confirmationEmail } from './_lib/confirmation.js'
import { fetchOrgSettings } from './_lib/org-settings.js'

export const config = { api: { bodyParser: false } }

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readRaw(req: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function sendConfirmation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any,
  org: { contactEmail: string; contactPhone: string; address: string },
): Promise<void> {
  const { html, text } = confirmationEmail(r, {
    email: org.contactEmail,
    phone: org.contactPhone,
    address: org.address,
  })
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [r.client_email],
      subject: `Confirmation de votre réservation — Fairy House (${r.reference})`,
      html,
      text,
    }),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY)
  let event: Stripe.Event
  try {
    const raw = await readRaw(req)
    const sig = req.headers['stripe-signature'] as string
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    res.status(400).send(`Webhook Error: ${(e as Error).message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservationId = session.metadata?.reservationId
    if (reservationId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data: r } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .maybeSingle()
      // Idempotence : ne rien refaire si déjà payé.
      if (r && r.payment_status !== 'paid') {
        await supabase
          .from('reservations')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_payment_intent: (session.payment_intent as string) ?? null,
          })
          .eq('id', reservationId)
        if (!r.confirmation_sent_at) {
          try {
            const org = await fetchOrgSettings(supabase)
            await sendConfirmation(r, org)
            await supabase
              .from('reservations')
              .update({ confirmation_sent_at: new Date().toISOString() })
              .eq('id', reservationId)
          } catch (e) {
            console.error('stripe-webhook email error', e)
          }
        }
      }
    }
  }

  res.status(200).json({ received: true })
}
