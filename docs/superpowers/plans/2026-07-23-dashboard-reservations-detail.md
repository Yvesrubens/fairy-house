# Dashboard réservations — détail + colonnes enrichies — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre exploitable côté admin toutes les données des formulaires de réservation, via un panneau de détail complet et des colonnes de tableau enrichies.

**Architecture:** Des helpers d'affichage purs et testables (`src/lib/reservationLabels.ts`) partagés entre le tableau (`Reservations.tsx`) et une nouvelle modale de détail (`ReservationDetail.tsx`). Aucun changement de schéma DB ni d'API : tous les champs existent déjà sur le type `Reservation`.

**Tech Stack:** React 18, TypeScript, react-router-dom, Tailwind CSS v4, Vitest + @testing-library/react (jsdom).

## Global Constraints

- Aucune modification de schéma DB ni des fonctions `api/`.
- Réutiliser les helpers existants : `formatDate`, `formatEuro2` (`src/lib/format.ts`).
- Français pour tout le texte visible. Montants avec `formatEuro2` (2 décimales, ex. « 1 234,00 € »).
- Pas d'élargissement de périmètre au-delà de ce plan (pas de nouveaux graphiques/filtres).
- Style cohérent avec l'admin existant (cartes `rounded-2xl border bg-white`, badges `rounded-full px-3 py-1 text-xs font-medium`).
- Le périmètre d'une réservation se déduit de `Boolean(reservation.event_id)` (événement) vs absence (séjour).

---

### Task 1: Helpers d'affichage partagés

**Files:**
- Create: `src/lib/reservationLabels.ts`
- Test: `src/lib/reservationLabels.test.ts`

**Interfaces:**
- Consumes: type `Reservation` de `src/types/db.ts`.
- Produces:
  - `MODE_LABEL: Record<string, string>`
  - `ACCOMMODATION_LABEL: Record<string, string>`
  - `PAYMENT_METHOD_LABEL: Record<string, string>`
  - `paymentSummary(r: Pick<Reservation, 'payment_method' | 'payment_plan'>): string` → ex. `"Virement · 2×"`, `"CB · 1×"`, `""` si méthode nulle.
  - `roomsSummary(rooms: Reservation['rooms']): string` → `"Maison entière"`, ou `"Chambre A (2), Chambre B (1)"`, ou `""` si nul/vide.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- reservationLabels`
Expected: FAIL (module `./reservationLabels` introuvable).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/reservationLabels.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- reservationLabels`
Expected: PASS (tous les cas).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reservationLabels.ts src/lib/reservationLabels.test.ts
git commit -m "feat(admin): helpers d'affichage réservations (paiement, chambres, labels)"
```

---

### Task 2: Composant `ReservationDetail` (modale)

**Files:**
- Create: `src/admin/pages/ReservationDetail.tsx`
- Test: `src/admin/pages/ReservationDetail.test.tsx`

**Interfaces:**
- Consumes: `Reservation` (`src/types/db.ts`) ; `formatDate`, `formatEuro2` (`src/lib/format.ts`) ; `MODE_LABEL`, `ACCOMMODATION_LABEL`, `paymentSummary`, `roomsSummary` (`src/lib/reservationLabels.ts`) ; `STATUS_LABEL`/badges définis localement.
- Produces: `export default function ReservationDetail({ reservation, onClose }: { reservation: Reservation; onClose: () => void })`.

Notes de conception :
- Overlay `fixed inset-0 z-50 bg-black/50` centré ; clic overlay → `onClose` ; clic panneau `stopPropagation`.
- `useEffect` : écoute `keydown` `Escape` → `onClose` ; cleanup au démontage.
- En-tête dégradé `bg-gradient-to-r from-purple-600 to-pink-500` : référence, badge statut, date création (`formatDate(created_at)`), bouton croix.
- Sections cartes conditionnelles selon `isEvent = Boolean(reservation.event_id)`.
- Une petite sous-fonction locale `Row({ label, value })` rend une ligne seulement si `value` est non vide (ne rien afficher sinon).

- [ ] **Step 1: Write the failing test**

```tsx
// src/admin/pages/ReservationDetail.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ReservationDetail from './ReservationDetail'
import type { Reservation } from '../../types/db'

