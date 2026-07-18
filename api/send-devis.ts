// Fonction serverless Vercel : génère un devis PDF et l'envoie au client par
// email (Resend, pièce jointe). Réservée aux admins authentifiés.
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

const ISSUER = {
  name: 'Fairy House',
  address: 'Le Grand Leu, 45230 La Chapelle sur Aveyron',
  email: 'contact@fairyhouse.com',
  phone: '+33 1 23 45 67 89',
  siret: process.env.FH_SIRET || 'SIRET : à compléter',
  tva: process.env.FH_TVA || 'N° TVA : à compléter',
}
const GOLD = rgb(0.78, 0.61, 0.21)
const DARK = rgb(0.07, 0.09, 0.15)
const GREY = rgb(0.4, 0.4, 0.4)

interface Line {
  designation: string
  qty: number
  unitPrice: number
}

function eur(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

async function buildPdf(opts: {
  reference: string
  reservationRef: string
  clientName: string
  clientEmail: string
  lines: Line[]
  totalHt: number
  vatRate: number
  totalTtc: number
  validityDays: number
  note?: string
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const { width } = page.getSize()
  const M = 50
  let y = 800

  const text = (s: string, x: number, yy: number, size = 10, f = font, color = DARK) =>
    page.drawText(s, { x, y: yy, size, font: f, color })

  // En-tête
  page.drawRectangle({ x: 0, y: 802, width, height: 40, color: GOLD })
  text('FAIRY HOUSE', M, 814, 18, bold, rgb(1, 1, 1))

  y = 770
  // Émetteur
  text(ISSUER.name, M, y, 11, bold)
  text(ISSUER.address, M, y - 14, 9, font, GREY)
  text(ISSUER.email + '  ' + ISSUER.phone, M, y - 27, 9, font, GREY)
  text(ISSUER.siret, M, y - 40, 9, font, GREY)
  text(ISSUER.tva, M, y - 53, 9, font, GREY)

  // Bloc devis (droite)
  text('DEVIS', width - M - 140, y, 16, bold, GOLD)
  text('N° ' + opts.reference, width - M - 140, y - 20, 10, bold)
  const today = new Date()
  text('Date : ' + fmtDate(today.toISOString()), width - M - 140, y - 34, 9, font, GREY)
  text(`Valable ${opts.validityDays} jours`, width - M - 140, y - 47, 9, font, GREY)

  // Client
  y = 690
  text('Destinataire', M, y, 9, bold, GREY)
  text(opts.clientName, M, y - 15, 11, bold)
  text(opts.clientEmail, M, y - 29, 9, font, GREY)
  text('Réservation : ' + opts.reservationRef, M, y - 43, 9, font, GREY)

  // Tableau en-tête
  y = 620
  const cols = { des: M, qty: 350, pu: 410, tot: 500 }
  page.drawRectangle({ x: M, y: y - 4, width: width - 2 * M, height: 22, color: rgb(0.96, 0.95, 0.92) })
  text('Désignation', cols.des + 4, y + 3, 9, bold)
  text('Qté', cols.qty, y + 3, 9, bold)
  text('PU HT', cols.pu, y + 3, 9, bold)
  text('Total HT', cols.tot, y + 3, 9, bold)

  y -= 24
  for (const l of opts.lines) {
    const lineTot = l.qty * l.unitPrice
    // wrap designation to ~50 chars
    const desg = l.designation.length > 55 ? l.designation.slice(0, 54) + '…' : l.designation
    text(desg, cols.des + 4, y, 9)
    text(String(l.qty), cols.qty, y, 9)
    text(eur(l.unitPrice), cols.pu, y, 9)
    text(eur(lineTot), cols.tot, y, 9)
    page.drawLine({ start: { x: M, y: y - 6 }, end: { x: width - M, y: y - 6 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })
    y -= 22
  }

  // Totaux
  y -= 10
  const tx = 400
  text('Total HT', tx, y, 10, font, GREY)
  text(eur(opts.totalHt), cols.tot, y, 10)
  y -= 16
  text(`TVA ${opts.vatRate} %`, tx, y, 10, font, GREY)
  text(eur(opts.totalTtc - opts.totalHt), cols.tot, y, 10)
  y -= 20
  page.drawRectangle({ x: tx - 8, y: y - 6, width: width - M - tx + 8, height: 24, color: GOLD })
  text('Total TTC', tx, y, 11, bold, rgb(1, 1, 1))
  text(eur(opts.totalTtc), cols.tot, y, 11, bold, rgb(1, 1, 1))

  // Note
  y -= 50
  if (opts.note) {
    text('Note :', M, y, 9, bold)
    text(opts.note.slice(0, 90), M + 40, y, 9, font, GREY)
    y -= 24
  }

  // Bon pour accord
  text('Bon pour accord (date et signature) :', M, 120, 9, font, GREY)
  page.drawRectangle({ x: M, y: 60, width: 220, height: 50, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1, color: rgb(1, 1, 1) })

  // Pied
  text(`${ISSUER.name} — ${ISSUER.address}`, M, 40, 8, font, GREY)

  return doc.save()
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

  const { reservationId, lines, validityDays = 30, note } = req.body || {}
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

  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration email manquante (RESEND).' })
    return
  }

  const cleanLines: Line[] = lines.map((l: Line) => ({
    designation: String(l.designation || ''),
    qty: Number(l.qty) || 0,
    unitPrice: Number(l.unitPrice) || 0,
  }))
  const vatRate = 20
  const totalHt = cleanLines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const totalTtc = Math.round(totalHt * (1 + vatRate / 100) * 100) / 100

  // Numéro de devis
  const { data: ref, error: refErr } = await supabase.rpc('next_devis_reference')
  if (refErr || !ref) {
    res.status(500).json({ error: 'Numérotation du devis impossible' })
    return
  }

  const pdfBytes = await buildPdf({
    reference: ref,
    reservationRef: r.reference,
    clientName: r.client_name,
    clientEmail: r.client_email,
    lines: cleanLines,
    totalHt,
    vatRate,
    totalTtc,
    validityDays,
    note,
  })
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:24px">
      <p>Bonjour ${r.client_name},</p>
      <p style="line-height:1.6;color:#333">
        Veuillez trouver ci-joint votre devis <strong>${ref}</strong> pour votre
        séjour à la Fairy House. Il est valable ${validityDays} jours.
      </p>
      <p style="font-size:16px"><strong>Total TTC : ${eur(totalTtc)}</strong></p>
      ${note ? `<p style="color:#555">${note}</p>` : ''}
      <p style="line-height:1.6;color:#333">
        Pour toute question : ${ISSUER.email} · ${ISSUER.phone}
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
      to: [r.client_email],
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
    vat_rate: vatRate,
    total_ttc: totalTtc,
    validity_days: validityDays,
    sent_at: new Date().toISOString(),
  })

  res.status(200).json({ ok: true, reference: ref })
}
