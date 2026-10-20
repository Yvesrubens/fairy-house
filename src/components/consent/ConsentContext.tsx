import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

// Gestion du consentement aux traceurs (RGPD / recommandations CNIL).
// Catégories :
//  - « necessary » : toujours actif (fonctionnement, réservation, paiement,
//    session admin) — non soumis à consentement.
//  - « external »  : services tiers qui déposent des cookies (actuellement la
//    carte Google Maps). Désactivé par défaut tant que la personne n'a pas
//    donné son accord : aucun traceur tiers n'est chargé avant le consentement.

export type ConsentCategories = { external: boolean }

const STORAGE_KEY = 'fh-cookie-consent-v1'

type Stored = { external: boolean; decidedAt: string }

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
    if (v && typeof v.external === 'boolean') return v as Stored
  } catch {
    /* localStorage indisponible (navigation privée, etc.) */
  }
  return null
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(() => read())
  const [prefsOpen, setPrefsOpen] = useState(false)

  function persist(external: boolean) {
    const v: Stored = { external, decidedAt: new Date().toISOString() }
    setStored(v)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
    } catch {
      /* ignore */
    }
  }

  const value: ConsentValue = {
    decided: stored !== null,
    consent: { external: stored?.external ?? false },
    acceptAll: () => {
      persist(true)
      setPrefsOpen(false)
    },
    refuseAll: () => {
      persist(false)
      setPrefsOpen(false)
    },
    save: (c) => {
      persist(c.external)
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
