// Bons cadeaux — logique pure (aucune dépendance Node) : numéro, montant,
// validité, formatage. Testée par src/lib/gift.test.ts.

export const GIFT_MIN = 50
export const GIFT_MAX = 2000

// Alphabet sans caractères ambigus (0/O, 1/I/L) : facile à dicter et à saisir.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Entier aléatoire uniforme dans [0, n) (Web Crypto, sans biais). */
function randomIndex(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n
  const buf = new Uint32Array(1)
  for (;;) {
    globalThis.crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % n
  }
}

/** Numéro de bon aléatoire, non devinable : FH-XXXX-XXXX. */
export function newGiftCode(): string {
  let s = ''
  for (let i = 0; i < 8; i++) s += ALPHABET[randomIndex(ALPHABET.length)]
  return `FH-${s.slice(0, 4)}-${s.slice(4)}`
}

/** Montant en euros entiers, entre GIFT_MIN et GIFT_MAX, sinon null. */
export function parseGiftAmount(v: unknown): number | null {
  const n = Number(v)
  if (v === '' || v == null || !Number.isFinite(n) || !Number.isInteger(n)) return null
  if (n < GIFT_MIN || n > GIFT_MAX) return null
  return n
}

/** Date d'expiration : 1 an après l'achat (YYYY-MM-DD). */
export function expiryFrom(paidAt: Date): string {
  const d = new Date(paidAt)
  d.setUTCFullYear(d.getUTCFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export type VoucherState = 'en_attente' | 'annule' | 'utilise' | 'expire' | 'partiel' | 'actif'

/**
 * Statut affiché d'un bon. `today` au format YYYY-MM-DD. Un bon épuisé est
 * « utilisé » même après sa date de fin ; un bon expiré garde son solde visible.
 */
export function voucherState(
  v: { status: string; amount: number; balance: number; expires_at: string | null },
  today: string,
): VoucherState {
  if (v.status === 'pending') return 'en_attente'
  if (v.status === 'cancelled') return 'annule'
  if (Number(v.balance) <= 0) return 'utilise'
  if (v.expires_at && v.expires_at.slice(0, 10) < today) return 'expire'
  if (Number(v.balance) < Number(v.amount)) return 'partiel'
  return 'actif'
}

export function fmtDateFr(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function euros(n: number): string {
  return `${Number(n).toLocaleString('fr-FR', {
    minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`
}
