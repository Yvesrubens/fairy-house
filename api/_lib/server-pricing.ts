// Recalcul SERVEUR du prix d'une réservation avant paiement (Stripe).
// Le montant enregistré par le navigateur n'est jamais pris tel quel : on le
// recalcule à partir des données de référence (tarifs en base pour un séjour,
// configuration de l'événement pour une inscription).
//
// Module autonome (aucun import) : miroir de src/lib/booking.ts (computeQuote,
// splitPlan, pricesFromRow) et de src/lib/eventPricing.ts (computeEventQuote).
// La concordance est vérifiée par src/lib/serverPricing.test.ts.

const VAT_RATE = 10
const SPLIT_MIN_DAYS = 30

export interface Prices {
  litNuit: number
  linge: number
  pensionNuit: number
  maisonNuit: number
}

// Doit rester identique à DEFAULT_PRICES (src/lib/booking.ts).
export const DEFAULT_PRICES: Prices = { litNuit: 50, linge: 8, pensionNuit: 20, maisonNuit: 700 }

const round2 = (n: number) => Math.round(n * 100) / 100

export function pricesFromRow(
  row: Partial<Record<'lit_nuit_ttc' | 'linge_ttc' | 'pension_nuit_ttc' | 'maison_nuit_ttc', unknown>> | null | undefined,
): Prices {
  const pick = (v: unknown, d: number) => {
    const n = Number(v)
    return v != null && v !== '' && Number.isFinite(n) && n >= 0 ? n : d
  }
  return {
    litNuit: pick(row?.lit_nuit_ttc, DEFAULT_PRICES.litNuit),
    linge: pick(row?.linge_ttc, DEFAULT_PRICES.linge),
    pensionNuit: pick(row?.pension_nuit_ttc, DEFAULT_PRICES.pensionNuit),
    maisonNuit: pick(row?.maison_nuit_ttc, DEFAULT_PRICES.maisonNuit),
  }
}

export function nights(arrival: string | null | undefined, departure: string | null | undefined): number {
  if (!arrival || !departure) return 0
  const a = Date.parse(arrival.slice(0, 10) + 'T00:00:00Z')
  const d = Date.parse(departure.slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(d) || d <= a) return 0
  return Math.round((d - a) / 86_400_000)
}

export interface Totals {
  totalHt: number
  totalTtc: number
}

/** Miroir de computeQuote (tarifs TTC, HT recalculé ligne par ligne). */
export function stayTotals(
  pers: number,
  nightsCount: number,
  opts: { linge?: boolean; pension?: boolean } | null | undefined,
  wholeHouse: boolean,
  prices: Prices,
): Totals {
  const ht = (ttc: number) => round2(ttc / (1 + VAT_RATE / 100))
  let totalTtc = 0
  let totalHt = 0
  const add = (qty: number, unitTtc: number) => {
    const lineTtc = round2(unitTtc * qty)
    totalTtc = round2(totalTtc + lineTtc)
    totalHt = round2(totalHt + ht(lineTtc))
  }
  if (wholeHouse) add(nightsCount, prices.maisonNuit)
  else add(pers * nightsCount, prices.litNuit)
  if (opts?.linge) add(pers, prices.linge)
  if (opts?.pension) add(pers * nightsCount, prices.pensionNuit)
  return { totalHt, totalTtc }
}

export interface EventPriceRow {
  event_price_ttc: number | null
  accommodation_tente_ttc: number | null
  accommodation_chambre_ttc: number | null
  shuttle_enabled: boolean | null
  shuttle_price_ttc: number | null
}

const DEFAULT_SHUTTLE_TTC = 15

/** Miroir de computeEventQuote (animation 20 %, hébergement/navette 10 %). */
export function eventTotals(
  ev: EventPriceRow,
  choices: { accommodation: string | null | undefined; shuttle: boolean | null | undefined },
): Totals {
  const lines: { ttc: number; rate: number }[] = []
  const eventPrice = ev.event_price_ttc ?? 0
  if (eventPrice > 0) lines.push({ ttc: round2(eventPrice), rate: 20 })
  const acc = choices.accommodation
  const accTtc =
    acc === 'tente' ? ev.accommodation_tente_ttc ?? 0 : acc === 'chambre' ? ev.accommodation_chambre_ttc ?? 0 : 0
  if (accTtc > 0 && (acc === 'tente' || acc === 'chambre')) lines.push({ ttc: round2(accTtc), rate: 10 })
  const shuttlePrice = ev.shuttle_price_ttc ?? DEFAULT_SHUTTLE_TTC
  if (choices.shuttle && (ev.shuttle_enabled ?? false) && shuttlePrice > 0) {
    lines.push({ ttc: round2(shuttlePrice), rate: 10 })
  }
  let totalTtc = 0
  let totalHt = 0
  for (const l of lines) {
    totalTtc = round2(totalTtc + l.ttc)
    totalHt = round2(totalHt + round2(l.ttc / (1 + l.rate / 100)))
  }
  return { totalHt, totalTtc }
}

/** Miroir de splitPlan : 50/50, solde dû 30 jours avant l'arrivée. */
export function splitPlan(totalTtc: number, arrival: string) {
  const deposit = round2(totalTtc / 2)
  const balance = round2(totalTtc - deposit)
  const d = new Date(arrival.slice(0, 10) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - SPLIT_MIN_DAYS)
  return { deposit, balance, balanceDueDate: d.toISOString().slice(0, 10) }
}
