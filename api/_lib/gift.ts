// Bons cadeaux : numéro, validation du montant, PDF du bon et e-mails.
// Le PDF est généré dans la charte (cadre doré, crème). Quand le modèle
// graphique officiel sera fourni, il suffira d'écrire les champs dessus.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { safe } from './devis-pdf.js'
import { euros, fmtDateFr } from './gift-core.js'

export {
  GIFT_MAX,
  GIFT_MIN,
  euros,
  expiryFrom,
  fmtDateFr,
  newGiftCode,
  parseGiftAmount,
} from './gift-core.js'

export const SITE_URL = 'https://www.fairyhousecollectif.com'

export interface GiftVoucherData {
  code: string
  amount: number
  buyer_name: string
  recipient_name: string | null
  message: string | null
  expires_at: string
}

const CREAM = rgb(0.99, 0.97, 0.93)
const GOLD = rgb(0.78, 0.61, 0.21)
const BROWN = rgb(0.33, 0.18, 0.1)
const GREY = rgb(0.4, 0.36, 0.32)

/** PDF du bon cadeau (A4 paysage). */
export async function buildGiftPdf(v: GiftVoucherData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([842, 595])
  const { width, height } = page.getSize()
  const sans = await doc.embedFont(StandardFonts.Helvetica)
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic)
  const serif = await doc.embedFont(StandardFonts.TimesRomanItalic)

  type Font = typeof sans
  const center = (s: string, y: number, size: number, font: Font, color = BROWN) => {
    const t = safe(s)
    const w = font.widthOfTextAtSize(t, size)
    page.drawText(t, { x: (width - w) / 2, y, size, font, color })
  }
  const wrap = (s: string, font: Font, size: number, maxW: number, maxLines: number) => {
    const words = safe(s).split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w
      if (font.widthOfTextAtSize(next, size) > maxW && cur) {
        lines.push(cur)
        cur = w
      } else cur = next
    }
    if (cur) lines.push(cur)
    if (lines.length > maxLines) {
      lines.length = maxLines
      lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'
    }
    return lines
  }

  // Fond crème + double cadre doré
  page.drawRectangle({ x: 0, y: 0, width, height, color: CREAM })
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: GOLD, borderWidth: 2 })
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: GOLD, borderWidth: 0.7 })

  // Logo (récupéré sur le site ; il contient déjà « Le Sanctuaire de vos
  // Inspirations »). Repli texte s'il est indisponible.
  let top = height - 70
  let logoOk = false
  try {
    const res = await fetch(`${SITE_URL}/logo-clair-bg.png`)
    if (res.ok) {
      const img = await doc.embedPng(new Uint8Array(await res.arrayBuffer()))
      const h = 62
      const w = (img.width / img.height) * h
      page.drawImage(img, { x: (width - w) / 2, y: height - 52 - h, width: w, height: h })
      top = height - 52 - h - 22
      logoOk = true
    }
  } catch {
    /* repli ci-dessous */
  }
  if (!logoOk) {
    center('FAIRY HOUSE', top, 22, sansBold, BROWN)
    top -= 24
    center('Le Sanctuaire de vos Inspirations', top, 11, serif, GREY)
  }

  // Titre
  center('Bon Cadeau', top - 64, 54, serifItalic, BROWN)
  page.drawLine({ start: { x: width / 2 - 120, y: top - 82 }, end: { x: width / 2 + 120, y: top - 82 }, thickness: 1, color: GOLD })

  // Bénéficiaire / acheteur
  let y = top - 114
  if (v.recipient_name) {
    center(`Offert à ${v.recipient_name}`, y, 18, serifItalic, BROWN)
    y -= 24
  }
  center(`De la part de ${v.buyer_name}`, y, 13, serif, GREY)
  y -= 26

  // Message
  if (v.message && v.message.trim()) {
    for (const l of wrap(`« ${v.message.trim()} »`, serif, 12, width - 260, 3)) {
      center(l, y, 12, serif, BROWN)
      y -= 16
    }
    y -= 6
  }

  // Montant
  // Juste sous le message, sans descendre sur le numéro du bon.
  center(euros(v.amount), Math.max(190, y - 40), 40, sansBold, GOLD)

  // Numéro + validité
  const infoY = 150
  center(`N° du bon : ${v.code}`, infoY, 13, sansBold, BROWN)
  center(`Valable jusqu'au ${fmtDateFr(v.expires_at)}`, infoY - 18, 11, sans, GREY)

  // Conditions
  const cond =
    "Valable sur les séjours, stages et événements de la Fairy House, en une ou plusieurs fois, " +
    "jusqu'à la date indiquée. Non remboursable, non échangeable contre des espèces. " +
    'Pour réserver, communiquez ce numéro à contact@fairyhousecollectif.com · 06 71 39 88 07.'
  let cy = 96
  for (const l of wrap(cond, sans, 8.5, width - 200, 3)) {
    center(l, cy, 8.5, sans, GREY)
    cy -= 11
  }
  center('Fairy House Collectif — 2 Le Grand Leu, 45230 La Chapelle-sur-Aveyron', 50, 8, sans, GREY)

  return doc.save()
}

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

