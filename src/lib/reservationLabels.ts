import type { Reservation } from '../types/db'

export const MODE_LABEL: Record<string, string> = {
  groupe: 'Groupe',
  individuel: 'Individuel',
  'sur-mesure': 'Sur-mesure',
}

export const ACCOMMODATION_LABEL: Record<string, string> = {
  tente: 'En tente',
  chambre: 'Chambre mixte',
  aucun: 'Sans hébergement',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  virement: 'Virement',
  cb: 'CB',
  paypal: 'PayPal',
}

export function paymentSummary(
  r: Pick<Reservation, 'payment_method' | 'payment_plan'>,
): string {
  if (!r.payment_method) return ''
  const method = PAYMENT_METHOD_LABEL[r.payment_method] ?? r.payment_method
  if (r.payment_plan === 'split') return `${method} · 2×`
  if (r.payment_plan === 'once') return `${method} · 1×`
  return method
}

export function roomsSummary(rooms: Reservation['rooms']): string {
  if (!rooms) return ''
  if ('wholeHouse' in rooms) return 'Maison entière'
  if (!Array.isArray(rooms) || rooms.length === 0) return ''
  return rooms.map((r) => `${r.room} (${r.guests})`).join(', ')
}
