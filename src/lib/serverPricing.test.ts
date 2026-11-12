import { describe, it, expect } from 'vitest'
import { computeQuote, DEFAULT_PRICES, pricesFromRow, splitPlan } from './booking'
import { computeEventQuote } from './eventPricing'
import * as server from '../../api/_lib/server-pricing'

// Le serveur recalcule le prix avant paiement avec une copie autonome des
// calculs du site. Ces tests garantissent que les deux restent identiques.

describe('recalcul serveur = calcul du site', () => {
  it('mêmes tarifs par défaut', () => {
    expect(server.DEFAULT_PRICES).toEqual(DEFAULT_PRICES)
  })

  it('même lecture de la table tarifs', () => {
    const rows = [
      null,
      { lit_nuit_ttc: 55, linge_ttc: '10', pension_nuit_ttc: 25, maison_nuit_ttc: 800 },
      { lit_nuit_ttc: 'abc', linge_ttc: -3 },
    ]
    for (const r of rows) expect(server.pricesFromRow(r)).toEqual(pricesFromRow(r))
  })

  it('mêmes totaux pour les séjours (individuel, maison complète, options, tarifs custom)', () => {
    const priceSets = [DEFAULT_PRICES, { litNuit: 55, linge: 10, pensionNuit: 25, maisonNuit: 800 }]
    const cases: [number, number, { linge: boolean; pension: boolean }, boolean][] = [
      [1, 2, { linge: false, pension: false }, false],
      [3, 4, { linge: true, pension: true }, false],
      [2, 1, { linge: true, pension: false }, false],
      [14, 2, { linge: false, pension: false }, true],
      [9, 3, { linge: true, pension: true }, true],
    ]
    for (const prices of priceSets) {
      for (const [pers, n, opts, whole] of cases) {
        const site = computeQuote(pers, n, opts, whole, prices)
        const srv = server.stayTotals(pers, n, opts, whole, prices)
        expect(srv).toEqual({ totalHt: site.totalHt, totalTtc: site.totalTtc })
      }
    }
  })

  it('mêmes totaux pour les événements', () => {
    const ev = {
      event_price_ttc: 280,
      accommodation_tente_ttc: 60,
      accommodation_chambre_ttc: 110,
      shuttle_enabled: true,
      shuttle_price_ttc: 15,
    }
    for (const accommodation of ['tente', 'chambre', 'aucun'] as const) {
      for (const shuttle of [true, false]) {
        const site = computeEventQuote(
          {
            eventPriceTtc: ev.event_price_ttc,
            tenteTtc: ev.accommodation_tente_ttc,
            chambreTtc: ev.accommodation_chambre_ttc,
            shuttleEnabled: ev.shuttle_enabled,
            shuttlePriceTtc: ev.shuttle_price_ttc,
            splitEnabled: false,
          },
          { accommodation, shuttle },
        )
        const srv = server.eventTotals(ev, { accommodation, shuttle })
        expect(srv).toEqual({ totalHt: site.totalHt, totalTtc: site.totalTtc })
        // Lignes et TVA par taux = ce que EventInscription enregistre.
        const q = server.eventQuote(ev, { accommodation, shuttle })
        expect(q.quoteLines).toEqual(
          site.lines.map((l) => ({ designation: l.label, qty: 1, unitPrice: l.ht, vatRate: l.vatRate })),
        )
        expect(q.vatBreakdown).toEqual(site.byRate)
      }
    }
  })

  it('même échéancier en 2 fois', () => {
    expect(server.splitPlan(481.8, '2026-09-01')).toEqual(splitPlan(481.8, '2026-09-01'))
  })

  it('nuits calculées pareil', () => {
    expect(server.nights('2026-08-01', '2026-08-04')).toBe(3)
    expect(server.nights('2026-08-04', '2026-08-01')).toBe(0)
    expect(server.nights('2026-08-04', null)).toBe(0)
  })
})