/** E-mail à l'acheteur (le bon PDF est en pièce jointe). */
export function giftBuyerEmail(v: GiftVoucherData) {
  const pour = v.recipient_name ? ` pour ${esc(v.recipient_name)}` : ''
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:28px">
      <p style="font-size:16px">Bonjour ${esc(v.buyer_name.split(/\s+/)[0] || v.buyer_name)},</p>
      <p style="line-height:1.6;color:#333">Merci pour votre achat ! ✨ Vous trouverez ci-joint votre bon cadeau${pour}, prêt à être offert.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">
        <tr><td style="padding:5px 0;color:#666">Numéro du bon</td><td style="padding:5px 0;font-weight:600;text-align:right">${esc(v.code)}</td></tr>
        <tr><td style="padding:5px 0;color:#666">Montant</td><td style="padding:5px 0;font-weight:600;text-align:right">${euros(v.amount)}</td></tr>
        <tr><td style="padding:5px 0;color:#666">Valable jusqu'au</td><td style="padding:5px 0;font-weight:600;text-align:right">${fmtDateFr(v.expires_at)}</td></tr>
      </table>
      <p style="line-height:1.6;color:#333">Pour l'utiliser, le ou la bénéficiaire nous contacte en indiquant le numéro du bon : il est valable sur les séjours, stages et événements de la Fairy House, en une ou plusieurs fois.</p>
      <p style="line-height:1.6;color:#333">Une question ? Aurélie — 06 71 39 88 07 · contact@fairyhousecollectif.com</p>
      <p style="margin-top:24px;color:#333">Belle journée,<br/><strong>Aurélie — Fairy House</strong></p>
    </div>
  </div>`
  const text = `Bonjour,\n\nMerci pour votre achat ! Votre bon cadeau${v.recipient_name ? ` pour ${v.recipient_name}` : ''} est en pièce jointe.\n\nNuméro : ${v.code}\nMontant : ${euros(v.amount)}\nValable jusqu'au : ${fmtDateFr(v.expires_at)}\n\nPour l'utiliser, le ou la bénéficiaire nous contacte avec ce numéro (séjours, stages, événements ; en une ou plusieurs fois).\nAurélie — 06 71 39 88 07 · contact@fairyhousecollectif.com`
  return { subject: 'Votre bon cadeau Fairy House', html, text }
}

/** Notification interne (Aurélie) : un bon vient d'être vendu. */
export function giftAdminEmail(v: GiftVoucherData & { buyer_email: string }) {
  const html = `<p>Nouveau bon cadeau vendu sur le site :</p>
  <ul>
    <li>Numéro : <strong>${esc(v.code)}</strong></li>
    <li>Montant : ${euros(v.amount)}</li>
    <li>Acheteur : ${esc(v.buyer_name)} (${esc(v.buyer_email)})</li>
    ${v.recipient_name ? `<li>Bénéficiaire : ${esc(v.recipient_name)}</li>` : ''}
    <li>Valable jusqu'au ${fmtDateFr(v.expires_at)}</li>
  </ul>
  <p>Retrouvez-le dans l'admin → Bons cadeaux.</p>`
  return { subject: `Bon cadeau vendu — ${v.code} (${euros(v.amount)})`, html }
}
