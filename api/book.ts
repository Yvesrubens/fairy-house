// Fonction serverless Vercel PUBLIQUE : à la validation d'une réservation du
// tunnel, envoie le mail de confirmation et, si paiement par virement, un mail
// devis + RIB. Les montants sont relus/recalculés depuis la base (source de
// vérité), jamais fournis par le client.
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf, eur } from './_lib/devis-pdf.js'
import { confirmationEmail } from './_lib/confirmation.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

const RIB = {
  iban: process.env.FH_RIB_IBAN || 'IBAN : à compléter',
  bic: process.env.FH_RIB_BIC || 'BIC : à compléter',
  titulaire: process.env.FH_RIB_TITULAIRE || 'Fairy House',
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
  try {
    await run(req, res)
  } catch (e) {
    // Filet de sécurité : on ne laisse jamais la fonction planter
    // (FUNCTION_INVOCATION_FAILED). La réservation est déjà enregistrée côté
    // client ; on renvoie un message lisible pour le diagnostic.
    console.error('api/book error', e)
    res
      .status(500)
      .json({ error: 'book_failed', detail: (e as Error)?.message || String(e) })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  const body =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { reservationId } = body
  if (!reservationId) {
    res.status(400).json({ error: 'reservationId manquant' })
    return
  }
  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration email manquante (RESEND).' })
    return
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    res
      .status(500)
      .json({ error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY).' })
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

  if (r.confirmation_sent_at) {
    res.status(200).json({ ok: true, alreadySent: true })
    return
  }

  // 1) Mail de confirmation (toujours)
  const { html, text } = confirmationEmail(r)
  const okConfirm = await sendEmail({
    to: [r.client_email],
    subject: `Confirmation de votre demande — Fairy House (${r.reference})`,
    html,
    text,
  })

  // 2) Mail devis + RIB (si virement) — isolé : un échec PDF/devis ne doit pas
  //    faire échouer la confirmation ni planter la fonction.
  let okDevis = true
  let devisError: string | undefined
  if (r.payment_method === 'virement') {
   try {
    const { data: ref } = await supabase.rpc('next_devis_reference')
    const reference = (ref as string) || r.reference
    // Réservation événement : lignes + TVA multi-taux stockées à l'inscription.
    // Sinon (tunnel séjour) : ligne unique + TVA mono-taux.
    const isEvent = Array.isArray(r.quote_lines) && r.quote_lines.length > 0
    const lines = isEvent
      ? (r.quote_lines as { designation: string; qty: number; unitPrice: number }[])
      : [{ designation: 'Séjour (nuitées)', qty: 1, unitPrice: Number(r.total_ht) || 0 }]
    const vatBreakdown = isEvent
      ? (r.vat_breakdown as { rate: number; ht: number; vat: number }[])
      : undefined
    const vatRate = Number(r.vat_rate) || 10
    const totalHt = Number(r.total_ht) || 0
    const totalTtc = Number(r.total_ttc) || 0
    const pdf = await buildDevisPdf({
      reference,
      reservationRef: r.reference,
      clientName: r.client_name,
      clientEmail: r.client_email,
      lines,
      totalHt,
      vatRate,
      vatBreakdown,
      totalTtc,
      validityDays: 30,
      rib: RIB,
    })
    const pdfBase64 = Buffer.from(pdf).toString('base64')
    const planNote =
      r.payment_plan === 'split'
        ? `<p>Paiement en 2 fois : acompte de <strong>${eur(Number(r.deposit_amount) || 0)}</strong> à la réservation, solde de <strong>${eur(Number(r.balance_amount) || 0)}</strong> avant le ${r.balance_due_date}.</p>`
        : ''
    const devisHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#c79c37;padding:20px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px">FAIRY HOUSE</h1>
      </div>
      <div style="padding:24px">
        <p>Bonjour ${r.client_name},</p>
        <p style="line-height:1.6;color:#333">Veuillez trouver ci-joint votre devis <strong>${reference}</strong>. Pour confirmer, merci de régler par virement :</p>
        <p style="font-size:16px"><strong>Total TTC : ${eur(totalTtc)}</strong></p>
        ${planNote}
        <div style="background:#f7f5ef;border:1px solid #e0dcd1;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px;font-weight:600;color:#c79c37">Coordonnées bancaires</p>
          <p style="margin:0;color:#333">Titulaire : ${RIB.titulaire}<br/>IBAN : ${RIB.iban}<br/>BIC : ${RIB.bic}</p>
        </div>
        <p style="margin-top:20px">Avec toute notre douceur,<br/><strong>L'équipe Fairy House</strong></p>
      </div>
    </div>`
    okDevis = await sendEmail({
      to: [r.client_email],
      subject: `Votre devis Fairy House — ${reference}`,
      html: devisHtml,
      attachments: [{ filename: `${reference}.pdf`, content: pdfBase64 }],
    })
   } catch (e) {
     console.error('api/book devis error', e)
     okDevis = false
     devisError = (e as Error)?.message || String(e)
   }
  }

  if (okConfirm) {
    await supabase
      .from('reservations')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', reservationId)
  }

  // La réservation reste enregistrée quoi qu'il arrive ; on signale juste l'état d'envoi.
  res.status(200).json({
    ok: okConfirm && okDevis,
    emailConfirm: okConfirm,
    emailDevis: okDevis,
    devisError,
  })
}
