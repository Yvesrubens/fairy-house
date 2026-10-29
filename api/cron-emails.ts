// Cron quotidien (Vercel) : envoie les mails planifiés.
//  - Préparation J-2  : arrivée dans 2 jours
//  - Satisfaction J+2 : départ il y a 2 jours
//  - Relance paiement : solde (paiement en 2 fois) dû dans REMINDER_DAYS jours
// Anti-doublon via les colonnes *_sent_at. Protégé par CRON_SECRET.
import { createClient } from '@supabase/supabase-js'
import { prepEmail, satisfactionEmail, reminderEmail } from './_lib/lifecycle-emails.js'
import type { LifecycleLinks } from './_lib/lifecycle-emails.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string
const CRON_SECRET = process.env.CRON_SECRET as string
const REMINDER_DAYS = Number(process.env.PAYMENT_REMINDER_DAYS || 7)

const LINKS: LifecycleLinks = {
  satisfactionForm: process.env.SATISFACTION_FORM_URL || undefined,
  googleReview: process.env.GOOGLE_REVIEW_URL || undefined,
  newsletter: process.env.NEWSLETTER_URL || undefined,
}

function isoPlus(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

async function sendEmail(payload: Record<string, unknown>): Promise<boolean> {
  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, ...payload }),
  })
  return send.ok
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // Auth : Vercel Cron envoie « Authorization: Bearer <CRON_SECRET> ».
  const auth = req.headers.authorization || ''
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    res.status(401).json({ error: 'Non autorisé' })
    return
  }
  if (!SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration serveur manquante.' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const today = isoPlus(0)
  const plus2 = isoPlus(2)
  const minus2 = isoPlus(-2)
  const reminderDay = isoPlus(REMINDER_DAYS)
  const result = { prep: 0, satisfaction: 0, reminder: 0, errors: [] as string[] }

  // --- J-2 : préparation du séjour (arrivée dans 2 jours) ---
  try {
    const { data: rows } = await supabase
      .from('reservations')
      .select('*')
      .eq('arrival_date', plus2)
      .is('prep_sent_at', null)
      .neq('status', 'cancelled')

    // Consignes par événement (pour les inscriptions événement).
    const eventIds = [...new Set((rows ?? []).map((r) => r.event_id).filter(Boolean))]
    const consignes: Record<string, string | null> = {}
    if (eventIds.length) {
      const { data: evs } = await supabase
        .from('events')
        .select('id,email_consignes')
        .in('id', eventIds)
      for (const e of evs ?? []) consignes[e.id] = e.email_consignes
    }

    for (const r of rows ?? []) {
      const mail = prepEmail(r, r.event_id ? consignes[r.event_id] : null)
      const ok = await sendEmail({ to: [r.client_email], ...mail })
      if (ok) {
        await supabase
          .from('reservations')
          .update({ prep_sent_at: new Date().toISOString() })
          .eq('id', r.id)
        result.prep++
      }
    }
  } catch (e) {
    result.errors.push('prep: ' + (e as Error).message)
  }

  // --- J+2 : satisfaction (départ il y a 2 jours ; arrivée pour les événements sans départ) ---
  try {
    const { data: rows } = await supabase
      .from('reservations')
      .select('*')
      .or(`departure_date.eq.${minus2},arrival_date.eq.${minus2}`)
      .is('satisfaction_sent_at', null)
      .neq('status', 'cancelled')

    for (const r of rows ?? []) {
      const effective = (r.departure_date || r.arrival_date || '').slice(0, 10)
      if (effective !== minus2) continue
      const mail = satisfactionEmail(r, LINKS)
      const ok = await sendEmail({ to: [r.client_email], ...mail })
      if (ok) {
        await supabase
          .from('reservations')
          .update({ satisfaction_sent_at: new Date().toISOString() })
          .eq('id', r.id)
        result.satisfaction++
      }
    }
  } catch (e) {
    result.errors.push('satisfaction: ' + (e as Error).message)
  }

  // --- Relance paiement en 2 fois (solde dû dans REMINDER_DAYS jours) ---
  try {
    const { data: rows } = await supabase
      .from('reservations')
      .select('*')
      .eq('payment_plan', 'split')
      .eq('balance_due_date', reminderDay)
      .gt('balance_amount', 0)
      .is('reminder_sent_at', null)
      .neq('status', 'cancelled')

    for (const r of rows ?? []) {
      const mail = reminderEmail(r)
      const ok = await sendEmail({ to: [r.client_email], ...mail })
      if (ok) {
        await supabase
          .from('reservations')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', r.id)
        result.reminder++
      }
    }
  } catch (e) {
    result.errors.push('reminder: ' + (e as Error).message)
  }

  res.status(200).json({ ok: true, date: today, ...result })
}
