// Constantes et calculs purs du tunnel de réservation. Aucun effet de bord :
// entièrement testable (voir booking.test.ts).

export const ROOMS = [
  { name: 'Litha', capacity: 3 },
  { name: 'Mabbon', capacity: 5 },
  { name: 'Imbolc', capacity: 4 },
] as const

export const HOUSE_CAPACITY = 12
export const TOTAL_BEDS = 11
// Inventaire de lits pour le parcours individuel.
export const SIMPLE_BEDS = 10
export const DOUBLE_BEDS = 1

export const PRICE_PER_PERSON_NIGHT = 45
export const LINGE_PER_PERSON = 8 // forfait par personne (pas par nuit)
export const PENSION_PER_PERSON_NIGHT = 20
export const VAT_RATE = 10
export const SPLIT_MIN_DAYS = 30

export interface Options {
  linge: boolean
  pension: boolean
}

export interface QuoteLine {
  label: string
  qty: number
  unitPrice: number
  total: number
}

export interface Quote {
  lines: QuoteLine[]
  totalHt: number
  vat: number
  totalTtc: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Nombre de nuits entre deux dates ISO (YYYY-MM-DD). 0 si égales ou inversées. */
export function nights(arrival: string, departure: string): number {
  const a = Date.parse(arrival + 'T00:00:00Z')
  const d = Date.parse(departure + 'T00:00:00Z')
  if (Number.isNaN(a) || Number.isNaN(d) || d <= a) return 0
  return Math.round((d - a) / 86_400_000)
}

/** Devis chiffré pour `pers` personnes, `nightsCount` nuits et les options. */
export function computeQuote(
  pers: number,
  nightsCount: number,
  opts: Options,
): Quote {
  const lines: QuoteLine[] = []
  const stay = PRICE_PER_PERSON_NIGHT * pers * nightsCount
  lines.push({
    label: 'Séjour (nuitées)',
    qty: pers * nightsCount,
    unitPrice: PRICE_PER_PERSON_NIGHT,
    total: stay,
  })
  if (opts.linge) {
    // Forfait linge : facturé par personne, une seule fois (pas par nuit).
    const t = LINGE_PER_PERSON * pers
    lines.push({ label: 'Linge de maison', qty: pers, unitPrice: LINGE_PER_PERSON, total: t })
  }
  if (opts.pension) {
    const t = PENSION_PER_PERSON_NIGHT * pers * nightsCount
    lines.push({ label: 'Pension complète', qty: pers * nightsCount, unitPrice: PENSION_PER_PERSON_NIGHT, total: t })
  }
  const totalHt = round2(lines.reduce((s, l) => s + l.total, 0))
  const vat = round2((totalHt * VAT_RATE) / 100)
  const totalTtc = round2(totalHt + vat)
  return { lines, totalHt, vat, totalTtc }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Le paiement en 2 fois est-il possible ? (arrivée à plus de 30 j de `today`) */
export function canSplit(arrival: string, today: string): boolean {
  return nights(today, arrival) > SPLIT_MIN_DAYS
}

/** Échéancier 50/50 ; solde dû 30 jours avant l'arrivée. */
export function splitPlan(
  totalTtc: number,
  arrival: string,
): { deposit: number; balance: number; balanceDueDate: string } {
  const deposit = round2(totalTtc / 2)
  const balance = round2(totalTtc - deposit)
  return { deposit, balance, balanceDueDate: addDays(arrival, -SPLIT_MIN_DAYS) }
}
