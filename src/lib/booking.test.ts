import { describe, it, expect } from 'vitest'
import {
  ROOMS, HOUSE_CAPACITY, TOTAL_BEDS, VAT_RATE,
  nights, computeQuote, canSplit, splitPlan,
} from './booking'

describe('booking constants', () => {
  it('has 3 rooms totalling capacity 12', () => {
    expect(ROOMS.map((r) => r.name)).toEqual(['Litha', 'Mabbon', 'Imbolc'])
    expect(ROOMS.reduce((s, r) => s + r.capacity, 0)).toBe(HOUSE_CAPACITY)
    expect(HOUSE_CAPACITY).toBe(12)
    expect(TOTAL_BEDS).toBe(11)
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
  it('adds linge and pension lines', () => {
    // séjour 270 + linge 2×3×8=48 + pension 2×3×20=120 = 438 HT
    const q = computeQuote(2, 3, { linge: true, pension: true })
    expect(q.totalHt).toBe(438)
    expect(q.vat).toBeCloseTo(43.8, 2)
    expect(q.totalTtc).toBeCloseTo(481.8, 2)
    expect(q.lines).toHaveLength(3)
  })
})

describe('canSplit', () => {
  it('true when arrival is more than 30 days ahead', () => {
    expect(canSplit('2026-09-01', '2026-07-21')).toBe(true)
  })
  it('false when arrival is within 30 days', () => {
    expect(canSplit('2026-08-10', '2026-07-21')).toBe(false)
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
