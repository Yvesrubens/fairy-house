// Fonction serverless Vercel : crée une facture SAISIE À LA MAIN, sans
// réservation liée (reprise des factures émises hors site, règlements sur
// place…). Réservée aux admins authentifiés.
//  - prix saisis en TTC (taux de TVA par ligne) ;
//  - numéro libre (reprise d'un ancien numéro) ou automatique FAC-AAAA-NNNNN ;
//  - date d'émission choisie (peut être passée) ;
//  - règlement optionnel enregistré d'emblée (facture déjà payée) ;
//  - envoi par e-mail optionnel (désactivé par défaut pour une reprise).
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf, eur, fmtDate } from './_lib/devis-pdf.js'
import { fetchOrgSettings } from './_lib/org-settings.js'
import { computeInvoice } from './_lib/invoice-lines.js'
import type { TtcLine } from './_lib/invoice-lines.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

const METHODS = ['especes', 'virement', 'cb', 'cheque', 'autre']
const METHOD_LABELS: Record<string, string> = {
  especes: 'espèces',
  virement: 'virement',
  cb: 'carte bancaire',
  cheque: 'chèque',
  autre: 'autre',
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

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const {
    clientName,
    clientEmail,
    clientAddress,
    lines,
    issuedAt,
    reference: customRef,
    dueDays = 30,
    note,
    send = false,
    preview = false,
    payment,
  } = body

  if (!String(clientName || '').trim() || !Array.isArray(lines) || lines.length === 0) {
    res.status(400).json({ error: 'Nom du client et au moins une ligne sont requis.' })
    return
  }
  const issueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(issuedAt || ''))
    ? String(issuedAt)
    : new Date().toISOString().slice(0, 10)
  if (payment && !METHODS.includes(payment.method)) {
    res.status(400).json({ error: 'Mode de règlement invalide.' })
    return
  }
  if (send && !String(clientEmail || '').trim()) {
    res.status(400).json({ error: "Une adresse e-mail est nécessaire pour l'envoi." })
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

  const inv = computeInvoice(lines as TtcLine[])
  if (!(inv.totalTtc > 0)) {
    res.status(400).json({ error: 'Le total de la facture doit être supérieur à 0.' })
    return
  }
  const pdfLines = inv.lines.map((l) => ({
    designation: l.designation,
    qty: l.qty,
    unitPrice: l.unitPrice,
  }))
  const paidDate =
    payment && /^\d{4}-\d{2}-\d{2}$/.test(String(payment.paid_at || ''))
      ? String(payment.paid_at)
      : issueDate
  const isPaid = Boolean(payment)
  const paidNote = isPaid
    ? `Facture acquittée le ${fmtDate(paidDate)} (${METHOD_LABELS[payment.method]}).`
    : undefined
  const pdfNote = [note ? String(note) : '', paidNote ?? ''].filter(Boolean).join(' ')

  const org = await fetchOrgSettings(supabase)
  const issuer = {
    email: org.contactEmail,
    phone: org.contactPhone,
    address: org.address,
    siret: org.siret,
    tva: org.tva,
  }
  const pdfOpts = {
    reservationRef: '',
    clientName: String(clientName).trim(),
    clientEmail: String(clientEmail || '').trim(),
    clientAddress: String(clientAddress || '').trim() || undefined,
    lines: pdfLines,
    totalHt: inv.totalHt,
    vatBreakdown: inv.vatBreakdown,
    totalTtc: inv.totalTtc,
    validityDays: Number(dueDays) || 30,
    note: pdfNote || undefined,
    docType: 'facture' as const,
    rib: isPaid ? undefined : org.rib,
    issuer,
    issueDate,
  }

  // Aperçu : PDF sans enregistrement ni consommation de numéro.
  if (preview) {
    const pdf = await buildDevisPdf({
      ...pdfOpts,
      reference: String(customRef || '').trim() || 'FACTURE (aperçu)',
    })
    res.status(200).json({ ok: true, preview: true, pdf: Buffer.from(pdf).toString('base64') })
    return
  }

  // Numéro : repris (libre) ou automatique.
  let reference = String(customRef || '').trim()
  if (reference) {
    const { data: dup } = await supabase
      .from('factures')
      .select('id')
      .eq('reference', reference)
      .maybeSingle()
    if (dup) {
      res.status(409).json({ error: `Le numéro ${reference} existe déjà.` })
      return
    }
  } else {
    const { data: ref, error: refErr } = await supabase.rpc('next_facture_reference')
    if (refErr || !ref) {
      res.status(500).json({ error: 'Numérotation de la facture impossible' })
      return
    }
    reference = ref as string
  }

  const { data: created, error: insErr } = await supabase
    .from('factures')
    .insert({
      reference,
      reservation_id: null,
      client_name: pdfOpts.clientName,
      client_email: pdfOpts.clientEmail || null,
      client_address: pdfOpts.clientAddress ?? null,
      lines: inv.lines,
      total_ht: inv.totalHt,
      vat_rate: inv.mainRate,
      total_ttc: inv.totalTtc,
      issued_at: issueDate,
    })
    .select('id')
    .single()
  if (insErr || !created) {
    const dupe = insErr?.code === '23505'
    res
      .status(dupe ? 409 : 500)
      .json({ error: dupe ? `Le numéro ${reference} existe déjà.` : insErr?.message || 'Enregistrement impossible' })
    return
  }

  if (isPaid) {
    const { error: payErr } = await supabase.from('facture_payments').insert({
      facture_id: created.id,
      amount: inv.totalTtc,
      method: payment.method,
      paid_at: paidDate,
      note: 'Enregistré à la création de la facture',
    })
    if (payErr) {
      res.status(200).json({
        ok: true,
        reference,
        warning: `Facture créée, mais le règlement n'a pas pu être enregistré : ${payErr.message}`,
      })
      return
    }
  }

  const pdfBytes = await buildDevisPdf({ ...pdfOpts, reference })
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  let emailWarning: string | undefined
  if (send) {
    if (!RESEND_API_KEY || !RESEND_FROM) {
      emailWarning = 'Facture créée, mais configuration e-mail manquante : non envoyée.'
    } else {
      const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:20px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:24px">
      <p>Bonjour ${pdfOpts.clientName},</p>
      <p style="line-height:1.6;color:#333">Veuillez trouver ci-joint votre facture <strong>${reference}</strong>.</p>
      <p style="font-size:16px"><strong>Total TTC : ${eur(inv.totalTtc)}</strong></p>
      ${paidNote ? `<p style="color:#555">${paidNote}</p>` : ''}
      <p style="line-height:1.6;color:#333">Pour toute question : ${org.contactEmail} · ${org.contactPhone}</p>
      <p style="margin-top:20px">Bien à vous,<br/><strong>Fairy House</strong></p>
    </div>
  </div>`
      const sendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [pdfOpts.clientEmail],
          subject: `Votre facture Fairy House — ${reference}`,
          html,
          attachments: [{ filename: `${reference}.pdf`, content: pdfBase64 }],
        }),
      })
      if (!sendRes.ok) emailWarning = "Facture créée, mais l'envoi de l'e-mail a échoué."
    }
  }

  res.status(200).json({ ok: true, reference, pdf: pdfBase64, warning: emailWarning })
}
