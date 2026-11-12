import { describe, it, expect } from 'vitest'
import {
  ROOMS, HOUSE_CAPACITY, WHOLE_HOUSE_CAPACITY, WHOLE_HOUSE_NIGHT_TTC,
  PRICE_PER_PERSON_NIGHT_TTC, LINGE_PER_PERSON_TTC, PENSION_PER_PERSON_NIGHT_TTC,
  TOTAL_BEDS, nights, computeQuote, canSplit, splitPlan,
  DEFAULT_PRICES, pricesFromRow,
} from './booking'

describe('booking constants', () => {
  it('has 3 rooms totalling capacity 12', () => {
    expect(ROOMS.map((r) => r.name)).toEqual(['Litha', 'Mabbon', 'Imbolc'])
    expect(ROOMS.reduce((s, r) => s + r.capacity, 0)).toBe(HOUSE_CAPACITY)
    expect(HOUSE_CAPACITY).toBe(12)
    expect(TOTAL_BEDS).toBe(11)
  })
  it('tarifs TTC ronds (lit 50, linge 8, pension 20) et maison complète 700 €/nuit TTC, 14 pers', () => {
    expect(PRICE_PER_PERSON_NIGHT_TTC).toBe(50)
    expect(LINGE_PER_PERSON_TTC).toBe(8)
    expect(PENSION_PER_PERSON_NIGHT_TTC).toBe(20)
    expect(WHOLE_HOUSE_CAPACITY).toBe(14)
    expect(WHOLE_HOUSE_NIGHT_TTC).toBe(700)
  })
})

describe('nights', () => {
  it('counts nights between two dates', () => {
    expect(nights('2026-08-01', '2026-08-04')).toBe(3)
  })
  it('returns 0 when dates are equal or reversed', () => {
    expect(nights('2026-08-01', '2026-08-01')).toBe(0)
    expect(nights('2026-08-04', '2026-08-01')).toBe(0)
  })
})

describe('computeQuote', () => {
  it('tarifs en TTC : total TTC rond, HT recalculé', () => {
    // 2 pers × 3 nuits × 50 € TTC = 300 € TTC → HT 272,73 ; TVA 27,27
    const q = computeQuote(2, 3, { linge: false, pension: false })
    expect(q.totalTtc).toBe(300)
    expect(q.totalHt).toBe(272.73)
    expect(q.vat).toBe(27.27)
    expect(q.lines).toHaveLength(1)
  })
  it('ajoute linge (par personne) et pension (par nuitée) en TTC', () => {
    // séjour 300 + linge 2×8=16 + pension 2×3×20=120 = 436 € TTC
    const q = computeQuote(2, 3, { linge: true, pension: true })
    expect(q.totalTtc).toBe(436)
    expect(q.totalHt).toBe(396.37)
    expect(q.vat).toBe(39.63)
    expect(q.lines).toHaveLength(3)
    expect(q.lines[1].label).toBe('Linge de maison')
    expect(q.lines[1].qty).toBe(2) // par personne, indépendant des nuits
    expect(q.lines[2].label).toBe('Pension complète')
    expect(q.lines[2].qty).toBe(6) // 2 pers × 3 nuits
  })
  it('facture la maison complète au forfait (700 € TTC/nuit), pas par personne', () => {
    // 2 nuits × 700 € TTC = 1400 € TTC (indépendant du nombre de personnes)
    const q = computeQuote(14, 2, { linge: false, pension: false }, true)
    expect(q.lines).toHaveLength(1)
    expect(q.lines[0].label).toBe('Maison complète (forfait)')
    expect(q.lines[0].qty).toBe(2) // nuits
    expect(q.totalTtc).toBe(1400)
    expect(q.totalHt).toBe(1272.73)
    expect(q.vat).toBe(127.27)
  })
  it('pricesFromRow : valeurs de la base, repli sur les défauts si absent/invalide', () => {
    expect(pricesFromRow({ lit_nuit_ttc: 55, linge_ttc: '10', pension_nuit_ttc: 25, maison_nuit_ttc: 800 }))
      .toEqual({ litNuit: 55, linge: 10, pensionNuit: 25, maisonNuit: 800 })
    expect(pricesFromRow(null)).toEqual(DEFAULT_PRICES)
    expect(pricesFromRow({ lit_nuit_ttc: 'abc', linge_ttc: -3 }).litNuit).toBe(50)
    expect(pricesFromRow({ linge_ttc: -3 }).linge).toBe(8)
  })
  it('utilise les tarifs modifiés par l\'admin quand ils sont fournis', () => {
    const prices = { litNuit: 55, linge: 10, pensionNuit: 25, maisonNuit: 800 }
    // 2 pers × 3 nuits × 55 = 330 + linge 2×10 = 20 + pension 6×25 = 150 → 500
    expect(computeQuote(2, 3, { linge: true, pension: true }, false, prices).totalTtc).toBe(500)
    // maison complète 2 nuits × 800 = 1600
    expect(computeQuote(14, 2, { linge: false, pension: false }, true, prices).totalTtc).toBe(1600)
  })
  it('maison complète : les options restent facturées par personne', () => {
    // forfait 700 + linge 14×8=112 = 812 € TTC
    const q = computeQuote(14, 1, { linge: true, pension: false }, true)
    expect(q.lines).toHaveLength(2)
    expect(q.lines[1].label).toBe('Linge de maison')
    expect(q.lines[1].qty).toBe(14)
    expect(q.totalTtc).toBe(812)
  })
})

describe('canSplit', () => {
  it('true when arrival is more than 30 days ahead', () => {
    expect(canSplit('2026-09-01', '2026-07-21')).toBe(true)
  })
  it('false when arrival is within 30 days', () => {
    expect(canSplit('2026-08-10', '2026-07-21')).toBe(false)
  })
  it('false when arrival is exactly 30 days ahead (boundary)', () => {
    expect(canSplit('2026-08-20', '2026-07-21')).toBe(false)
  })
})

describe('splitPlan', () => {
  it('splits 50/50 and sets balance due 30 days before arrival', () => {
    const p = splitPlan(481.8, '2026-09-01')
    expect(p.deposit).toBeCloseTo(240.9, 2)
    expect(p.balance).toBeCloseTo(240.9, 2)
    expect(p.balanceDueDate).toBe('2026-08-02')
  })
})
