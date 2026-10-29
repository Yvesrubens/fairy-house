// Templates des mails « cycle de vie » envoyés par le cron quotidien :
//  - préparation du séjour (J-2)
//  - satisfaction / remerciements (J+2)
//  - relance de paiement (solde, paiement en 2 fois)
// Fonctions pures. Les données événement et les liens externes sont passés par
// l'appelant (api/cron-emails.ts).

const CONTACT = {
  email: 'contact@fairyhousecollectif.com',
  phone: '06 71 39 88 07',
  address: '2 Le Grand Leu, 45230 La Chapelle-sur-Aveyron',
}
const ITINERAIRE =
  'https://www.google.com/maps/dir/?api=1&destination=' +
  encodeURIComponent('Le Grand Leu, 45230 La Chapelle-sur-Aveyron')
const INSTAGRAM = 'https://www.instagram.com/fairyhouse.collectif/'

export interface LifecycleLinks {
  satisfactionForm?: string
  googleReview?: string
  newsletter?: string
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function euro(n: number): string {
  return `${Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
function firstName(full: string | null | undefined): string {
  return String(full || '').trim().split(/\s+/)[0] || ''
}

const H2 = 'margin:26px 0 10px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#c79c37'
const P = 'color:#333;font-size:14px;line-height:1.6'

function shell(bodyHtml: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#c79c37;padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px">FAIRY HOUSE</h1>
    </div>
    <div style="padding:28px">${bodyHtml}</div>
    <div style="background:#111;padding:16px;text-align:center;color:#888;font-size:12px">
      Aurélie — Fairy House Collectif · ${CONTACT.phone} · ${CONTACT.email}
    </div>
  </div>`
}

// ----------------------------------------------------------------- J-2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prepEmail(r: any, consignes?: string | null) {
  const prenom = firstName(r.client_name)
  const aApporter = (consignes || '').trim()
    ? `<p style="${P};white-space:pre-line">${consignes!.trim()}</p>`
    : `<p style="${P}">Quelques rappels concernant les prestations :</p>
       <ul style="margin:0;padding-left:18px;${P}">
         <li>Linge de lit : fourni si tu as sélectionné cette option.</li>
         <li>Repas : les courses et prestations associées sont prévues selon les options choisies.</li>
         <li>Pour les événements : pense à vérifier les consignes spécifiques communiquées pour ton atelier ou ton séjour.</li>
       </ul>
       <p style="${P}">Si tu souhaites ajouter une prestation, merci de nous le communiquer au plus vite par mail ou téléphone.</p>`

  const body = `
    <p style="font-size:16px">Bonjour ${prenom},</p>
    <p style="${P}">Plus que deux jours avant ton arrivée à la Fairy House ! 🌿</p>
    <p style="${P}">Voici les dernières informations pratiques pour que tu puisses préparer tranquillement ta venue.</p>

    <h2 style="${H2}">📍 Où nous retrouver ?</h2>
    <p style="${P}">Fairy House Collectif, ${CONTACT.address}<br/>
      Itinéraire : <a href="${ITINERAIRE}" style="color:#c79c37">ouvrir dans Google Maps</a></p>

    <h2 style="${H2}">🕰️ Horaires d'arrivée et de départ</h2>
    <p style="${P}">Arrivée sur le lieu : à partir de 12 h<br/>
      Chambre disponible à partir de 16 h<br/>
      Départ de la chambre : avant 11 h<br/>
      Départ du lieu : avant 15 h</p>
    <p style="${P}">Je t'accueillerai personnellement. Si tu prévois d'arriver à un horaire inhabituel, merci de me prévenir en amont.</p>

    <h2 style="${H2}">🎒 Qu'est-ce qu'il faut apporter ?</h2>
    ${aApporter}

    <h2 style="${H2}">💬 Un imprévu sur la route ?</h2>
    <p style="${P}">Tu peux me contacter : Aurélie — ${CONTACT.phone} · ${CONTACT.email}<br/>
      Pour toute urgence mettant une personne en danger immédiat, contacte les services d'urgence au 112.</p>

    <p style="margin-top:24px;color:#333">À très vite,<br/><strong>Aurélie</strong></p>`

  return {
    subject: 'J-2 : on prépare ton séjour à la Fairy House',
    html: shell(body),
    text: `Bonjour ${prenom},\n\nPlus que deux jours avant ton arrivée à la Fairy House !\n\nAdresse : ${CONTACT.address}\nItinéraire : ${ITINERAIRE}\nArrivée dès 12 h · chambre dès 16 h · départ chambre avant 11 h · départ lieu avant 15 h.\n\nÀ apporter : ${(consignes || '').trim() || 'voir les prestations choisies (linge si sélectionné, repas selon options).'}\n\nContact : Aurélie — ${CONTACT.phone} · ${CONTACT.email}\nUrgence : 112\n\nÀ très vite, Aurélie`,
  }
}

