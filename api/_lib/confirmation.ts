// Génère les mails de confirmation (séjour classique / événement) envoyés à la
// réservation. Fonction pure (aucun accès base) : les données événement sont
// passées par l'appelant (api/book.ts, api/send-confirmation.ts).

const CONTACT = {
  email: 'contact@fairyhousecollectif.com',
  phone: '06 71 39 88 07',
  address: '2 Le Grand Leu, 45230 La Chapelle-sur-Aveyron',
}
const CGV_URL = 'https://www.fairyhousecollectif.com/cgv'

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function euro(n: number): string {
  return `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function firstName(full: string | null | undefined): string {
  return String(full || '').trim().split(/\s+/)[0] || ''
}

function nights(arrival: string | null, departure: string | null): number {
  if (!arrival || !departure) return 0
  const a = Date.parse(arrival.slice(0, 10) + 'T00:00:00Z')
  const d = Date.parse(departure.slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(d) || d <= a) return 0
  return Math.round((d - a) / 86_400_000)
}

export interface EventInfo {
  title?: string | null
  event_date?: string | null
  event_end_date?: string | null
  intervenants?: string | null
  email_consignes?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function payment(r: any) {
  const total = Number(r.total_ttc ?? r.amount ?? 0)
  const isSplit = r.payment_plan === 'split'
  let paid = 0
  if (isSplit) paid = Number(r.deposit_amount ?? 0)
  else if (r.payment_method === 'cb') paid = total
  const solde = Math.max(0, round2(total - paid))
  let modalite = r.payment_method === 'virement' ? 'Virement' : r.payment_method === 'cb' ? 'Carte bancaire' : '—'
  if (isSplit) modalite += ' — paiement en 2 fois'
  return { total, paid, solde, isSplit, modalite, dueDate: r.balance_due_date as string | null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function optionLabels(r: any): string[] {
  const o = r.options || {}
  const out: string[] = []
  if (o.linge) out.push('Linge de maison')
  if (o.pension) out.push('Pension complète')
  if (r.shuttle || o.navette) out.push('Navette')
  return out
}

const H2 = 'margin:28px 0 10px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#c79c37'
const TD_K = 'padding:5px 0;color:#666;font-size:14px'
const TD_V = 'padding:5px 0;font-weight:600;font-size:14px;text-align:right'

function row(k: string, v: string): string {
  return `<tr><td style="${TD_K}">${k}</td><td style="${TD_V}">${v}</td></tr>`
}

function shell(bodyHtml: string, c: typeof CONTACT): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:28px">
      ${bodyHtml}
    </div>
    <div style="background:#111;padding:16px;text-align:center;color:#888;font-size:12px">
      Aurélie — Fairy House Collectif · ${c.phone} · ${c.email}
    </div>
  </div>`
}

