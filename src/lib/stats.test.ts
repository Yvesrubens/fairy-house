import { describe, it, expect } from 'vitest'
import {
  reservationsThisMonth,
  revenueThisMonth,
  occupancyRate,
  activeEvents,
} from './stats'
import type { Reservation, EventRow } from '../types/db'

const base: Reservation = {
  id: '1',
  reference: 'FH-2026-00001',
  client_name: 'A',
  client_email: 'a@a.fr',
  client_phone: null,
  type: 'Privatisation complète',
  arrival_date: '2026-06-03',
  departure_date: '2026-06-05',
  guests: 2,
  amount: 100,
  status: 'confirmed',
  message: null,
  event_id: null,
  mode: null,
  rooms: null,
  beds: null,
  options: null,
  activities_requested: false,
  allergies: null,
  payment_method: null,
  payment_plan: null,
  total_ht: null,
  vat_rate: null,
  total_ttc: null,
  deposit_amount: null,
  balance_amount: null,
  balance_due_date: null,
  confirmation_sent_at: null,
  social_handle: null,
  emergency_contact: null,
  diet: null,
  accommodation_choice: null,
  shuttle: null,
  consent_reglement: null,
  consent_image: null,
  quote_lines: null,
  vat_breakdown: null,
  created_at: '2026-06-03T10:00:00Z',
}
const now = new Date('2026-06-15T00:00:00Z')

describe('stats', () => {
  it('counts reservations created this month', () => {
    expect(reservationsThisMonth([base], now)).toBe(1)
  })
  it('sums revenue of confirmed this month', () => {
    expect(
      revenueThisMonth(
        [base, { ...base, id: '2', status: 'pending', amount: 50 }],
        now,
      ),
    ).toBe(100)
  })
  it('computes occupancy percent to 1 decimal', () => {
    // 2 nights / 60 capacity = 3.333% -> 3.3
    expect(occupancyRate([base], now, 60)).toBe(3.3)
  })
  it('counts published upcoming events', () => {
    const ev: EventRow = {
      id: 'e',
      title: 't',
      slug: 't',
      description: null,
      content: null,
      event_date: '2026-06-20',
      location: null,
      image_url: null,
      capacity: null,
      published: true,
      event_price_ttc: null,
      accommodation_tente_ttc: null,
      accommodation_chambre_ttc: null,
      shuttle_enabled: null,
      shuttle_price_ttc: null,
      split_payment_enabled: null,
      reglement_texte: null,
      droits_image_texte: null,
      created_at: '',
    }
    expect(activeEvents([ev, { ...ev, id: 'e2', published: false }], now)).toBe(1)
  })
})