// ----------------------------------------------------------------- J+2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function satisfactionEmail(r: any, links: LifecycleLinks) {
  const prenom = firstName(r.client_name)
  const form = links.satisfactionForm
  const review = links.googleReview
  const news = links.newsletter

  const body = `
    <p style="font-size:16px">Bonjour ${prenom},</p>
    <p style="${P}">Merci d'être venu·e à la Fairy House ! 💛</p>
    <p style="${P}">Que tu sois venu·e pour te reposer, créer, rencontrer d'autres personnes ou participer à un événement, j'espère que tu as passé un beau moment ici.</p>
    <p style="${P}">La Fairy House est un lieu qui évolue au fil des accueils et des rencontres. Ton retour m'aide concrètement à améliorer l'expérience.</p>

    ${form ? `<p style="text-align:center;margin:22px 0">
        <a href="${form}" style="background:#c79c37;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">Partager mon ressenti</a>
      </p>
      <p style="${P}">Quelques réponses suffisent : ce que tu as aimé, ce qui pourrait être amélioré, et ce que tu aimerais retrouver lors d'une prochaine visite.</p>`
      : `<p style="${P}">Si tu as quelques minutes, réponds simplement à ce mail pour partager ton ressenti : ce que tu as aimé, ce qui pourrait être amélioré.</p>`}

    ${review ? `<p style="${P}">Si tu souhaites partager ton expérience publiquement, tu peux laisser un avis ici : <a href="${review}" style="color:#c79c37">laisser un avis Google</a>.</p>` : ''}

    <p style="${P}">Pour suivre les prochains ateliers, résidences et événements : <a href="${INSTAGRAM}" style="color:#c79c37">Instagram</a>${news ? ` ou <a href="${news}" style="color:#c79c37">inscris-toi à la newsletter</a>` : ''}.</p>

    <p style="${P}">Merci encore pour ta confiance et d'avoir contribué à faire vivre cette bulle hors du temps.</p>
    <p style="margin-top:24px;color:#333">Au plaisir de te retrouver,<br/><strong>Aurélie</strong></p>`

  return {
    subject: 'Merci pour ton passage à la Fairy House',
    html: shell(body),
    text: `Bonjour ${prenom},\n\nMerci d'être venu·e à la Fairy House !\n\nTon retour m'aide à améliorer l'expérience.${form ? `\nQuestionnaire : ${form}` : ' Réponds simplement à ce mail.'}${review ? `\nAvis Google : ${review}` : ''}\nInstagram : ${INSTAGRAM}${news ? `\nNewsletter : ${news}` : ''}\n\nAu plaisir de te retrouver, Aurélie`,
  }
}

// -------------------------------------------------- Relance paiement (2 fois)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reminderEmail(r: any) {
  const prenom = firstName(r.client_name)
  const solde = Number(r.balance_amount ?? 0)
  const body = `
    <p style="font-size:16px">Bonjour ${prenom},</p>
    <p style="${P}">Un petit rappel concernant ta réservation à la Fairy House (référence ${r.reference}).</p>
    <p style="${P}">Comme convenu lors de ta réservation en 2 fois, le solde est à régler prochainement :</p>
    <table style="width:100%;border-collapse:collapse;margin:14px 0">
      <tr><td style="padding:5px 0;color:#666;font-size:14px">Solde restant</td><td style="padding:5px 0;font-weight:600;font-size:14px;text-align:right">${euro(solde)}</td></tr>
      <tr><td style="padding:5px 0;color:#666;font-size:14px">À régler avant le</td><td style="padding:5px 0;font-weight:600;font-size:14px;text-align:right">${fmtDate(r.balance_due_date)}</td></tr>
    </table>
    <p style="${P}">Pour toute question sur les modalités de paiement, réponds directement à ce mail ou contacte-moi : Aurélie — ${CONTACT.phone} · ${CONTACT.email}.</p>
    <p style="${P}">Si tu as déjà effectué le règlement, merci de ne pas tenir compte de ce message.</p>
    <p style="margin-top:24px;color:#333">Merci et à très vite,<br/><strong>Aurélie</strong></p>`

  return {
    subject: `Rappel : solde de ta réservation à la Fairy House (${r.reference})`,
    html: shell(body),
    text: `Bonjour ${prenom},\n\nRappel pour ta réservation ${r.reference} (paiement en 2 fois).\nSolde restant : ${euro(solde)}\nÀ régler avant le : ${fmtDate(r.balance_due_date)}\n\nUne question ? Aurélie — ${CONTACT.phone} · ${CONTACT.email}\nSi le règlement est déjà fait, ne pas tenir compte de ce message.\n\nMerci, Aurélie`,
  }
}
