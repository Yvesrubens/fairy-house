import { describe, it, expect } from 'vitest'
import {
  ROOMS, HOUSE_CAPACITY, WHOLE_HOUSE_CAPACITY, WHOLE_HOUSE_NIGHT_HT, TOTAL_BEDS,
  nights, computeQuote, canSplit, splitPlan,
} from './booking'

describe('booking constants', () => {
  it('has 3 rooms totalling capacity 12', () => {
    expect(ROOMS.map((r) => r.name)).toEqual(['Litha', 'Mabbon', 'Imbolc'])
    expect(ROOMS.reduce((s, r) => s + r.capacity, 0)).toBe(HOUSE_CAPACITY)
    expect(HOUSE_CAPACITY).toBe(12)
    expect(TOTAL_BEDS).toBe(11)
  })
  it('privatisation complète : 14 personnes, forfait 600 €/nuit HT', () => {
    expect(WHOLE_HOUSE_CAPACITY).toBe(14)
    expect(WHOLE_HOUSE_NIGHT_HT).toBe(600)
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
  it('computes stay only with 10% VAT', () => {
    // 2 pers × 3 nuits × 45 = 270 HT
    const q = computeQuote(2, 3, { linge: false, pension: false })
    expect(q.totalHt).toBe(270)
    expect(q.vat).toBe(27)
    expect(q.totalTtc).toBe(297)
    expect(q.lines).toHaveLength(1)
  })
  it('adds linge (par personne) and pension (par nuitée) lines', () => {
    // séjour 2×3×45=270 + linge 2×8=16 (par personne) + pension 2×3×20=120 = 406 HT
    const q = computeQuote(2, 3, { linge: true, pension: true })
    expect(q.totalHt).toBe(406)
    expect(q.vat).toBeCloseTo(40.6, 2)
    expect(q.totalTtc).toBeCloseTo(446.6, 2)
    expect(q.lines).toHaveLength(3)
    expect(q.lines[1].label).toBe('Linge de maison')
    expect(q.lines[1].unitPrice).toBe(8)
    expect(q.lines[1].qty).toBe(2) // par personne, indépendant des nuits
    expect(q.lines[1].total).toBe(16)
    expect(q.lines[2].label).toBe('Pension complète')
    expect(q.lines[2].unitPrice).toBe(20)
    expect(q.lines[2].qty).toBe(6) // 2 pers × 3 nuits
  })
  it('facture la maison complète au forfait (600 €/nuit HT), pas par personne', () => {
    // 2 nuits × 600 = 1200 HT (indépendant du nombre de personnes)
    const q = computeQuote(14, 2, { linge: false, pension: false }, true)
    expect(q.lines).toHaveLength(1)
    expect(q.lines[0].label).toBe('Maison complète (forfait)')
    expect(q.lines[0].qty).toBe(2) // nuits
    expect(q.lines[0].unitPrice).toBe(600)
    expect(q.totalHt).toBe(1200)
    expect(q.vat).toBe(120)
    expect(q.totalTtc).toBe(1320)
  })
  it('maison complète : les options restent facturées par personne', () => {
    // forfait 1×600=600 + linge 14×8=112 = 712 HT
    const q = computeQuote(14, 1, { linge: true, pension: false }, true)
    expect(q.lines).toHaveLength(2)
    expect(q.lines[0].total).toBe(600)
    expect(q.lines[1].label).toBe('Linge de maison')
    expect(q.lines[1].qty).toBe(14)
    expect(q.totalHt).toBe(712)
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
