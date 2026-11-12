// Constantes et calculs purs du tunnel de réservation. Aucun effet de bord :
// entièrement testable (voir booking.test.ts).

export const ROOMS = [
  { name: 'Litha', capacity: 3 },
  { name: 'Mabbon', capacity: 5 },
  { name: 'Imbolc', capacity: 4 },
] as const

// Somme des capacités des 3 chambres nommées (invariant, cf. booking.test.ts).
export const HOUSE_CAPACITY = 12
// Capacité d'accueil en privatisation complète (forfait maison entière).
export const WHOLE_HOUSE_CAPACITY = 14
export const TOTAL_BEDS = 11
// Inventaire de lits pour le parcours individuel.
export const SIMPLE_BEDS = 10
export const DOUBLE_BEDS = 1

// Tarifs définis en TTC (ronds, pour éviter les factures à virgules). Le HT est
// recalculé à l'envers (TTC / 1 + TVA). TVA 10 %.
export const PRICE_PER_PERSON_NIGHT_TTC = 50
// Forfait « maison complète » : prix TTC par nuit, indépendant du nombre de
// personnes (ce n'est pas un tarif par personne).
export const WHOLE_HOUSE_NIGHT_TTC = 600
export const LINGE_PER_PERSON_TTC = 8 // forfait par personne (pas par nuit)
export const PENSION_PER_PERSON_NIGHT_TTC = 20
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

/** HT correspondant à un montant TTC (TVA incluse), arrondi au centime. */
function htFromTtc(ttc: number): number {
  return round2(ttc / (1 + VAT_RATE / 100))
}

/**
 * Devis chiffré pour `pers` personnes, `nightsCount` nuits et les options.
 * Les tarifs sont définis en TTC : le total TTC est donc toujours « rond »,
 * et le HT / la TVA sont recalculés à partir du TTC. Si `wholeHouse` est vrai,
 * le séjour est facturé au forfait maison complète (600 € TTC / nuit) ; sinon
 * au tarif par personne. Les options (linge, pension) restent par personne.
 * Les lignes exposent un prix unitaire et un total HT (pour le devis/la facture).
 */
export function computeQuote(
  pers: number,
  nightsCount: number,
  opts: Options,
  wholeHouse = false,
): Quote {
  const lines: QuoteLine[] = []
  let totalTtc = 0

  function addLine(label: string, qty: number, unitTtc: number) {
    const lineTtc = round2(unitTtc * qty)
    totalTtc = round2(totalTtc + lineTtc)
    lines.push({
      label,
      qty,
      unitPrice: htFromTtc(unitTtc),
      total: htFromTtc(lineTtc),
    })
  }

  if (wholeHouse) {
    addLine('Maison complète (forfait)', nightsCount, WHOLE_HOUSE_NIGHT_TTC)
  } else {
    addLine('Séjour (nuitées)', pers * nightsCount, PRICE_PER_PERSON_NIGHT_TTC)
  }
  if (opts.linge) {
    // Forfait linge : facturé par personne, une seule fois (pas par nuit).
    addLine('Linge de maison', pers, LINGE_PER_PERSON_TTC)
  }
  if (opts.pension) {
    addLine('Pension complète', pers * nightsCount, PENSION_PER_PERSON_NIGHT_TTC)
  }

  const totalHt = round2(lines.reduce((s, l) => s + l.total, 0))
  const vat = round2(totalTtc - totalHt)
  return { lines, totalHt, vat, totalTtc }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Date minimale d'arrivée pour une réservation « Séjour Individuel » (lit seul) :
 * un lit ne peut être réservé qu'à partir de 2 mois à l'avance. Renvoie cette
 * date (YYYY-MM-DD) — toute arrivée strictement antérieure est refusée. Les
 * séjours de groupe / maison entière ne sont pas concernés.
 */
export function minIndividualDate(from: Date = new Date()): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 2)
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
