// Calcul des factures manuelles saisies EN TTC (miroir de src/lib/invoice.ts,
// testé côté site). Les lignes stockées gardent un « PU HT » (4 décimales) pour
// le PDF, plus le prix TTC saisi ; le total TTC correspond exactement à la saisie.

export interface TtcLine {
  designation: string
  qty: number
  unitPriceTtc: number
  vatRate: number
}

export interface StoredLine {
  designation: string
  qty: number
  unitPrice: number
  vatRate: number
  unitPriceTtc: number
}

const round2 = (v: number) => Math.round(v * 100) / 100
const round4 = (v: number) => Math.round(v * 10000) / 10000

export function computeInvoice(input: TtcLine[]) {
  const lines: StoredLine[] = input.map((l) => {
    const rate = Number(l.vatRate) || 20
    const ttc = Number(l.unitPriceTtc) || 0
    return {
      designation: String(l.designation || ''),
      qty: Number(l.qty) || 0,
      unitPrice: round4(ttc / (1 + rate / 100)),
      vatRate: rate,
      unitPriceTtc: round2(ttc),
    }
  })
  return { lines, ...totalsFromStored(lines) }
}

/**
 * Totaux et ventilation TVA à partir de lignes enregistrées. Utilise le TTC
 * saisi quand il est présent (factures récentes), sinon le HT (anciennes).
 */
export function totalsFromStored(
  lines: { qty: number; unitPrice: number; vatRate?: number; unitPriceTtc?: number }[],
) {
  const rates = [...new Set(lines.map((l) => l.vatRate || 20))].sort((a, b) => a - b)
  const groups = rates
    .map((rate) => {
      const ls = lines.filter((l) => (l.vatRate || 20) === rate)
      const allTtc = ls.every((l) => typeof l.unitPriceTtc === 'number')
      let ht: number
      let ttc: number
      if (allTtc) {
        ttc = round2(ls.reduce((s, l) => s + round2(l.qty * (l.unitPriceTtc as number)), 0))
        ht = round2(ttc / (1 + rate / 100))
      } else {
        ht = round2(ls.reduce((s, l) => s + l.qty * l.unitPrice, 0))
        ttc = round2(ht * (1 + rate / 100))
      }
      return { rate, ht, vat: round2(ttc - ht), ttc }
    })
    .filter((g) => g.ttc !== 0)
  const totalTtc = round2(groups.reduce((s, g) => s + g.ttc, 0))
  const totalHt = round2(groups.reduce((s, g) => s + g.ht, 0))
  const mainRate = [...groups].sort((a, b) => b.ttc - a.ttc)[0]?.rate ?? 20
  return {
    totalHt,
    totalTtc,
    mainRate,
    vatBreakdown: groups.map(({ rate, ht, vat }) => ({ rate, ht, vat })),
  }
}
