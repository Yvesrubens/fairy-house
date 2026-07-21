import { describe, it, expect } from 'vitest'
import {
  computeEventQuote,
  type EventPricingConfig,
} from './eventPricing'

const cfg: EventPricingConfig = {
  eventPriceTtc: 120, // animation, TVA 20 %
  tenteTtc: 30, // hébergement, TVA 10 %
  chambreTtc: 55, // hébergement, TVA 10 %
  shuttleEnabled: true,
  shuttlePriceTtc: 15, // navette, TVA 10 %
  splitEnabled: true,
}

describe('computeEventQuote', () => {
  it('événement seul (sans hébergement, sans navette) — TVA 20 % rétro-calculée', () => {
    const q = computeEventQuote(cfg, { accommodation: 'aucun', shuttle: false })
    expect(q.lines).toHaveLength(1)
    expect(q.totalTtc).toBe(120)
    // 120 TTC @20% → HT = 100, TVA = 20
    expect(q.totalHt).toBe(100)
    expect(q.totalVat).toBe(20)
    expect(q.byRate).toEqual([{ rate: 20, ht: 100, vat: 20, ttc: 120 }])
  })

  it('événement + chambre + navette — deux taux regroupés (20 % puis 10 %)', () => {
    const q = computeEventQuote(cfg, { accommodation: 'chambre', shuttle: true })
    expect(q.lines).toHaveLength(3)
    expect(q.totalTtc).toBe(190) // 120 + 55 + 15
    // part 20 % : 120 TTC → 100 HT / 20 TVA
    // part 10 % : 70 TTC → 63.64 HT / 6.36 TVA
    expect(q.byRate.map((g) => g.rate)).toEqual([20, 10])
    const g20 = q.byRate.find((g) => g.rate === 20)!
    const g10 = q.byRate.find((g) => g.rate === 10)!
    expect(g20.ttc).toBe(120)
    expect(g10.ttc).toBe(70)
    expect(g20.ht).toBe(100)
    expect(g10.ht).toBeCloseTo(63.64, 2)
    expect(q.totalHt).toBeCloseTo(163.64, 2)
    expect(q.totalTtc).toBe(q.totalHt + q.totalVat)
  })

  it('navette ignorée si non désirée ou désactivée sur l\'événement', () => {
    const noShuttle = computeEventQuote(cfg, { accommodation: 'tente', shuttle: false })
    expect(noShuttle.totalTtc).toBe(150) // 120 + 30
    const disabled = computeEventQuote(
      { ...cfg, shuttleEnabled: false },
      { accommodation: 'tente', shuttle: true },
    )
    expect(disabled.totalTtc).toBe(150)
  })

  it('total TTC = somme des TTC des lignes', () => {
    const q = computeEventQuote(cfg, { accommodation: 'tente', shuttle: true })
    const sum = q.lines.reduce((s, l) => s + l.ttc, 0)
    expect(q.totalTtc).toBe(sum)
  })
})