const base: Reservation = {
  id: '1', reference: 'FH-2026-00001', client_name: 'Alice Martin',
  client_email: 'alice@ex.fr', client_phone: '0600000000', type: 'Séjour',
  arrival_date: '2026-08-01', departure_date: '2026-08-03', guests: 2,
  amount: 480, status: 'pending', message: 'Merci !', event_id: null,
  mode: 'groupe', rooms: { wholeHouse: true }, beds: null,
  options: { linge: true, pension: false }, activities_requested: true,
  allergies: 'Arachides', payment_method: 'virement', payment_plan: 'split',
  total_ht: null, vat_rate: null, total_ttc: null, deposit_amount: 240,
  balance_amount: 240, balance_due_date: '2026-07-20', confirmation_sent_at: null,
  social_handle: null, emergency_contact: null, diet: null,
  accommodation_choice: null, shuttle: null, consent_reglement: null,
  consent_image: null, quote_lines: null, vat_breakdown: null,
  created_at: '2026-07-01T10:00:00Z',
}

describe('ReservationDetail (séjour)', () => {
  it('affiche client, formule et montant', () => {
    render(<ReservationDetail reservation={base} onClose={() => {}} />)
    expect(screen.getByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('FH-2026-00001')).toBeInTheDocument()
    expect(screen.getByText('Groupe')).toBeInTheDocument()
    expect(screen.getByText('Maison entière')).toBeInTheDocument()
    expect(screen.getByText('480,00 €')).toBeInTheDocument()
  })

  it('ferme via Échap', () => {
    const onClose = vi.fn()
    render(<ReservationDetail reservation={base} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("masque les infos d'événement pour un séjour", () => {
    render(<ReservationDetail reservation={base} onClose={() => {}} />)
    expect(screen.queryByText(/Hébergement/i)).not.toBeInTheDocument()
  })
})

describe('ReservationDetail (événement)', () => {
  it('affiche hébergement et régime', () => {
    const evt: Reservation = {
      ...base, event_id: 'e1', type: 'Retraite bien-être', rooms: null,
      accommodation_choice: 'tente', diet: 'Végétarien', shuttle: true,
      consent_reglement: true, consent_image: false,
    }
    render(<ReservationDetail reservation={evt} onClose={() => {}} />)
    expect(screen.getByText('En tente')).toBeInTheDocument()
    expect(screen.getByText('Végétarien')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ReservationDetail`
Expected: FAIL (module `./ReservationDetail` introuvable).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/admin/pages/ReservationDetail.tsx
import { useEffect, type ReactNode } from 'react'
import { formatDate, formatEuro2 } from '../../lib/format'
import {
  MODE_LABEL,
  ACCOMMODATION_LABEL,
  paymentSummary,
  roomsSummary,
} from '../../lib/reservationLabels'
import type { Reservation, ReservationStatus } from '../../types/db'

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
}
const STATUS_BADGE: Record<ReservationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-rose-100 text-rose-700',
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === ''
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (isEmpty(value)) return null
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <div className="divide-y">{children}</div>
    </div>
  )
}

export default function ReservationDetail({
  reservation: r,
  onClose,
}: {
  reservation: Reservation
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isEvent = Boolean(r.event_id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gray-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
          <div>
            <p className="text-lg font-bold">{r.reference}</p>
            <p className="mt-1 text-sm text-white/85">
              Créée le {formatDate(r.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}
            >
              {STATUS_LABEL[r.status]}
            </span>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-2xl leading-none text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {/* Client */}
          <Card title="Client">
            <Row label="Nom" value={r.client_name} />
            <Row label="Email" value={r.client_email} />
            <Row label="Téléphone" value={r.client_phone} />
            {isEvent && <Row label="Réseau social" value={r.social_handle} />}
            {isEvent && (
              <Row label="Contact d'urgence" value={r.emergency_contact} />
            )}
          </Card>

          {/* Séjour */}
          {!isEvent && (
            <Card title="Séjour">
              <Row label="Formule" value={r.mode ? MODE_LABEL[r.mode] : ''} />
              <Row label="Arrivée" value={formatDate(r.arrival_date)} />
              <Row
                label="Départ"
                value={r.departure_date ? formatDate(r.departure_date) : ''}
              />
              <Row label="Chambres" value={roomsSummary(r.rooms)} />
              <Row label="Lits" value={r.beds} />
              <Row label="Voyageurs" value={r.guests} />
              <Row
                label="Linge"
                value={r.options ? (r.options.linge ? 'Oui' : 'Non') : ''}
              />
              <Row
                label="Pension"
                value={r.options ? (r.options.pension ? 'Oui' : 'Non') : ''}
              />
              <Row
                label="Activités demandées"
                value={r.activities_requested ? 'Oui' : ''}
              />
              <Row label="Allergies" value={r.allergies} />
            </Card>
          )}

          {/* Événement */}
          {isEvent && (
            <Card title="Événement">
              <Row label="Événement" value={r.type} />
              <Row label="Date" value={formatDate(r.arrival_date)} />
              <Row
                label="Hébergement"
                value={
                  r.accommodation_choice
                    ? ACCOMMODATION_LABEL[r.accommodation_choice]
                    : ''
                }
              />
              <Row label="Navette" value={r.shuttle ? 'Oui' : ''} />
              <Row label="Régime" value={r.diet} />
              <Row
                label="Consent. règlement"
                value={
                  r.consent_reglement === null
                    ? ''
                    : r.consent_reglement
                      ? 'Oui'
                      : 'Non'
                }
              />
              <Row
                label="Consent. image"
                value={
                  r.consent_image === null
                    ? ''
                    : r.consent_image
                      ? 'Oui'
                      : 'Non'
                }
              />
            </Card>
          )}

          {/* Paiement */}
          <Card title="Paiement">
            <Row label="Montant total" value={formatEuro2(r.amount)} />
            <Row label="Mode de paiement" value={paymentSummary(r)} />
            {r.payment_plan === 'split' && (
              <>
                <Row
                  label="Acompte"
                  value={
                    r.deposit_amount != null ? formatEuro2(r.deposit_amount) : ''
                  }
                />
                <Row
                  label="Solde"
                  value={
                    r.balance_amount != null ? formatEuro2(r.balance_amount) : ''
                  }
                />
                <Row
                  label="Échéance du solde"
                  value={
                    r.balance_due_date ? formatDate(r.balance_due_date) : ''
                  }
                />
              </>
            )}
            <Row
              label="Confirmation"
              value={
                r.confirmation_sent_at
                  ? `Envoyée le ${formatDate(r.confirmation_sent_at)}`
                  : ''
              }
            />
          </Card>

          {/* Message */}
          {r.message && (
            <Card title="Message du client">
              <p className="py-2 text-sm text-gray-700">{r.message}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ReservationDetail`
Expected: PASS (séjour + événement + Échap).

- [ ] **Step 5: Commit**

```bash
git add src/admin/pages/ReservationDetail.tsx src/admin/pages/ReservationDetail.test.tsx
git commit -m "feat(admin): panneau de détail complet d'une réservation (séjour/événement)"
```

---

### Task 3: Colonnes enrichies + CSV (`Reservations.tsx`)

**Files:**
- Modify: `src/admin/pages/Reservations.tsx`

**Interfaces:**
- Consumes: `MODE_LABEL`, `paymentSummary` de `src/lib/reservationLabels.ts` ; `ACCOMMODATION_LABEL` (déjà défini localement — on peut le remplacer par l'import pour DRY).

Cette tâche ajoute des colonnes au tableau et au CSV. Pas de nouveau test unitaire (couverture assurée par Task 1 + vérif visuelle) ; la vérification est le build TypeScript + preview.

- [ ] **Step 1: Importer les helpers partagés**

En haut de `src/admin/pages/Reservations.tsx`, ajouter :

```tsx
import { MODE_LABEL, paymentSummary } from '../../lib/reservationLabels'
```

Supprimer le `ACCOMMODATION_LABEL` local (lignes 26-30) et l'importer depuis les helpers à la place :

```tsx
import { ACCOMMODATION_LABEL, MODE_LABEL, paymentSummary } from '../../lib/reservationLabels'
```

- [ ] **Step 2: Enrichir l'export CSV**

Remplacer le corps de `exportCSV` (le `data.map`) par :

```tsx
    const data = filtered.map((r) =>
      isEvent
        ? {
            reference: r.reference,
            client: r.client_name,
            email: r.client_email,
            telephone: r.client_phone ?? '',
            evenement: r.type,
            date: r.arrival_date,
            hebergement: ACCOMMODATION_LABEL[r.accommodation_choice ?? ''] ?? '',
            navette: r.shuttle ? 'Oui' : 'Non',
            regime: r.diet ?? '',
            paiement: paymentSummary(r),
            consent_reglement: r.consent_reglement ? 'Oui' : 'Non',
            consent_image: r.consent_image ? 'Oui' : 'Non',
            montant: r.amount,
            statut: STATUS_LABEL[r.status],
          }
        : {
            reference: r.reference,
            client: r.client_name,
            email: r.client_email,
            telephone: r.client_phone ?? '',
            type: r.type,
            arrivee: r.arrival_date,
            depart: r.departure_date ?? '',
            formule: r.mode ? MODE_LABEL[r.mode] : '',
            voyageurs: r.guests ?? '',
            paiement: paymentSummary(r),
            montant: r.amount,
            statut: STATUS_LABEL[r.status],
          },
    )
```

- [ ] **Step 3: Mettre à jour `colCount` et les en-têtes**

Remplacer `const colCount = isEvent ? 8 : 7` par :

```tsx
  const colCount = isEvent ? 12 : 11
```

Dans le `<thead>`, ajouter les nouvelles colonnes. Bloc événement (après « Navette ») :

```tsx
                  <th className="px-6 py-4">Tél</th>
                  <th className="px-6 py-4">Régime</th>
                  <th className="px-6 py-4">Paiement</th>
                  <th className="px-6 py-4">Consent.</th>
```

Bloc séjour (après « Départ ») :

```tsx
                  <th className="px-6 py-4">Tél</th>
                  <th className="px-6 py-4">Formule</th>
                  <th className="px-6 py-4">Voyageurs</th>
                  <th className="px-6 py-4">Paiement</th>
```

- [ ] **Step 4: Mettre à jour les cellules `<tbody>`**

Bloc événement (après la cellule « Navette ») :

```tsx
                    <td className="px-6 py-4 text-gray-700">
                      {r.client_phone ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.diet ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {paymentSummary(r) || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${r.consent_reglement ? 'bg-green-500' : 'bg-gray-300'}`}
                          title="Règlement"
                        />
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${r.consent_image ? 'bg-green-500' : 'bg-gray-300'}`}
                          title="Droit à l'image"
                        />
                      </div>
                    </td>
```

Bloc séjour (après la cellule « Départ ») :

```tsx
                    <td className="px-6 py-4 text-gray-700">
                      {r.client_phone ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {r.mode ? MODE_LABEL[r.mode] : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.guests ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {paymentSummary(r) || '—'}
                    </td>
```

- [ ] **Step 5: Vérifier build + tests**

Run: `npm run build`
Expected: build OK (l'import `ReservationDetail` est résolu, pas d'erreur TS).

Run: `npm test`
Expected: PASS (tous les tests, dont Task 1 et Task 2).

- [ ] **Step 6: Vérification visuelle (preview)**

Démarrer le dev server, se connecter à l'admin, ouvrir « Réservations séjour » et « Réservations événement » : vérifier les nouvelles colonnes, cliquer « Détails » sur une résa de chaque type, vérifier les sections adaptées et la fermeture (croix / overlay / Échap).

- [ ] **Step 7: Commit**

```bash
git add src/admin/pages/Reservations.tsx
git commit -m "feat(admin): colonnes enrichies + export CSV réservations (tél, formule/régime, paiement, consentements)"
```

---

## Self-Review

- **Spec coverage :** colonnes enrichies (Task 3), panneau détail complet (Task 2), helpers partagés/DRY (Task 1), scopes séjour/événement (Task 2 & 3), montant TTC sans détail HT/TVA (Task 2 Paiement), fermeture croix/overlay/Échap (Task 2). ✓
- **Placeholder scan :** aucun TBD/TODO ; tout le code est fourni. ✓
- **Type consistency :** `paymentSummary`, `roomsSummary`, `MODE_LABEL`, `ACCOMMODATION_LABEL` définis en Task 1 et consommés à l'identique en Task 2 & 3. `ReservationDetail` signature `{ reservation, onClose }` cohérente avec l'usage dans `Reservations.tsx`. ✓
