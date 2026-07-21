// Tarification des inscriptions à un événement. Les prix sont saisis TTC
// (TVA incluse) ; la TVA est rétro-calculée et détaillée par taux pour la
// facture. Deux taux coexistent : 20 % sur la part animation/événement,
// 10 % sur l'hébergement/pension et la navette (transport de personnes).
// Module pur, sans effet de bord (voir eventPricing.test.ts).

export const EVENT_VAT = 20
export const ACCOMMODATION_VAT = 10
export const SHUTTLE_VAT = 10
export const DEFAULT_SHUTTLE_TTC = 15

// Textes par défaut, surchargeables par événement en admin.
export const DEFAULT_REGLEMENT =
  "Je reconnais avoir pris connaissance et accepter le règlement intérieur de la Fairy House."
export const DEFAULT_DROITS_IMAGE =
  "J'autorise la Fairy House à utiliser les photos et vidéos prises pendant l'événement à des fins de communication (site internet, réseaux sociaux)."

export type AccommodationChoice = 'tente' | 'chambre' | 'aucun'

/** Config tarifaire d'un événement (défauts globaux surchargés par événement). */
export interface EventPricingConfig {
  eventPriceTtc: number // part animation (TVA 20 %)
  tenteTtc: number // hébergement en tente (TVA 10 %)
  chambreTtc: number // chambre mixte partagée (TVA 10 %)
  shuttleEnabled: boolean
  shuttlePriceTtc: number // navette A/R (TVA 10 %)
  splitEnabled: boolean
}

export interface EventChoices {
  accommodation: AccommodationChoice
  shuttle: boolean
}

export interface EventQuoteLine {
  label: string
  ttc: number
  vatRate: number
  ht: number
  vat: number
}

export interface VatGroup {
  rate: number
  ht: number
  vat: number
  ttc: number
}

export interface EventQuote {
  lines: EventQuoteLine[]
  byRate: VatGroup[] // regroupement TVA par taux, décroissant
  totalHt: number
  totalVat: number
  totalTtc: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Construit une ligne à partir d'un montant TTC : rétro-calcul HT + TVA. */
function line(label: string, ttc: number, vatRate: number): EventQuoteLine {
  const t = round2(ttc)
  const ht = round2(t / (1 + vatRate / 100))
  return { label, ttc: t, vatRate, ht, vat: round2(t - ht) }
}

export const ACCOMMODATION_LABELS: Record<AccommodationChoice, string> = {
  tente: 'Hébergement — en tente',
  chambre: 'Hébergement — chambre mixte partagée',
  aucun: "Sans hébergement",
}

/** Devis chiffré d'une inscription événement (prix TTC, TVA détaillée). */
export function computeEventQuote(
  cfg: EventPricingConfig,
  choices: EventChoices,
): EventQuote {
  const lines: EventQuoteLine[] = []

  if (cfg.eventPriceTtc > 0) {
    lines.push(line('Inscription événement', cfg.eventPriceTtc, EVENT_VAT))
  }

  const accTtc =
    choices.accommodation === 'tente'
      ? cfg.tenteTtc
      : choices.accommodation === 'chambre'
        ? cfg.chambreTtc
        : 0
  if (accTtc > 0 && choices.accommodation !== 'aucun') {
    lines.push(
      line(ACCOMMODATION_LABELS[choices.accommodation], accTtc, ACCOMMODATION_VAT),
    )
  }

  if (choices.shuttle && cfg.shuttleEnabled && cfg.shuttlePriceTtc > 0) {
    lines.push(line('Navette gare de Nogent-sur-Vernisson (A/R)', cfg.shuttlePriceTtc, SHUTTLE_VAT))
  }

  const byRateMap = new Map<number, VatGroup>()
  for (const l of lines) {
    const g = byRateMap.get(l.vatRate) ?? { rate: l.vatRate, ht: 0, vat: 0, ttc: 0 }
    g.ht = round2(g.ht + l.ht)
    g.vat = round2(g.vat + l.vat)
    g.ttc = round2(g.ttc + l.ttc)
    byRateMap.set(l.vatRate, g)
  }
  const byRate = [...byRateMap.values()].sort((a, b) => b.rate - a.rate)

  const totalTtc = round2(lines.reduce((s, l) => s + l.ttc, 0))
  const totalHt = round2(byRate.reduce((s, g) => s + g.ht, 0))
  const totalVat = round2(byRate.reduce((s, g) => s + g.vat, 0))

  return { lines, byRate, totalHt, totalVat, totalTtc }
}
