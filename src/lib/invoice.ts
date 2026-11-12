// Calcul des factures manuelles : les prix sont SAISIS EN TTC (avec un taux de
// TVA par ligne) puis convertis en HT pour le PDF (colonne « PU HT »).
// Le total TTC est la source de vérité : il correspond exactement à la saisie.
// Logique dupliquée côté serveur dans api/_lib/invoice-lines.ts.

export interface TtcLine {
  designation: string
  qty: number
  unitPriceTtc: number
  vatRate: number // 10 ou 20
}

export interface StoredLine {
  designation: string
  qty: number
  unitPrice: number // HT, 4 décimales (affiché arrondi au centime)
  vatRate: number
  unitPriceTtc: number
}

export interface InvoiceTotals {
  lines: StoredLine[]
  totalHt: number
  totalTtc: number
  vatBreakdown: { rate: number; ht: number; vat: number }[]
  mainRate: number
}

const round2 = (v: number) => Math.round(v * 100) / 100
const round4 = (v: number) => Math.round(v * 10000) / 10000

export function computeInvoice(input: TtcLine[]): InvoiceTotals {
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

  const rates = [...new Set(lines.map((l) => l.vatRate))].sort((a, b) => a - b)
  const vatBreakdown = rates
    .map((rate) => {
      const ttc = round2(
        lines
          .filter((l) => l.vatRate === rate)
          .reduce((s, l) => s + round2(l.qty * l.unitPriceTtc), 0),
      )
      const ht = round2(ttc / (1 + rate / 100))
      return { rate, ht, vat: round2(ttc - ht), ttc }
    })
    .filter((g) => g.ttc !== 0)

  const totalTtc = round2(vatBreakdown.reduce((s, g) => s + g.ttc, 0))
  const totalHt = round2(vatBreakdown.reduce((s, g) => s + g.ht, 0))
  const mainRate =
    [...vatBreakdown].sort((a, b) => b.ttc - a.ttc)[0]?.rate ?? lines[0]?.vatRate ?? 20

  return {
    lines,
    totalHt,
    totalTtc,
    vatBreakdown: vatBreakdown.map(({ rate, ht, vat }) => ({ rate, ht, vat })),
    mainRate,
  }
}

/** Prix unitaire TTC d'une ligne déjà enregistrée (anciennes factures saisies en HT incluses). */
export function lineTtc(l: { unitPrice: number; vatRate?: number; unitPriceTtc?: number }): number {
  if (typeof l.unitPriceTtc === 'number') return l.unitPriceTtc
  return round2(l.unitPrice * (1 + (l.vatRate ?? 20) / 100))
}
