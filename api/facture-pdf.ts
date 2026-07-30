// Fonction serverless Vercel : régénère le PDF d'une facture déjà émise (à
// partir des données stockées), pour visualisation/récupération au back-office
// (point 12). Réservée aux admins.
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf } from './_lib/devis-pdf.js'
import { fetchOrgSettings } from './_lib/org-settings.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string

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
  const rates = [...new Set(lines.map((l) => l.vatRate || 20))]
  const vatBreakdown = rates
    .map((rate) => {
      const ht = lines
        .filter((l) => (l.vatRate || 20) === rate)
        .reduce((s, l) => s + l.qty * l.unitPrice, 0)
      return { rate, ht: round2(ht), vat: round2((ht * rate) / 100) }
    })
    .filter((g) => g.ht > 0)

  const pdf = await buildDevisPdf({
    reference: f.reference,
    reservationRef: f.reference,
    clientName: f.client_name || '',
    clientEmail: f.client_email || '',
    lines: lines.map((l) => ({
      designation: l.designation,
      qty: l.qty,
      unitPrice: l.unitPrice,
    })),
    totalHt: Number(f.total_ht) || 0,
    vatBreakdown,
    totalTtc: Number(f.total_ttc) || 0,
    validityDays: 30,
    docType: 'facture',
    rib: org.rib,
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
