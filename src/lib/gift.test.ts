
import { describe, it, expect } from 'vitest'
import { newGiftCode, parseGiftAmount, expiryFrom, euros, voucherState } from '../../api/_lib/gift-core'

describe('voucherState', () => {
  const base = { status: 'active', amount: 100, balance: 100, expires_at: '2027-11-12' }
  const today = '2026-12-01'
  it('statuts', () => {
    expect(voucherState({ ...base, status: 'pending' }, today)).toBe('en_attente')
    expect(voucherState({ ...base, status: 'cancelled' }, today)).toBe('annule')
    expect(voucherState(base, today)).toBe('actif')
    expect(voucherState({ ...base, balance: 40 }, today)).toBe('partiel')
    expect(voucherState({ ...base, balance: 0 }, today)).toBe('utilise')
    expect(voucherState(base, '2027-11-13')).toBe('expire')
    expect(voucherState(base, '2027-11-12')).toBe('actif') // valable le jour même
    expect(voucherState({ ...base, balance: 0 }, '2028-01-01')).toBe('utilise')
  })
})

describe('bons cadeaux', () => {
  it('numéro au format FH-XXXX-XXXX, sans caractères ambigus, et varié', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const c = newGiftCode()
      expect(c).toMatch(/^FH-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
      codes.add(c)
    }
    expect(codes.size).toBe(200)
  })

  it('montant : euros entiers entre 50 et 2000', () => {
    expect(parseGiftAmount(50)).toBe(50)
    expect(parseGiftAmount('120')).toBe(120)
    expect(parseGiftAmount(2000)).toBe(2000)
    expect(parseGiftAmount(49)).toBeNull()
    expect(parseGiftAmount(2001)).toBeNull()
    expect(parseGiftAmount(75.5)).toBeNull()
    expect(parseGiftAmount('abc')).toBeNull()
    expect(parseGiftAmount(-100)).toBeNull()
  })

  it('valable 1 an après l\'achat', () => {
    expect(expiryFrom(new Date('2026-11-12T10:00:00Z'))).toBe('2027-11-12')
  })

  it('montant affiché sans décimales inutiles', () => {
    expect(euros(150)).toBe('150 €')
    expect(euros(150.5)).toBe('150,50 €')
  })
})
