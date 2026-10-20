import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

// Gestion du consentement aux traceurs (RGPD / recommandations CNIL).
// Catégories :
//  - « necessary » : toujours actif (fonctionnement, réservation, paiement,
//    session admin) — non soumis à consentement, non représenté ici.
//  - « analytics » : mesure d'audience (Google Analytics 4). Désactivé par
//    défaut ; GA4 n'est chargé qu'après accord.
//  - « external »  : services tiers (carte Google Maps). Désactivé par défaut.
// Aucun traceur soumis à consentement n'est chargé avant l'accord.

export type ConsentCategories = { analytics: boolean; external: boolean }

const STORAGE_KEY = 'fh-cookie-consent-v2'

type Stored = ConsentCategories & { decidedAt: string }

interface ConsentValue {
  decided: boolean
  consent: ConsentCategories
  acceptAll: () => void
  refuseAll: () => void
  save: (c: ConsentCategories) => void
  prefsOpen: boolean
  openPrefs: () => void
  closePrefs: () => void
}

const ConsentContext = createContext<ConsentValue | null>(null)

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (v && typeof v.analytics === 'boolean' && typeof v.external === 'boolean') {
      return v as Stored
    }
  } catch {
    /* localStorage indisponible (navigation privée, etc.) */
  }
  return null
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(() => read())
  const [prefsOpen, setPrefsOpen] = useState(false)

  function persist(cats: ConsentCategories) {
    const v: Stored = { ...cats, decidedAt: new Date().toISOString() }
    setStored(v)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }

  const value: ConsentValue = {
    decided: stored !== null,
    consent: {
      analytics: stored?.analytics ?? false,
      external: stored?.external ?? false,
    },
    acceptAll: () => {
      persist({ analytics: true, external: true })
      setPrefsOpen(false)
    },
    refuseAll: () => {
      persist({ analytics: false, external: false })
      setPrefsOpen(false)
    },
    save: (c) => {
      persist(c)
      setPrefsOpen(false)
    },
    prefsOpen,
    openPrefs: () => setPrefsOpen(true),
    closePrefs: () => setPrefsOpen(false),
  }

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}

export function useConsent(): ConsentValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent doit être utilisé dans ConsentProvider')
  return ctx
}
