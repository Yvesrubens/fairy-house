// Fonction serverless Vercel : envoie un email de confirmation au client d'une
// réservation via Resend. Réservée aux admins authentifiés.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

const CONTACT = {
  email: 'contact@fairyhouse.com',
  phone: '+33 1 23 45 67 89',
  address: 'Le Grand Leu, 45230 La Chapelle sur Aveyron',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

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

  const amountLine =
    Number(r.amount) > 0
      ? `<tr><td style="padding:6px 0;color:#555">Montant</td><td style="padding:6px 0;font-weight:600">${Number(
          r.amount,
        ).toLocaleString('fr-FR')} €</td></tr>`
      : ''

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:28px">
      <p style="font-size:16px">Bonjour ${r.client_name},</p>
      <p style="line-height:1.6;color:#333">
        Nous avons le plaisir de confirmer votre réservation à la Fairy House.
        Merci de votre confiance — nous avons hâte de vous accueillir dans notre
        sanctuaire de reconnexion.
      </p>
      <div style="background:#f7f5ef;border:1px solid #e0dcd1;border-radius:12px;padding:20px;margin:24px 0">
        <h2 style="margin:0 0 12px;font-size:16px;color:#c79c37">Récapitulatif</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#555">Référence</td><td style="padding:6px 0;font-weight:600">${r.reference}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Type d'hébergement</td><td style="padding:6px 0;font-weight:600">${r.type}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Arrivée</td><td style="padding:6px 0;font-weight:600">${fmtDate(r.arrival_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Départ</td><td style="padding:6px 0;font-weight:600">${fmtDate(r.departure_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Personnes</td><td style="padding:6px 0;font-weight:600">${r.guests ?? '—'}</td></tr>
          ${amountLine}
        </table>
      </div>
      <p style="line-height:1.6;color:#333">
        Pour toute question, nous restons à votre disposition :
      </p>
      <p style="line-height:1.6;color:#333;font-size:14px">
        ✉️ ${CONTACT.email}<br/>
        ☎️ ${CONTACT.phone}<br/>
        📍 ${CONTACT.address}
      </p>
      <p style="margin-top:24px;color:#333">Avec toute notre douceur,<br/><strong>L'équipe Fairy House</strong></p>
    </div>
    <div style="background:#111;padding:16px;text-align:center;color:#888;font-size:12px">
      © 2026 Fairy House — Un lieu de reconnexion au corps, à l'intime et à la créativité.
    </div>
  </div>`

  const text = `Bonjour ${r.client_name},

Nous confirmons votre réservation à la Fairy House.

Référence : ${r.reference}
Type : ${r.type}
Arrivée : ${fmtDate(r.arrival_date)}
Départ : ${fmtDate(r.departure_date)}
Personnes : ${r.guests ?? '—'}
${Number(r.amount) > 0 ? `Montant : ${Number(r.amount).toLocaleString('fr-FR')} €\n` : ''}
Contact : ${CONTACT.email} · ${CONTACT.phone}
${CONTACT.address}

L'équipe Fairy House`

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