function recapTable(p: ReturnType<typeof payment>): string {
  const soldeRows = p.solde > 0
    ? row('Reste à régler', euro(p.solde)) +
      (p.isSplit && p.dueDate ? row('Échéance du solde', fmtDate(p.dueDate)) : '')
    : ''
  return `<table style="width:100%;border-collapse:collapse">
    ${row('Prix total', euro(p.total))}
    ${row('Montant déjà réglé', euro(p.paid))}
    ${soldeRows}
    ${row('Modalité de paiement', p.modalite)}
  </table>`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stayEmail(r: any, c: typeof CONTACT): { subject: string; html: string; text: string } {
  const prenom = firstName(r.client_name)
  const p = payment(r)
  const n = nights(r.arrival_date, r.departure_date)
  const opts = optionLabels(r)

  const optsBlock = opts.length
    ? `<h2 style="${H2}">Prestations choisies</h2>
       <ul style="margin:0;padding-left:18px;color:#333;font-size:14px;line-height:1.7">
         ${opts.map((o) => `<li>${o}</li>`).join('')}
       </ul>
       <p style="color:#777;font-size:13px">Ce récapitulatif précise les prestations sélectionnées lors de ta réservation.</p>`
    : ''

  const body = `
    <p style="font-size:16px">Bonjour ${prenom},</p>
    <p style="line-height:1.6;color:#333">Bonne nouvelle : ta réservation à la Fairy House est confirmée ! ✨</p>
    <p style="line-height:1.6;color:#333">Nous sommes ravi·es de t'accueillir bientôt dans ce lieu pensé pour faire une pause, se retrouver et laisser place à l'inspiration.</p>

    <h2 style="${H2}">Ton séjour</h2>
    <table style="width:100%;border-collapse:collapse">
      ${row('Référence', r.reference)}
      ${row('Arrivée', fmtDate(r.arrival_date))}
      ${row('Départ', fmtDate(r.departure_date))}
      ${row('Durée', `${n} nuit${n > 1 ? 's' : ''}`)}
      ${row('Nombre de personnes', String(r.guests ?? '—'))}
    </table>

    <h2 style="${H2}">Ton récapitulatif</h2>
    ${recapTable(p)}

    ${optsBlock}

    <h2 style="${H2}">Préparer ton arrivée</h2>
    <p style="color:#333;font-size:14px;line-height:1.6">📍 <strong>Adresse</strong><br/>Fairy House Collectif, ${c.address}</p>
    <p style="color:#333;font-size:14px;line-height:1.6">🕰️ <strong>Horaires</strong><br/>
      Arrivée sur le lieu : à partir de 12 h<br/>
      Accès à ta chambre : à partir de 16 h<br/>
      Départ de la chambre : avant 11 h<br/>
      Départ du lieu : avant 15 h</p>
    <p style="color:#333;font-size:14px;line-height:1.6">Je t'accueillerai personnellement à ton arrivée. Nous te transmettrons les informations complémentaires nécessaires si besoin.</p>

    <h2 style="${H2}">Une question avant de venir ?</h2>
    <p style="color:#333;font-size:14px;line-height:1.6">Tu peux répondre directement à ce mail ou me contacter :<br/>
      Aurélie — ${c.phone} · ${c.email}</p>
    <p style="color:#333;font-size:14px;line-height:1.6">Tu peux retrouver les conditions de réservation et d'annulation ici : <a href="${CGV_URL}" style="color:#c79c37">${CGV_URL}</a></p>

    <p style="margin-top:24px;color:#333">Au plaisir de t'accueillir à la Fairy House !<br/>À bientôt,<br/><strong>Aurélie</strong></p>`

  const text = `Bonjour ${prenom},

Ta réservation à la Fairy House est confirmée !

TON SÉJOUR
Référence : ${r.reference}
Arrivée : ${fmtDate(r.arrival_date)}
Départ : ${fmtDate(r.departure_date)}
Durée : ${n} nuit(s)
Personnes : ${r.guests ?? '—'}

TON RÉCAPITULATIF
Prix total : ${euro(p.total)}
Montant déjà réglé : ${euro(p.paid)}${p.solde > 0 ? `\nReste à régler : ${euro(p.solde)}${p.isSplit && p.dueDate ? `\nÉchéance du solde : ${fmtDate(p.dueDate)}` : ''}` : ''}
Modalité : ${p.modalite}
${opts.length ? `\nPRESTATIONS CHOISIES\n- ${opts.join('\n- ')}\n` : ''}
PRÉPARER TON ARRIVÉE
${c.address}
Arrivée : à partir de 12 h · Chambre : à partir de 16 h · Départ chambre : avant 11 h · Départ lieu : avant 15 h

Contact : Aurélie — ${c.phone} · ${c.email}
CGV : ${CGV_URL}

À bientôt, Aurélie — Fairy House Collectif`

  return {
    subject: 'Ta réservation à la Fairy House est confirmée !',
    html: shell(body, c),
    text,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eventEmail(r: any, c: typeof CONTACT, ev: EventInfo): { subject: string; html: string; text: string } {
  const prenom = firstName(r.client_name)
  const p = payment(r)
  const titre = ev.title || r.type || 'ton événement'
  const consignes = (ev.email_consignes || '').trim()

  const body = `
    <p style="font-size:16px">Bonjour ${prenom},</p>
    <p style="line-height:1.6;color:#333">Ton inscription à <strong>${titre}</strong> à la Fairy House est confirmée ! ✨</p>
    <p style="line-height:1.6;color:#333">Nous sommes ravi·es de t'accueillir pour cette expérience. Voici les informations essentielles pour préparer ta venue.</p>

    <h2 style="${H2}">Ton événement</h2>
    <table style="width:100%;border-collapse:collapse">
      ${row('Événement', titre)}
      ${ev.intervenants ? row('Intervenant·e(s)', ev.intervenants) : ''}
      ${row('Début', fmtDate(ev.event_date ?? r.arrival_date))}
      ${ev.event_end_date ? row('Fin', fmtDate(ev.event_end_date)) : ''}
      ${row("Référence d'inscription", r.reference)}
    </table>

    <h2 style="${H2}">Ton récapitulatif</h2>
    ${recapTable(p)}

    <h2 style="${H2}">Ce qui est inclus dans ton inscription</h2>
    <ul style="margin:0;padding-left:18px;color:#333;font-size:14px;line-height:1.7">
      <li>Hébergement à la Fairy House</li>
      <li>Pension complète</li>
      <li>Linge de maison</li>
      <li>Les ateliers et activités prévus dans le descriptif de l'événement</li>
    </ul>

    <h2 style="${H2}">Préparer ta venue</h2>
    <p style="color:#333;font-size:14px;line-height:1.6">📍 <strong>Adresse</strong><br/>Fairy House Collectif, ${c.address}</p>
    <p style="color:#333;font-size:14px;line-height:1.6">Arrivée : à partir de 16 h · Départ : au plus tard à 16 h.<br/>
      Si tu souhaites arriver ou partir en dehors de ces horaires, indique-le par retour de mail afin de connaître nos conditions.</p>
    <p style="color:#333;font-size:14px;line-height:1.6">🚗 <strong>Covoiturage</strong><br/>Nous t'invitons à privilégier le covoiturage pour rejoindre la Fairy House, le nombre de places de stationnement étant limité. Tu recevras une invitation à rejoindre un groupe WhatsApp créé à cet effet.</p>

    ${consignes
      ? `<h2 style="${H2}">🧳 À apporter et informations pratiques</h2>
         <p style="color:#333;font-size:14px;line-height:1.6;white-space:pre-line">${consignes}</p>`
      : ''}

    <h2 style="${H2}">🥗 Allergies, alimentation et besoins particuliers</h2>
    <p style="color:#333;font-size:14px;line-height:1.6">Si tu as des allergies, des contraintes alimentaires ou des besoins particuliers (accessibilité, accueil), indique-le en répondant directement à ce mail. Nous pourrons ainsi anticiper au mieux ton séjour.</p>

    <h2 style="${H2}">Une question ?</h2>
    <p style="color:#333;font-size:14px;line-height:1.6">Aurélie — ${c.phone} · ${c.email}<br/>
      Conditions de réservation et d'annulation : <a href="${CGV_URL}" style="color:#c79c37">${CGV_URL}</a></p>

    <p style="margin-top:24px;color:#333">J'ai hâte de t'accueillir pour ce moment à la Fairy House !<br/>À bientôt,<br/><strong>Aurélie</strong></p>`

  const text = `Bonjour ${prenom},

Ton inscription à ${titre} à la Fairy House est confirmée !

TON ÉVÉNEMENT
Événement : ${titre}${ev.intervenants ? `\nIntervenant·e(s) : ${ev.intervenants}` : ''}
Début : ${fmtDate(ev.event_date ?? r.arrival_date)}${ev.event_end_date ? `\nFin : ${fmtDate(ev.event_end_date)}` : ''}
Référence : ${r.reference}

TON RÉCAPITULATIF
Prix total : ${euro(p.total)}
Montant déjà réglé : ${euro(p.paid)}${p.solde > 0 ? `\nReste à régler : ${euro(p.solde)}${p.isSplit && p.dueDate ? `\nÉchéance : ${fmtDate(p.dueDate)}` : ''}` : ''}
Modalité : ${p.modalite}

INCLUS : hébergement, pension complète, linge de maison, ateliers/activités prévus.
${consignes ? `\nÀ APPORTER\n${consignes}\n` : ''}
Arrivée à partir de 16 h · Départ au plus tard 16 h. Covoiturage conseillé.

Contact : Aurélie — ${c.phone} · ${c.email}
CGV : ${CGV_URL}

À bientôt, Aurélie — Fairy House Collectif`

  return {
    subject: `Ton inscription à ${titre} est confirmée !`,
    html: shell(body, c),
    text,
  }
}

/**
 * Mail de confirmation. `event` doit être fourni par l'appelant pour une
 * réservation d'événement (r.event_id non nul).
 */
export function confirmationEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any,
  contact?: Partial<typeof CONTACT>,
  event?: EventInfo | null,
): { subject: string; html: string; text: string } {
  const c = { ...CONTACT, ...(contact ?? {}) }
  const isEvent = Boolean(r.event_id)
  return isEvent ? eventEmail(r, c, event ?? {}) : stayEmail(r, c)
}
