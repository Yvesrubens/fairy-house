// Envoi d'un bon cadeau : PDF en pièce jointe à l'acheteur, et (à la vente)
// notification interne à la Fairy House. Utilisé par le webhook Stripe et par
// le renvoi depuis l'admin.
import { buildGiftPdf, giftAdminEmail, giftBuyerEmail } from './gift.js'
import type { GiftVoucherData } from './gift.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

async function resend(payload: Record<string, unknown>): Promise<boolean> {
  if (!RESEND_API_KEY || !RESEND_FROM) return false
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, ...payload }),
  })
  return r.ok
}

export async function sendGiftVoucher(
  v: GiftVoucherData & { buyer_email: string },
  opts: { notifyAdminTo?: string } = {},
): Promise<boolean> {
  const pdf = await buildGiftPdf(v)
  const mail = giftBuyerEmail(v)
  const ok = await resend({
    to: [v.buyer_email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: [{ filename: `Bon-cadeau-${v.code}.pdf`, content: Buffer.from(pdf).toString('base64') }],
  })
  if (opts.notifyAdminTo) {
    const n = giftAdminEmail(v)
    await resend({ to: [opts.notifyAdminTo], subject: n.subject, html: n.html }).catch(() => false)
  }
  return ok
}
