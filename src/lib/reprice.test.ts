import { describe, it, expect } from 'vitest'
import { repriceReservation } from '../../api/_lib/reprice'
import { computeQuote } from './booking'

// Base simulée : tables en mémoire + journal des mises à jour.
function fakeDb(tables: Record<string, Record<string, unknown>[]>) {
  const updates: { table: string; patch: Record<string, unknown>; id: unknown }[] = []
  const db = {
    from(table: string) {
      let filter: [string, unknown] | null = null
      let patch: Record<string, unknown> | null = null
      const builder = {
        select() {
          return builder
        },
        update(p: Record<string, unknown>) {
          patch = p
          return builder
        },
        eq(col: string, val: unknown) {
          filter = [col, val]
          if (patch) {
            updates.push({ table, patch, id: val })
            return Promise.resolve({ error: null })
          }
          return builder
        },
        maybeSingle() {
          const row = (tables[table] ?? []).find((r) => !filter || r[filter[0]] === filter[1])
          return Promise.resolve({ data: row ?? null, error: null })
        },
      }
      return builder
    },
  }
  return { db, updates }
}

const tarifs = { id: 1, lit_nuit_ttc: 50, linge_ttc: 8, pension_nuit_ttc: 20, maison_nuit_ttc: 700 }

describe('repriceReservation', () => {
  const honest = computeQuote(2, 3, { linge: true, pension: false })
  const stay = {
    id: 'r1',
    reference: 'RES-1',
    mode: 'individuel',
    guests: 2,
    arrival_date: '2026-12-10',
    departure_date: '2026-12-13',
    options: { linge: true, pension: false },
    rooms: [],
    payment_plan: 'once',
    amount: honest.totalTtc,
    total_ttc: honest.totalTtc,
    total_ht: honest.totalHt,
  }

  it('séjour au bon prix : aucune correction', async () => {
    const { db, updates } = fakeDb({ tarifs: [tarifs] })
    const res = await repriceReservation(db, stay)
    expect(res).toMatchObject({ status: 'ok', corrected: false })
    expect(updates).toHaveLength(0)
  })

  it('séjour au prix falsifié : corrigé au tarif serveur', async () => {
    const { db, updates } = fakeDb({ tarifs: [tarifs] })
    const res = await repriceReservation(db, { ...stay, amount: 1, total_ttc: 1, total_ht: 0.91 })
    expect(res).toMatchObject({ status: 'ok', corrected: true })
    expect(updates[0].patch).toMatchObject({ amount: 316, total_ttc: 316 })
  })

  it('maison complète en 2 fois : échéancier recalculé', async () => {
    const { db, updates } = fakeDb({ tarifs: [tarifs] })
    await repriceReservation(db, {
      ...stay,
      mode: 'groupe',
      guests: 10,
      rooms: { wholeHouse: true },
      options: {},
      payment_plan: 'split',
      amount: 10,
      total_ttc: 10,
    })
    // 3 nuits × 700 = 2100 → acompte 1050, solde 1050 dû 30 j avant
    expect(updates[0].patch).toMatchObject({
      amount: 2100,
      deposit_amount: 1050,
      balance_amount: 1050,
      balance_due_date: '2026-11-10',
    })
  })

  const ev = {
    id: 'e1',
    event_price_ttc: 280,
    accommodation_tente_ttc: 60,
    accommodation_chambre_ttc: 110,
    shuttle_enabled: true,
    shuttle_price_ttc: 15,
  }
  // Ce que la base renvoie : mêmes valeurs, clés réordonnées par Postgres (jsonb).
  const storedEvent = {
    id: 'r2',
    reference: 'RES-2',
    event_id: 'e1',
    accommodation_choice: 'chambre',
    shuttle: false,
    payment_plan: 'once',
    amount: 390,
    total_ttc: 390,
    total_ht: 333.33,
    quote_lines: [
      { qty: 1, vatRate: 20, unitPrice: 233.33, designation: 'Inscription événement' },
      { qty: 1, vatRate: 10, unitPrice: 100, designation: 'Hébergement — chambre mixte partagée' },
    ],
    vat_breakdown: [
      { ht: 233.33, ttc: 280, vat: 46.67, rate: 20 },
      { ht: 100, ttc: 110, vat: 10, rate: 10 },
    ],
  }

  it('événement au bon prix (clés jsonb réordonnées) : aucune correction', async () => {
    const { db, updates } = fakeDb({ events: [ev] })
    const res = await repriceReservation(db, storedEvent)
    expect(res).toMatchObject({ status: 'ok', corrected: false })
    expect(updates).toHaveLength(0)
  })

  it('événement au détail falsifié : lignes et TVA recalculées', async () => {
    const { db, updates } = fakeDb({ events: [ev] })
    const res = await repriceReservation(db, {
      ...storedEvent,
      quote_lines: [{ designation: 'Inscription événement', qty: 1, unitPrice: 1, vatRate: 20 }],
    })
    expect(res).toMatchObject({ status: 'ok', corrected: true })
    expect(updates[0].patch.quote_lines).toHaveLength(2)
    expect(updates[0].patch.total_ttc).toBe(390)
  })

  it('séjour sur mesure : non recalculable, laissé tel quel', async () => {
    const { db, updates } = fakeDb({})
    const res = await repriceReservation(db, { id: 'r3', mode: 'sur-mesure', amount: 0 })
    expect(res.status).toBe('unpriceable')
    expect(updates).toHaveLength(0)
  })
})
