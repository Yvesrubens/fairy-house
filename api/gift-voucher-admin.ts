// Bons cadeaux — actions admin : régénérer le PDF d'un bon (« pdf ») ou le
// renvoyer par e-mail à l'acheteur (« resend »). Réservé aux admins.
import { createClient } from '@supabase/supabase-js'
import { buildGiftPdf } from './_lib/gift.js'
import { sendGiftVoucher } from './_lib/gift-send.js'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string

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
  const { voucherId, action } = body
  if (!voucherId || !['pdf', 'resend'].includes(action)) {
    res.status(400).json({ error: 'Paramètres invalides' })
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

  const { data: v } = await supabase.from('gift_vouchers').select('*').eq('id', voucherId).maybeSingle()
  if (!v) {
    res.status(404).json({ error: 'Bon introuvable' })
    return
  }
  if (v.status !== 'active' || !v.expires_at) {
    res.status(400).json({ error: "Ce bon n'est pas actif (paiement non confirmé ou annulé)." })
    return
  }

  if (action === 'pdf') {
    const pdf = await buildGiftPdf(v)
    res.status(200).json({ ok: true, pdf: Buffer.from(pdf).toString('base64') })
    return
  }

  const ok = await sendGiftVoucher(v)
  if (!ok) {
    res.status(502).json({ error: "L'envoi de l'e-mail a échoué." })
    return
  }
  await supabase.from('gift_vouchers').update({ sent_at: new Date().toISOString() }).eq('id', voucherId)
  res.status(200).json({ ok: true })
}
