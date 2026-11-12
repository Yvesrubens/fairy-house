// Fonction serverless Vercel : régénère le PDF d'une facture déjà émise (à
// partir des données stockées), pour visualisation/récupération au back-office
// (point 12). Réservée aux admins.
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf } from './_lib/devis-pdf.js'
import { fetchOrgSettings } from './_lib/org-settings.js'
import { totalsFromStored } from './_lib/invoice-lines.js'

const METHOD_LABELS: Record<string, string> = {
  especes: 'espèces',
  virement: 'virement',
  cb: 'carte bancaire',
  cheque: 'chèque',
  autre: 'autre',
}
function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function eurFr(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string

interface Line {
  designation: string
  qty: number
  unitPrice: number
  vatRate?: number
  unitPriceTtc?: number
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

  const { factureId } = req.body || {}
  if (!factureId) {
    res.status(400).json({ error: 'factureId manquant' })
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

  const { data: f, error: fErr } = await supabase
    .from('factures')
    .select('*')
    .eq('id', factureId)
    .maybeSingle()
  if (fErr || !f) {
    res.status(404).json({ error: 'Facture introuvable' })
    return
  }

  const org = await fetchOrgSettings(supabase)
  const lines: Line[] = Array.isArray(f.lines) ? f.lines : []
  // Ventilation TVA recalculée à partir du TTC saisi (factures récentes) ou du
  // HT (anciennes factures).
  const { vatBreakdown } = totalsFromStored(lines)

  // Mention de règlement (paiements enregistrés au back-office).
  const { data: pays } = await supabase
    .from('facture_payments')
    .select('amount, method, paid_at')
    .eq('facture_id', factureId)
    .order('paid_at', { ascending: true })
  const payments = (pays ?? []) as { amount: number; method: string; paid_at: string }[]
  const totalTtc = Number(f.total_ttc) || 0
  const paid = Math.round(payments.reduce((s, p) => s + Number(p.amount), 0) * 100) / 100
  const remaining = Math.round(Math.max(0, totalTtc - paid) * 100) / 100
  const isPaid = paid > 0 && remaining <= 0
  let note: string | undefined
  if (isPaid) {
    const last = payments[payments.length - 1]
    const modes = [...new Set(payments.map((p) => METHOD_LABELS[p.method] ?? p.method))].join(', ')
    note = `Facture acquittée le ${fmtDate(last.paid_at)} (${modes}).`
  } else if (paid > 0) {
    note = `Déjà réglé : ${eurFr(paid)} — reste à régler : ${eurFr(remaining)}.`
  }

  const pdf = await buildDevisPdf({
    reference: f.reference,
    reservationRef: f.reference,
    clientName: f.client_name || '',
    clientEmail: f.client_email || '',
    clientAddress: f.client_address || undefined,
    lines: lines.map((l) => ({
      designation: l.designation,
      qty: l.qty,
      unitPrice: l.unitPrice,
    })),
    totalHt: Number(f.total_ht) || 0,
    vatBreakdown,
    totalTtc,
    validityDays: 30,
    note,
    docType: 'facture',
    // Coordonnées bancaires inutiles sur une facture déjà acquittée.
    rib: isPaid ? undefined : org.rib,
    issuer: {
      email: org.contactEmail,
      phone: org.contactPhone,
      address: org.address,
      siret: org.siret,
      tva: org.tva,
    },
  })

  res.status(200).json({ ok: true, pdf: Buffer.from(pdf).toString('base64') })
}
