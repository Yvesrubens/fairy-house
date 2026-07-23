// src/lib/reservationLabels.test.ts
import { describe, it, expect } from 'vitest'
import { paymentSummary, roomsSummary, MODE_LABEL } from './reservationLabels'

describe('paymentSummary', () => {
  it('méthode + plan 2×', () => {
    expect(paymentSummary({ payment_method: 'virement', payment_plan: 'split' })).toBe('Virement · 2×')
  })
  it('méthode + plan 1×', () => {
    expect(paymentSummary({ payment_method: 'cb', payment_plan: 'once' })).toBe('CB · 1×')
  })
  it('méthode sans plan', () => {
    expect(paymentSummary({ payment_method: 'paypal', payment_plan: null })).toBe('PayPal')
  })
  it('méthode nulle → vide', () => {
    expect(paymentSummary({ payment_method: null, payment_plan: null })).toBe('')
  })
})

describe('roomsSummary', () => {
  it('maison entière', () => {
    expect(roomsSummary({ wholeHouse: true })).toBe('Maison entière')
  })
  it('liste de chambres', () => {
    expect(roomsSummary([{ room: 'Chambre A', guests: 2 }, { room: 'Chambre B', guests: 1 }])).toBe('Chambre A (2), Chambre B (1)')
  })
  it('nul → vide', () => {
    expect(roomsSummary(null)).toBe('')
  })
})

describe('MODE_LABEL', () => {
  it('mappe les formules', () => {
    expect(MODE_LABEL['groupe']).toBe('Groupe')
    expect(MODE_LABEL['sur-mesure']).toBe('Sur-mesure')
  })
})
