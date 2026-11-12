// Achat d'un bon cadeau (public) : crée le bon « en attente » puis une session
// Stripe Checkout. Le bon devient actif et est envoyé par e-mail une fois le
// paiement confirmé par le webhook Stripe (api/stripe-webhook.ts).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { GIFT_MAX, GIFT_MIN, newGiftCode, parseGiftAmount } from './_lib/gift.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

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
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}

  const amount = parseGiftAmount(body.amount)
  if (amount == null) {
    res.status(400).json({ error: `Le montant doit être un nombre entier entre ${GIFT_MIN} et ${GIFT_MAX} €.` })
    return
  }
  const buyerName = clean(body.buyerName, 80)
  const buyerEmail = clean(body.buyerEmail, 160).toLowerCase()
  const recipientName = clean(body.recipientName, 80)
  const message = clean(body.message, 300)
  if (!buyerName || !EMAIL_RE.test(buyerEmail)) {
    res.status(400).json({ error: 'Merci d’indiquer votre nom et une adresse e-mail valide.' })
    return
  }

  const { successUrl, cancelUrl } = body
  const origin = req.headers.origin || ''
  if (
    !successUrl ||
    !cancelUrl ||
    (origin && (!String(successUrl).startsWith(origin) || !String(cancelUrl).startsWith(origin)))
  ) {
    res.status(400).json({ error: 'URLs de retour invalides.' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Numéro unique (nouvel essai en cas de collision, très improbable).
  let voucher: { id: string; code: string } | null = null
  for (let i = 0; i < 5 && !voucher; i++) {
    const { data, error } = await supabase
      .from('gift_vouchers')
      .insert({
        code: newGiftCode(),
        amount,
        balance: amount,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        recipient_name: recipientName || null,
        message: message || null,
        status: 'pending',
      })
      .select('id, code')
      .single()
    if (!error && data) voucher = data
    else if (error && error.code !== '23505') {
      console.error('gift-checkout insert error', error)
      res.status(500).json({ error: 'Impossible de créer le bon cadeau.' })
      return
    }
  }
  if (!voucher) {
    res.status(500).json({ error: 'Impossible de créer le bon cadeau.' })
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
          unit_amount: amount * 100,
          product_data: {
            name: `Bon cadeau Fairy House — ${amount} €`,
            description: recipientName ? `Pour ${recipientName}` : undefined,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: voucher.id,
    metadata: { kind: 'gift', voucherId: voucher.id },
    customer_email: buyerEmail,
  })

  await supabase.from('gift_vouchers').update({ stripe_session_id: session.id }).eq('id', voucher.id)

  res.status(200).json({ url: session.url })
}
