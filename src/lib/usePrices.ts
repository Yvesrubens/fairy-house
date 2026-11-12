import { useEffect, useState } from 'react'
import { getTarifs } from './api'
import { DEFAULT_PRICES, pricesFromRow } from './booking'
import type { Prices } from './booking'

// Tarifs en vigueur (table `tarifs`, modifiable dans Admin → Tarifs).
// Chargés une seule fois puis partagés par toutes les étapes du tunnel, pour
// que l'affichage et le montant enregistré utilisent exactement les mêmes prix.
// En cas d'erreur réseau / table absente : repli sur les tarifs par défaut.

let cache: Prices | null = null
let pending: Promise<Prices> | null = null

function load(): Promise<Prices> {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = getTarifs()
      .then((row) => (cache = pricesFromRow(row)))
      .catch(() => DEFAULT_PRICES)
      .finally(() => {
        pending = null
      })
  }
  return pending
}

/** À appeler après une modification des tarifs dans l'admin. */
export function invalidatePrices() {
  cache = null
}

export function usePrices(): Prices {
  const [prices, setPrices] = useState<Prices>(cache ?? DEFAULT_PRICES)
  useEffect(() => {
    let active = true
    load().then((p) => active && setPrices(p))
    return () => {
      active = false
    }
  }, [])
  return prices
}
