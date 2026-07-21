const CONTACT = {
  email: 'contact@fairyhousecollectif.com',
  phone: '+33 1 23 45 67 89',
  address: 'Le Grand Leu, 45230 La Chapelle sur Aveyron',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const ACCOMMODATION_LABELS: Record<string, string> = {
  tente: 'En tente',
  chambre: 'Chambre mixte partagée',
  aucun: 'Sans hébergement',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function confirmationEmail(r: any): { html: string; text: string } {
  const isEvent = Boolean(r.event_id)
  const amountLine =
    Number(r.amount) > 0
      ? `<tr><td style="padding:6px 0;color:#555">Montant</td><td style="padding:6px 0;font-weight:600">${Number(
          r.amount,
        ).toLocaleString('fr-FR')} €</td></tr>`
      : ''

  const intro = isEvent
    ? "Nous avons le plaisir de confirmer votre inscription à l'événement. Merci de votre confiance — nous avons hâte de vous y accueillir."
    : 'Nous avons le plaisir de confirmer votre réservation à la Fairy House. Merci de votre confiance — nous avons hâte de vous accueillir dans notre sanctuaire de reconnexion.'

  const recapRows = isEvent
    ? `
          <tr><td style="padding:6px 0;color:#555">Référence</td><td style="padding:6px 0;font-weight:600">${r.reference}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Événement</td><td style="padding:6px 0;font-weight:600">${r.type}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Date</td><td style="padding:6px 0;font-weight:600">${fmtDate(r.arrival_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Hébergement</td><td style="padding:6px 0;font-weight:600">${ACCOMMODATION_LABELS[r.accommodation_choice] ?? '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Navette</td><td style="padding:6px 0;font-weight:600">${r.shuttle ? 'Oui' : 'Non'}</td></tr>
          ${amountLine}`
    : `
          <tr><td style="padding:6px 0;color:#555">Référence</td><td style="padding:6px 0;font-weight:600">${r.reference}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Type d'hébergement</td><td style="padding:6px 0;font-weight:600">${r.type}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Arrivée</td><td style="padding:6px 0;font-weight:600">${fmtDate(r.arrival_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Départ</td><td style="padding:6px 0;font-weight:600">${fmtDate(r.departure_date)}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Personnes</td><td style="padding:6px 0;font-weight:600">${r.guests ?? '—'}</td></tr>
          ${amountLine}`

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:28px">
      <p style="font-size:16px">Bonjour ${r.client_name},</p>
      <p style="line-height:1.6;color:#333">${intro}</p>
      <div style="background:#f7f5ef;border:1px solid #e0dcd1;border-radius:12px;padding:20px;margin:24px 0">
        <h2 style="margin:0 0 12px;font-size:16px;color:#c79c37">Récapitulatif</h2>
        <table style="width:100%;font-size:14px;border-collapse:collapse">${recapRows}
        </table>
      </div>
      <p style="line-height:1.6;color:#333">
        Pour toute question, nous restons à votre disposition :
      </p>
      <p style="line-height:1.6;color:#333;font-size:14px">
        ✉️ ${CONTACT.email}<br/>
        ☎️ ${CONTACT.phone}<br/>
        📍 ${CONTACT.address}
      </p>
      <p style="margin-top:24px;color:#333">Avec toute notre douceur,<br/><strong>L'équipe Fairy House</strong></p>
    </div>
    <div style="background:#111;padding:16px;text-align:center;color:#888;font-size:12px">
      © 2026 Fairy House — Un lieu de reconnexion au corps, à l'intime et à la créativité.
    </div>
  </div>`

  const textRecap = isEvent
    ? `Référence : ${r.reference}
Événement : ${r.type}
Date : ${fmtDate(r.arrival_date)}
Hébergement : ${ACCOMMODATION_LABELS[r.accommodation_choice] ?? '—'}
Navette : ${r.shuttle ? 'Oui' : 'Non'}`
    : `Référence : ${r.reference}
Type : ${r.type}
Arrivée : ${fmtDate(r.arrival_date)}
Départ : ${fmtDate(r.departure_date)}
Personnes : ${r.guests ?? '—'}`

  const text = `Bonjour ${r.client_name},

${isEvent ? "Nous confirmons votre inscription à l'événement." : 'Nous confirmons votre réservation à la Fairy House.'}

${textRecap}
${Number(r.amount) > 0 ? `Montant : ${Number(r.amount).toLocaleString('fr-FR')} €\n` : ''}
Contact : ${CONTACT.email} · ${CONTACT.phone}
${CONTACT.address}

L'équipe Fairy House`

  return { html, text }
}
