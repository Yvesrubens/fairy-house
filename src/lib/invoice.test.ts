import { describe, it, expect } from 'vitest'
import { computeInvoice, lineTtc } from './invoice'

describe('computeInvoice (saisie en TTC)', () => {
  it('le prix saisi en TTC reste le total TTC (pas de TVA ajoutée en plus)', () => {
    // Cas signalé : 250 € TTC saisi → la facture doit afficher 250 € TTC, pas 300 €.
    const inv = computeInvoice([{ designation: 'Stage', qty: 1, unitPriceTtc: 250, vatRate: 20 }])
    expect(inv.totalTtc).toBe(250)
    expect(inv.totalHt).toBe(208.33)
    expect(inv.vatBreakdown).toEqual([{ rate: 20, ht: 208.33, vat: 41.67 }])
    expect(inv.lines[0].unitPrice).toBeCloseTo(208.3333, 4)
  })

  it('gère plusieurs taux (animation 20 % + hébergement 10 %)', () => {
    const inv = computeInvoice([
      { designation: 'Animation', qty: 1, unitPriceTtc: 300, vatRate: 20 },
      { designation: 'Hébergement', qty: 2, unitPriceTtc: 50, vatRate: 10 },
    ])
    expect(inv.totalTtc).toBe(400)
    expect(inv.vatBreakdown).toEqual([
      { rate: 10, ht: 90.91, vat: 9.09 },
      { rate: 20, ht: 250, vat: 50 },
    ])
    expect(inv.totalHt).toBe(340.91)
    expect(inv.mainRate).toBe(20)
  })

  it('retrouve le TTC des anciennes lignes saisies en HT', () => {
    expect(lineTtc({ unitPrice: 100, vatRate: 20 })).toBe(120)
    expect(lineTtc({ unitPrice: 45.4545, vatRate: 10, unitPriceTtc: 50 })).toBe(50)
  })
})
