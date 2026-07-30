// Fonction serverless Vercel : génère un devis PDF et l'envoie au client par
// email (Resend, pièce jointe). Réservée aux admins authentifiés.
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf, eur } from './_lib/devis-pdf.js'
import { fetchOrgSettings } from './_lib/org-settings.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

interface Line {
  designation: string
  qty: number
  unitPrice: number
  vatRate?: number
}

const round2 = (v: number) => Math.round(v * 100) / 100

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

  const { reservationId, lines, validityDays = 30, note, preview } = req.body || {}
  if (!reservationId || !Array.isArray(lines) || lines.length === 0) {
    res.status(400).json({ error: 'Données du devis invalides' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

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

  const { data: r, error: resErr } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle()
  if (resErr || !r) {
    res.status(404).json({ error: 'Réservation introuvable' })
    return
  }

  const cleanLines: Line[] = lines.map((l: Line) => ({
    designation: String(l.designation || ''),
    qty: Number(l.qty) || 0,
    unitPrice: Number(l.unitPrice) || 0,
    vatRate: Number(l.vatRate) || 20,
  }))
  const totalHt = round2(cleanLines.reduce((s, l) => s + l.qty * l.unitPrice, 0))
  // TVA détaillée par taux (10 % / 20 %).
  const rates = [...new Set(cleanLines.map((l) => l.vatRate || 20))]
  const vatBreakdown = rates
    .map((rate) => {
      const ht = cleanLines
        .filter((l) => (l.vatRate || 20) === rate)
        .reduce((s, l) => s + l.qty * l.unitPrice, 0)
      return { rate, ht: round2(ht), vat: round2((ht * rate) / 100) }
    })
    .filter((g) => g.ht > 0)
  const totalTtc = round2(totalHt + vatBreakdown.reduce((s, g) => s + g.vat, 0))
  // Taux « principal » (part HT la plus élevée) pour la colonne legacy vat_rate.
  const mainRate =
    vatBreakdown.slice().sort((a, b) => b.ht - a.ht)[0]?.rate ?? 20

  const org = await fetchOrgSettings(supabase)
  // Point 9 : si un contact de facturation distinct est renseigné, le devis lui
  // est adressé (nom + email), sinon on garde le client.
  const billName = r.billing_name || r.client_name
  const billTo = r.billing_email || r.client_email
  const issuer = {
    email: org.contactEmail,
    phone: org.contactPhone,
    address: org.address,
    siret: org.siret,
    tva: org.tva,
  }

  // Aperçu : renvoyer le PDF sans l'envoyer ni consommer de numéro de devis.
  if (preview) {
    const previewPdf = await buildDevisPdf({
      reference: 'DEVIS (aperçu)',
      reservationRef: r.reference,
      clientName: billName,
      clientEmail: billTo,
      lines: cleanLines,
      totalHt,
      vatBreakdown,
      totalTtc,
      validityDays,
      note,
      rib: org.rib,
      issuer,
    })
    res.status(200).json({
      ok: true,
      preview: true,
      pdf: Buffer.from(previewPdf).toString('base64'),
    })
    return
  }

  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration email manquante (RESEND).' })
    return
  }

  // Numéro de devis
  const { data: ref, error: refErr } = await supabase.rpc('next_devis_reference')
  if (refErr || !ref) {
    res.status(500).json({ error: 'Numérotation du devis impossible' })
    return
  }

  const pdfBytes = await buildDevisPdf({
    reference: ref,
    reservationRef: r.reference,
    clientName: billName,
    clientEmail: billTo,
    lines: cleanLines,
    totalHt,
    vatRate,
    totalTtc,
    validityDays,
    note,
    rib: org.rib,
    issuer,
  })
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:24px">
      <p>Bonjour ${billName},</p>
      <p style="line-height:1.6;color:#333">
        Veuillez trouver ci-joint votre devis <strong>${ref}</strong> pour votre
        séjour à la Fairy House. Il est valable ${validityDays} jours.
      </p>
      <p style="font-size:16px"><strong>Total TTC : ${eur(totalTtc)}</strong></p>
      ${note ? `<p style="color:#555">${note}</p>` : ''}
      <p style="line-height:1.6;color:#333">
        Pour toute question : ${org.contactEmail} · ${org.contactPhone}
      </p>
      <p style="margin-top:20px">Avec toute notre douceur,<br/><strong>L'équipe Fairy House</strong></p>
    </div>
  </div>`

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [billTo],
      subject: `Votre devis Fairy House — ${ref}`,
      html,
      attachments: [{ filename: `${ref}.pdf`, content: pdfBase64 }],
    }),
  })

  if (!send.ok) {
    const detail = await send.text()
    res.status(502).json({ error: `Échec de l'envoi: ${detail}` })
    return
  }

  await supabase.from('devis').insert({
    reference: ref,
    reservation_id: reservationId,
    client_name: r.client_name,
    client_email: r.client_email,
    lines: cleanLines,
    total_ht: totalHt,
    vat_rate: mainRate,
    total_ttc: totalTtc,
    validity_days: validityDays,
    sent_at: new Date().toISOString(),
  })

  res.status(200).json({ ok: true, reference: ref })
}
