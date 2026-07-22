// Fonction serverless Vercel : envoie un email de confirmation au client d'une
// réservation via Resend. Réservée aux admins authentifiés.
import { createClient } from '@supabase/supabase-js'
import { confirmationEmail } from './_lib/confirmation.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' })
    return
  }

  const { reservationId } = req.body || {}
  if (!reservationId) {
    res.status(400).json({ error: 'reservationId manquant' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  // Vérifier l'utilisateur et son statut admin
  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData.user) {
    res.status(401).json({ error: 'Session invalide' })
    return
  }
  const { data: adminRow } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userData.user.id)
    .maybeSingle()
  if (!adminRow) {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    return
  }

  // Récupérer la réservation
  const { data: r, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle()
  if (resErr || !r) {
    res.status(404).json({ error: 'Réservation introuvable' })
    return
  }

  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration email manquante (RESEND).' })
    return
  }

  const { html, text } = confirmationEmail(r)

  // Envoi via Resend
  const send = await fetch('https://api.resend.com/emails', {
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

  if (!send.ok) {
    const detail = await send.text()
    res.status(502).json({ error: `Échec de l'envoi: ${detail}` })
    return
  }

  await supabase
    .from('reservations')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', reservationId)

  res.status(200).json({ ok: true })
}
