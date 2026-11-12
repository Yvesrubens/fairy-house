// Recalcule le prix d'une réservation côté serveur et corrige la base si le
// montant enregistré par le navigateur diffère. Utilisé avant le paiement par
// carte (create-checkout-session) et avant l'envoi du devis virement (book).
import {
  eventQuote,
  nights,
  pricesFromRow,
  splitPlan,
  stayTotals,
} from './server-pricing.js'

// Comparaison JSON indépendante de l'ordre des clés (Postgres réordonne les
// clés des colonnes jsonb) et des écarts d'arrondi sur les nombres.
function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = canonical(o[k])
        return acc
      }, {})
  }
  if (typeof v === 'number') return Math.round(v * 100) / 100
  return v
}
const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(canonical(a ?? null)) === JSON.stringify(canonical(b ?? null))

export type RepriceResult =
  // Prix vérifié (et éventuellement corrigé) : `r` est la réservation à jour.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { status: 'ok'; r: any; corrected: boolean }
  // Réservation sans tarif calculable (ex. séjour sur mesure, événement supprimé).
  | { status: 'unpriceable' }
  // Correction nécessaire mais écriture en base impossible.
  | { status: 'error'; message: string }

export async function repriceReservation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r: any,
): Promise<RepriceResult> {
  let totalHt: number
  let totalTtc: number
  let extra: Record<string, unknown> = {}
  let detailChanged = false

  if (r.event_id) {
    const { data: ev } = await supabase
      .from('events')
      .select(
        'event_price_ttc,accommodation_tente_ttc,accommodation_chambre_ttc,shuttle_enabled,shuttle_price_ttc',
      )
      .eq('id', r.event_id)
      .maybeSingle()
    if (!ev) return { status: 'unpriceable' }
    const q = eventQuote(ev, { accommodation: r.accommodation_choice, shuttle: r.shuttle })
    totalHt = q.totalHt
    totalTtc = q.totalTtc
    // Le détail du devis (lignes + TVA par taux) vient aussi du serveur.
    extra = { quote_lines: q.quoteLines, vat_breakdown: q.vatBreakdown }
    detailChanged =
      !sameJson(r.quote_lines, q.quoteLines) || !sameJson(r.vat_breakdown, q.vatBreakdown)
  } else if (r.mode === 'individuel' || r.mode === 'groupe') {
    const { data: tarifs } = await supabase.from('tarifs').select('*').eq('id', 1).maybeSingle()
    const wholeHouse = Boolean(r.rooms && !Array.isArray(r.rooms) && r.rooms.wholeHouse)
    const n = nights(r.arrival_date, r.departure_date)
    const pers = Number(r.guests) || 0
    if (n < 1 || (!wholeHouse && pers < 1)) return { status: 'unpriceable' }
    const t = stayTotals(pers, n, r.options, wholeHouse, pricesFromRow(tarifs))
    totalHt = t.totalHt
    totalTtc = t.totalTtc
  } else {
    return { status: 'unpriceable' }
  }

  const amountDiffers =
    Math.abs((Number(r.amount) || 0) - totalTtc) > 0.01 ||
    Math.abs((Number(r.total_ttc) || 0) - totalTtc) > 0.01 ||
    Math.abs((Number(r.total_ht) || 0) - totalHt) > 0.01
  if (!amountDiffers && !detailChanged) return { status: 'ok', r, corrected: false }

  const patch: Record<string, unknown> = { amount: totalTtc, total_ttc: totalTtc, total_ht: totalHt, ...extra }
  if (r.payment_plan === 'split' && r.arrival_date) {
    const plan = splitPlan(totalTtc, r.arrival_date)
    patch.deposit_amount = plan.deposit
    patch.balance_amount = plan.balance
    patch.balance_due_date = plan.balanceDueDate
  }
  console.warn(
    `reprice: montant corrigé pour ${r.reference} (${r.amount} → ${totalTtc})` +
      (detailChanged ? ' + détail du devis' : ''),
  )
  const { error } = await supabase.from('reservations').update(patch).eq('id', r.id)
  if (error) return { status: 'error', message: error.message }
  return { status: 'ok', r: { ...r, ...patch }, corrected: true }
}
