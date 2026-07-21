# Tunnel de réservation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la réservation par un tunnel multi-étapes (parcours Groupe / Individuel) avec sélection chambres/lits, options, pré-paiement et paiement virement fonctionnel (CB/PayPal désactivés), + mails confirmation et devis/RIB.

**Architecture:** Logique de calcul pure et testée dans `src/lib/booking.ts`. Wizard React en page `/reserver` orchestré par `Reservation.tsx` avec un composant par étape. Persistance via extension de la table `reservations`. Envoi des mails par un nouvel endpoint serverless public `api/book.ts` réutilisant des helpers partagés avec l'endpoint admin existant.

**Tech Stack:** React 18 + TypeScript, react-router-dom v6, Vite, Vitest, Supabase (Postgres + RLS), Vercel serverless functions, Resend (email), pdf-lib (devis PDF), Tailwind.

## Global Constraints

- **Tarifs (HT)** : séjour 45 € / nuit / personne ; Linge 8 € / personne / nuit ; Pension 20 € / personne / nuit.
- **TVA** : 10 % sur toutes les lignes du tunnel. TTC = HT × 1,10.
- **Chambres** : Litha (cap. 3), Mabbon (cap. 5), Imbolc (cap. 4). Capacité maison = 12. Lits individuels = 11.
- **Disponibilités** : aucun blocage automatique. Réservation créée en statut `pending`.
- **Paiement** : virement seul actif ; CB et PayPal présents mais désactivés.
- **Paiement 2×** : proposé uniquement si arrivée à > 30 jours. 50 % acompte + 50 % solde ; échéance solde = arrivée − 30 jours.
- **Langue** : tout le texte visible en français.
- **RIB/SIRET/TVA** : via variables d'environnement (placeholders admis) — `FH_RIB_IBAN`, `FH_RIB_BIC`, `FH_RIB_TITULAIRE`, `FH_SIRET`, `FH_TVA`.
- **Style** : suivre les classes Tailwind existantes (`fairy-gold`, `fieldCls`, boutons arrondis).

---

## File Structure

- Create `src/lib/booking.ts` — constantes (chambres, tarifs) + fonctions de calcul pures.
- Create `src/lib/booking.test.ts` — tests unitaires vitest.
- Create `supabase/patch-2026-07-reservation-tunnel.sql` — extension table `reservations`.
- Modify `src/types/db.ts` — champs additionnels sur `Reservation`.
- Modify `src/lib/api.ts` — `ReservationInput` étendu + appel à `api/book`.
- Create `api/_lib/devis-pdf.ts` — génération PDF devis (extrait de `send-devis.ts`), TVA paramétrable.
- Create `api/_lib/confirmation.ts` — template HTML/texte de confirmation (extrait de `send-confirmation.ts`).
- Modify `api/send-devis.ts` — utilise `api/_lib/devis-pdf.ts`.
- Modify `api/send-confirmation.ts` — utilise `api/_lib/confirmation.ts`.
- Create `api/book.ts` — endpoint public : mail confirmation + (si virement) mail devis+RIB.
- Create `src/components/reservation/StepStayType.tsx`
- Create `src/components/reservation/StepGroupSelection.tsx`
- Create `src/components/reservation/StepIndividualSelection.tsx`
- Create `src/components/reservation/StepDetails.tsx`
- Create `src/components/reservation/StepPayment.tsx`
- Modify `src/pages/Reservation.tsx` — orchestrateur du wizard.
- Modify `src/pages/Home.tsx` + `src/pages/LeLieu.tsx` — boutons « Réserver » → `navigate('/reserver')`.

---

## Task 1: Logique de calcul `booking.ts` (constantes + calculs purs)

**Files:**
- Create: `src/lib/booking.ts`
- Test: `src/lib/booking.test.ts`

**Interfaces:**
- Produces:
  - `ROOMS: { name: string; capacity: number }[]` — `[{name:'Litha',capacity:3},{name:'Mabbon',capacity:5},{name:'Imbolc',capacity:4}]`
  - `HOUSE_CAPACITY = 12`, `TOTAL_BEDS = 11`
  - `PRICE_PER_PERSON_NIGHT = 45`, `LINGE_PER_PERSON_NIGHT = 8`, `PENSION_PER_PERSON_NIGHT = 20`, `VAT_RATE = 10`, `SPLIT_MIN_DAYS = 30`
  - `nights(arrival: string, departure: string): number` — nb de nuits (≥ 0)
  - `type Options = { linge: boolean; pension: boolean }`
  - `type Quote = { lines: { label: string; qty: number; unitPrice: number; total: number }[]; totalHt: number; vat: number; totalTtc: number }`
  - `computeQuote(pers: number, nightsCount: number, opts: Options): Quote`
  - `canSplit(arrival: string, today: string): boolean` — vrai si arrival > today + 30 j
  - `splitPlan(totalTtc: number, arrival: string): { deposit: number; balance: number; balanceDueDate: string }`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/booking.test.ts
import { describe, it, expect } from 'vitest'
import {
  ROOMS, HOUSE_CAPACITY, TOTAL_BEDS, VAT_RATE,
  nights, computeQuote, canSplit, splitPlan,
} from './booking'

describe('booking constants', () => {
  it('has 3 rooms totalling capacity 12', () => {
    expect(ROOMS.map((r) => r.name)).toEqual(['Litha', 'Mabbon', 'Imbolc'])
    expect(ROOMS.reduce((s, r) => s + r.capacity, 0)).toBe(HOUSE_CAPACITY)
    expect(HOUSE_CAPACITY).toBe(12)
    expect(TOTAL_BEDS).toBe(11)
  })
})

describe('nights', () => {
  it('counts nights between two dates', () => {
    expect(nights('2026-08-01', '2026-08-04')).toBe(3)
  })
  it('returns 0 when dates are equal or reversed', () => {
    expect(nights('2026-08-01', '2026-08-01')).toBe(0)
    expect(nights('2026-08-04', '2026-08-01')).toBe(0)
  })
})

describe('computeQuote', () => {
  it('computes stay only with 10% VAT', () => {
    // 2 pers × 3 nuits × 45 = 270 HT
    const q = computeQuote(2, 3, { linge: false, pension: false })
    expect(q.totalHt).toBe(270)
    expect(q.vat).toBe(27)
    expect(q.totalTtc).toBe(297)
    expect(q.lines).toHaveLength(1)
  })
  it('adds linge and pension lines', () => {
    // séjour 270 + linge 2×3×8=48 + pension 2×3×20=120 = 438 HT
    const q = computeQuote(2, 3, { linge: true, pension: true })
    expect(q.totalHt).toBe(438)
    expect(q.vat).toBeCloseTo(43.8, 2)
    expect(q.totalTtc).toBeCloseTo(481.8, 2)
    expect(q.lines).toHaveLength(3)
  })
})

describe('canSplit', () => {
  it('true when arrival is more than 30 days ahead', () => {
    expect(canSplit('2026-09-01', '2026-07-21')).toBe(true)
  })
  it('false when arrival is within 30 days', () => {
    expect(canSplit('2026-08-10', '2026-07-21')).toBe(false)
  })
})

describe('splitPlan', () => {
  it('splits 50/50 and sets balance due 30 days before arrival', () => {
    const p = splitPlan(481.8, '2026-09-01')
    expect(p.deposit).toBeCloseTo(240.9, 2)
    expect(p.balance).toBeCloseTo(240.9, 2)
    expect(p.balanceDueDate).toBe('2026-08-02')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/booking.test.ts`
Expected: FAIL (module `./booking` introuvable).

- [ ] **Step 3: Implement `src/lib/booking.ts`**

```typescript
// src/lib/booking.ts
// Constantes et calculs purs du tunnel de réservation. Aucun effet de bord :
// entièrement testable (voir booking.test.ts).

export const ROOMS = [
  { name: 'Litha', capacity: 3 },
  { name: 'Mabbon', capacity: 5 },
  { name: 'Imbolc', capacity: 4 },
] as const

export const HOUSE_CAPACITY = 12
export const TOTAL_BEDS = 11

export const PRICE_PER_PERSON_NIGHT = 45
export const LINGE_PER_PERSON_NIGHT = 8
export const PENSION_PER_PERSON_NIGHT = 20
export const VAT_RATE = 10
export const SPLIT_MIN_DAYS = 30

export interface Options {
  linge: boolean
  pension: boolean
}

export interface QuoteLine {
  label: string
  qty: number
  unitPrice: number
  total: number
}

export interface Quote {
  lines: QuoteLine[]
  totalHt: number
  vat: number
  totalTtc: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Nombre de nuits entre deux dates ISO (YYYY-MM-DD). 0 si égales ou inversées. */
export function nights(arrival: string, departure: string): number {
  const a = Date.parse(arrival)
  const d = Date.parse(departure)
  if (Number.isNaN(a) || Number.isNaN(d) || d <= a) return 0
  return Math.round((d - a) / 86_400_000)
}

/** Devis chiffré pour `pers` personnes, `nightsCount` nuits et les options. */
export function computeQuote(
  pers: number,
  nightsCount: number,
  opts: Options,
): Quote {
  const lines: QuoteLine[] = []
  const stay = PRICE_PER_PERSON_NIGHT * pers * nightsCount
  lines.push({
    label: 'Séjour (nuitées)',
    qty: pers * nightsCount,
    unitPrice: PRICE_PER_PERSON_NIGHT,
    total: stay,
  })
  if (opts.linge) {
    const t = LINGE_PER_PERSON_NIGHT * pers * nightsCount
    lines.push({ label: 'Linge de maison', qty: pers * nightsCount, unitPrice: LINGE_PER_PERSON_NIGHT, total: t })
  }
  if (opts.pension) {
    const t = PENSION_PER_PERSON_NIGHT * pers * nightsCount
    lines.push({ label: 'Pension complète', qty: pers * nightsCount, unitPrice: PENSION_PER_PERSON_NIGHT, total: t })
  }
  const totalHt = round2(lines.reduce((s, l) => s + l.total, 0))
  const vat = round2((totalHt * VAT_RATE) / 100)
  const totalTtc = round2(totalHt + vat)
  return { lines, totalHt, vat, totalTtc }
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Le paiement en 2 fois est-il possible ? (arrivée à plus de 30 j de `today`) */
export function canSplit(arrival: string, today: string): boolean {
  return nights(today, arrival) > SPLIT_MIN_DAYS
}

/** Échéancier 50/50 ; solde dû 30 jours avant l'arrivée. */
export function splitPlan(
  totalTtc: number,
  arrival: string,
): { deposit: number; balance: number; balanceDueDate: string } {
  const deposit = round2(totalTtc / 2)
  const balance = round2(totalTtc - deposit)
  return { deposit, balance, balanceDueDate: addDays(arrival, -SPLIT_MIN_DAYS) }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/booking.test.ts`
Expected: PASS (tous les tests verts).

- [ ] **Step 5: Commit**

```bash
git add src/lib/booking.ts src/lib/booking.test.ts
git commit -m "feat: logique de calcul du tunnel de réservation (booking.ts) + tests"
```

---

## Task 2: Patch SQL — extension de la table `reservations`

**Files:**
- Create: `supabase/patch-2026-07-reservation-tunnel.sql`
- Modify: `supabase/schema.sql` (ajouter les mêmes colonnes dans la définition de référence)

**Interfaces:**
- Produces: colonnes `mode, rooms, beds, options, activities_requested, allergies, payment_method, payment_plan, total_ht, vat_rate, total_ttc, deposit_amount, balance_amount, balance_due_date` sur `reservations`.

- [ ] **Step 1: Écrire le patch SQL**

```sql
-- supabase/patch-2026-07-reservation-tunnel.sql
-- Fairy House — patch incrémental : tunnel de réservation.
-- À exécuter dans Supabase > SQL Editor sur une base existante.
-- Colonnes additives et nullable : n'impacte pas les réservations existantes.

alter table reservations add column if not exists mode text;                 -- 'groupe' | 'individuel'
alter table reservations add column if not exists rooms jsonb;               -- [{room,guests}] ou {wholeHouse:true}
alter table reservations add column if not exists beds int;                  -- parcours individuel
alter table reservations add column if not exists options jsonb;             -- {linge:bool,pension:bool}
alter table reservations add column if not exists activities_requested boolean not null default false;
alter table reservations add column if not exists allergies text;
alter table reservations add column if not exists payment_method text;       -- 'virement' | 'cb' | 'paypal'
alter table reservations add column if not exists payment_plan text;         -- 'once' | 'split'
alter table reservations add column if not exists total_ht numeric;
alter table reservations add column if not exists vat_rate numeric default 10;
alter table reservations add column if not exists total_ttc numeric;
alter table reservations add column if not exists deposit_amount numeric;
alter table reservations add column if not exists balance_amount numeric;
alter table reservations add column if not exists balance_due_date date;
```

- [ ] **Step 2: Refléter dans `schema.sql`**

Dans `supabase/schema.sql`, dans le `create table if not exists reservations (...)`, ajouter après la ligne `event_id uuid,` :

```sql
  mode text,
  rooms jsonb,
  beds int,
  options jsonb,
  activities_requested boolean not null default false,
  allergies text,
  payment_method text,
  payment_plan text,
  total_ht numeric,
  vat_rate numeric default 10,
  total_ttc numeric,
  deposit_amount numeric,
  balance_amount numeric,
  balance_due_date date,
```

- [ ] **Step 3: Commit**

```bash
git add supabase/patch-2026-07-reservation-tunnel.sql supabase/schema.sql
git commit -m "feat: colonnes réservation pour le tunnel (patch SQL + schema)"
```

> Note humaine : exécuter ce patch dans Supabase avant de tester l'insertion. Sans les colonnes, l'insert échoue.

---

## Task 3: Types + `createReservation` étendu

**Files:**
- Modify: `src/types/db.ts`
- Modify: `src/lib/api.ts`

**Interfaces:**
- Consumes: `Quote`, `Options` de `src/lib/booking.ts` (Task 1) ; colonnes SQL (Task 2).
- Produces:
  - `ReservationInput` étendu (voir code).
  - `createReservation(input): Promise<{ id: string; reference: string }>` — retourne désormais l'id + la référence (nécessaire à Task 7 pour appeler `/api/book`).

- [ ] **Step 1: Étendre le type `Reservation` dans `src/types/db.ts`**

Ajouter ces champs à l'interface `Reservation` (après `event_id: string | null`) :

```typescript
  mode: 'groupe' | 'individuel' | null
  rooms: { room: string; guests: number }[] | { wholeHouse: true } | null
  beds: number | null
  options: { linge: boolean; pension: boolean } | null
  activities_requested: boolean
  allergies: string | null
  payment_method: 'virement' | 'cb' | 'paypal' | null
  payment_plan: 'once' | 'split' | null
  total_ht: number | null
  vat_rate: number | null
  total_ttc: number | null
  deposit_amount: number | null
  balance_amount: number | null
  balance_due_date: string | null
```

- [ ] **Step 2: Étendre `ReservationInput` et `createReservation` dans `src/lib/api.ts`**

Remplacer l'interface `ReservationInput` et la fonction `createReservation` par :

```typescript
export interface ReservationInput {
  client_name: string
  client_email: string
  client_phone?: string
  type: string
  arrival_date: string
  departure_date?: string
  guests?: number
  message?: string
  event_id?: string
  // Tunnel de réservation
  mode?: 'groupe' | 'individuel'
  rooms?: { room: string; guests: number }[] | { wholeHouse: true }
  beds?: number
  options?: { linge: boolean; pension: boolean }
  activities_requested?: boolean
  allergies?: string
  payment_method?: 'virement' | 'cb' | 'paypal'
  payment_plan?: 'once' | 'split'
  total_ht?: number
  vat_rate?: number
  total_ttc?: number
  deposit_amount?: number
  balance_amount?: number
  balance_due_date?: string
}

export async function createReservation(
  input: ReservationInput,
): Promise<{ id: string; reference: string }> {
  const { data: ref, error: rErr } = await supabase.rpc(
    'next_reservation_reference',
  )
  if (rErr) throw new Error(rErr.message)
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...input, reference: ref, amount: input.total_ttc ?? 0 })
    .select('id, reference')
    .single()
  if (error) throw new Error(error.message)
  return { id: data.id as string, reference: data.reference as string }
}
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur (les autres appelants de `createReservation` n'utilisent pas la valeur de retour).

- [ ] **Step 4: Commit**

```bash
git add src/types/db.ts src/lib/api.ts
git commit -m "feat: ReservationInput étendu + createReservation renvoie id/référence"
```

---

## Task 4: Helpers API partagés (PDF devis + template confirmation)

**Files:**
- Create: `api/_lib/devis-pdf.ts`
- Create: `api/_lib/confirmation.ts`
- Modify: `api/send-devis.ts`
- Modify: `api/send-confirmation.ts`

**Interfaces:**
- Produces:
  - `buildDevisPdf(opts): Promise<Uint8Array>` — même signature que la fonction `buildPdf` actuelle de `send-devis.ts`, mais `vatRate` déjà présent dans `opts` (aucune valeur codée en dur). Ajoute un bloc RIB si `opts.rib` fourni.
  - `eur(n: number): string`, `fmtDate(iso: string | null): string` (réexportés depuis `devis-pdf.ts`).
  - `confirmationEmail(r): { html: string; text: string }` — génère le HTML et le texte du mail de confirmation à partir d'une ligne réservation.
- Consumes: `pdf-lib`, types réservation.

- [ ] **Step 1: Créer `api/_lib/devis-pdf.ts`**

Déplacer tel quel depuis `api/send-devis.ts` : les constantes `ISSUER`, `GOLD`, `DARK`, `GREY`, l'interface `Line`, les fonctions `eur`, `fmtDate`, et la fonction `buildPdf` (renommée `buildDevisPdf`). Ajouter au type d'options un champ optionnel `rib?: { iban: string; bic: string; titulaire: string }` et, juste avant le pied de page, dessiner le RIB s'il est fourni :

```typescript
  // RIB (paiement par virement)
  if (opts.rib) {
    text('Coordonnées bancaires (virement)', M, 175, 9, bold)
    text(`Titulaire : ${opts.rib.titulaire}`, M, 161, 9, font, GREY)
    text(`IBAN : ${opts.rib.iban}`, M, 149, 9, font, GREY)
    text(`BIC : ${opts.rib.bic}`, M, 137, 9, font, GREY)
  }
```

Exporter : `export { eur, fmtDate }` et `export async function buildDevisPdf(...)`. Garder `ISSUER` lisant `process.env.FH_SIRET` / `FH_TVA` comme aujourd'hui.

- [ ] **Step 2: Adapter `api/send-devis.ts`**

Supprimer de `send-devis.ts` les morceaux déplacés et importer depuis le helper :

```typescript
import { buildDevisPdf, eur, fmtDate } from './_lib/devis-pdf'
```

Remplacer l'appel `buildPdf({...})` par `buildDevisPdf({...})`. Le `vatRate` reste `20` ici (comportement admin inchangé). Supprimer les définitions locales désormais dupliquées (`buildPdf`, `eur`, `fmtDate`, `ISSUER`, `Line`, couleurs) — elles viennent du helper. `fmtDate` n'était pas utilisé hors PDF dans ce fichier ; retirer l'import s'il devient inutilisé.

- [ ] **Step 3: Créer `api/_lib/confirmation.ts`**

Extraire de `api/send-confirmation.ts` la construction du `html` et du `text` dans une fonction pure :

```typescript
// api/_lib/confirmation.ts
const CONTACT = {
  email: 'contact@fairyhousecollectif.com',
  phone: '+33 1 23 45 67 89',
  address: 'Le Grand Leu, 45230 La Chapelle sur Aveyron',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function confirmationEmail(r: any): { html: string; text: string } {
  const amountLine =
    Number(r.amount) > 0
      ? `<tr><td style="padding:6px 0;color:#555">Montant TTC</td><td style="padding:6px 0;font-weight:600">${Number(
          r.amount,
        ).toLocaleString('fr-FR')} €</td></tr>`
      : ''
  const html = `... (déplacer le HTML existant de send-confirmation.ts ici, inchangé) ...`
  const text = `... (déplacer le texte existant ici, inchangé) ...`
  return { html, text }
}
```

(Copier verbatim les gabarits `html` et `text` actuels de `send-confirmation.ts`.)

- [ ] **Step 4: Adapter `api/send-confirmation.ts`**

Importer et utiliser le helper :

```typescript
import { confirmationEmail } from './_lib/confirmation'
// ...
const { html, text } = confirmationEmail(r)
```

Supprimer les définitions locales dupliquées (`CONTACT`, `fmtDate`, gabarits inline).

- [ ] **Step 5: Vérifier le build TypeScript des fonctions API**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/devis-pdf.ts api/_lib/confirmation.ts api/send-devis.ts api/send-confirmation.ts
git commit -m "refactor: extraction helpers devis PDF + template confirmation"
```

---

## Task 5: Endpoint public `api/book.ts`

**Files:**
- Create: `api/book.ts`

**Interfaces:**
- Consumes: `buildDevisPdf`, `eur` (Task 4) ; `confirmationEmail` (Task 4) ; colonnes réservation (Task 2).
- Produces: `POST /api/book` avec body `{ reservationId: string }`. Envoie le mail de confirmation ; si `payment_method === 'virement'`, envoie aussi un mail devis + RIB. Réponse `{ ok: true }`.

**Comportement :** endpoint PUBLIC (pas d'auth admin). Il **relit la réservation en base** par son id et **recalcule** les lignes de devis à partir des colonnes stockées (jamais depuis le body) pour éviter toute falsification de montant.

- [ ] **Step 1: Écrire `api/book.ts`**

```typescript
// Fonction serverless Vercel PUBLIQUE : à la validation d'une réservation du
// tunnel, envoie le mail de confirmation et, si paiement par virement, un mail
// devis + RIB. Les montants sont relus/recalculés depuis la base (source de
// vérité), jamais fournis par le client.
import { createClient } from '@supabase/supabase-js'
import { buildDevisPdf, eur } from './_lib/devis-pdf'
import { confirmationEmail } from './_lib/confirmation'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

const RIB = {
  iban: process.env.FH_RIB_IBAN || 'IBAN : à compléter',
  bic: process.env.FH_RIB_BIC || 'BIC : à compléter',
  titulaire: process.env.FH_RIB_TITULAIRE || 'Fairy House',
}

async function sendEmail(payload: Record<string, unknown>): Promise<boolean> {
  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, ...payload }),
  })
  return send.ok
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  const { reservationId } = req.body || {}
  if (!reservationId) {
    res.status(400).json({ error: 'reservationId manquant' })
    return
  }
  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ error: 'Configuration email manquante (RESEND).' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: r, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle()
  if (error || !r) {
    res.status(404).json({ error: 'Réservation introuvable' })
    return
  }

  // 1) Mail de confirmation (toujours)
  const { html, text } = confirmationEmail(r)
  const okConfirm = await sendEmail({
    to: [r.client_email],
    subject: `Confirmation de votre demande — Fairy House (${r.reference})`,
    html,
    text,
  })

  // 2) Mail devis + RIB (si virement)
  let okDevis = true
  if (r.payment_method === 'virement') {
    const { data: ref } = await supabase.rpc('next_devis_reference')
    const reference = (ref as string) || r.reference
    const lines = [
      { designation: 'Séjour (nuitées)', qty: 1, unitPrice: Number(r.total_ht) || 0 },
    ]
    const vatRate = Number(r.vat_rate) || 10
    const totalHt = Number(r.total_ht) || 0
    const totalTtc = Number(r.total_ttc) || 0
    const pdf = await buildDevisPdf({
      reference,
      reservationRef: r.reference,
      clientName: r.client_name,
      clientEmail: r.client_email,
      lines,
      totalHt,
      vatRate,
      totalTtc,
      validityDays: 30,
      rib: RIB,
    })
    const pdfBase64 = Buffer.from(pdf).toString('base64')
    const planNote =
      r.payment_plan === 'split'
        ? `<p>Paiement en 2 fois : acompte de <strong>${eur(Number(r.deposit_amount) || 0)}</strong> à la réservation, solde de <strong>${eur(Number(r.balance_amount) || 0)}</strong> avant le ${r.balance_due_date}.</p>`
        : ''
    const devisHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <div style="background:#c79c37;padding:20px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px">FAIRY HOUSE</h1>
      </div>
      <div style="padding:24px">
        <p>Bonjour ${r.client_name},</p>
        <p style="line-height:1.6;color:#333">Veuillez trouver ci-joint votre devis <strong>${reference}</strong>. Pour confirmer, merci de régler par virement :</p>
        <p style="font-size:16px"><strong>Total TTC : ${eur(totalTtc)}</strong></p>
        ${planNote}
        <div style="background:#f7f5ef;border:1px solid #e0dcd1;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px;font-weight:600;color:#c79c37">Coordonnées bancaires</p>
          <p style="margin:0;color:#333">Titulaire : ${RIB.titulaire}<br/>IBAN : ${RIB.iban}<br/>BIC : ${RIB.bic}</p>
        </div>
        <p style="margin-top:20px">Avec toute notre douceur,<br/><strong>L'équipe Fairy House</strong></p>
      </div>
    </div>`
    okDevis = await sendEmail({
      to: [r.client_email],
      subject: `Votre devis Fairy House — ${reference}`,
      html: devisHtml,
      attachments: [{ filename: `${reference}.pdf`, content: pdfBase64 }],
    })
  }

  // La réservation reste enregistrée quoi qu'il arrive ; on signale juste l'état d'envoi.
  res.status(200).json({ ok: okConfirm && okDevis, emailConfirm: okConfirm, emailDevis: okDevis })
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add api/book.ts
git commit -m "feat: endpoint public /api/book (mail confirmation + devis/RIB virement)"
```

---

## Task 6: Composants d'étape du wizard

**Files:**
- Create: `src/components/reservation/StepStayType.tsx`
- Create: `src/components/reservation/StepGroupSelection.tsx`
- Create: `src/components/reservation/StepIndividualSelection.tsx`
- Create: `src/components/reservation/StepDetails.tsx`
- Create: `src/components/reservation/StepPayment.tsx`

**Interfaces (état partagé, défini ici et consommé par Task 7) :**

```typescript
// Type d'état du wizard (à placer en tête de src/pages/Reservation.tsx, Task 7,
// et importé par les étapes via un fichier de types partagé si besoin).
export interface BookingState {
  mode: 'groupe' | 'individuel' | null
  rooms: { room: string; guests: number }[] // groupe (vide si maison complète)
  wholeHouse: boolean                         // groupe
  beds: number                                // individuel (1..11)
  arrival: string
  departure: string
  options: { linge: boolean; pension: boolean }
  firstName: string
  lastName: string
  email: string
  phone: string
  activitiesRequested: boolean // groupe
  allergies: string            // individuel
  message: string
  paymentPlan: 'once' | 'split'
  paymentMethod: 'virement' | 'cb' | 'paypal'
}
```

Chaque étape reçoit `{ state, setState, onNext, onBack }` où `setState: (patch: Partial<BookingState>) => void`. Réutiliser la classe `fieldCls` (la copier depuis `ReservationForm.tsx`) et les boutons arrondis dorés existants.

- [ ] **Step 1: `StepStayType.tsx`** — deux grandes cartes cliquables « Séjour Groupe » / « Séjour Individuel ». Au clic : `setState({ mode })` puis `onNext()`. Pas de bouton retour (première étape).

- [ ] **Step 2: `StepGroupSelection.tsx`** — importer `ROOMS, HOUSE_CAPACITY` de `../../lib/booking`. Un toggle « Maison complète » (`wholeHouse`). Si non coché : pour chaque `ROOMS`, une case + un `select` du nombre de personnes (1..capacité). Champs dates arrivée/départ (`min={today}`). Options Linge/Pension (2 cases). Validation avant `onNext` : au moins une chambre choisie ou maison complète, et `nights(arrival, departure) >= 1`. Bouton Retour → `onBack`.

- [ ] **Step 3: `StepIndividualSelection.tsx`** — importer `TOTAL_BEDS`. Un `select` « nombre de lits » (1..`TOTAL_BEDS`). Dates arrivée/départ. Options Linge/Pension. Validation : `beds >= 1` et `nights >= 1`. Boutons Retour/Suivant.

- [ ] **Step 4: `StepDetails.tsx`** — champs nom, prénom, email (type email), téléphone (type tel), tous requis. Si `state.mode === 'groupe'` : case « Je veux être contactée pour organiser des activités sur place (construction d'un séjour sur mesure) » (`activitiesRequested`) + textarea « Demandes diverses » (`message`). Si `state.mode === 'individuel'` : champ « Allergies alimentaires » (`allergies`) + textarea « Demandes diverses » (`message`). Calculer `canSplit(state.arrival, todayISO)` ; si vrai, afficher un choix paiement 1× / 2× (`paymentPlan`). Validation : nom/prénom/email/téléphone non vides. Boutons Retour/Suivant.

- [ ] **Step 5: `StepPayment.tsx`** — calculer `pers` (groupe : somme `guests` des chambres, ou `HOUSE_CAPACITY` si maison complète ; individuel : `beds`) et `nightsCount = nights(arrival, departure)`. Appeler `computeQuote(pers, nightsCount, options)`. Afficher le récapitulatif : lignes, Total HT, TVA 10 %, Total TTC ; si `paymentPlan === 'split'`, afficher `splitPlan(totalTtc, arrival)` (acompte, solde, date). Trois boutons de moyen de paiement : **Virement** (actif, sélectionnable), **CB** et **PayPal** (`disabled`, libellé « Bientôt disponible »). Bouton « Valider ma réservation » (désactivé tant que `paymentMethod` non choisi) qui appelle `onSubmit()` fourni par Task 7. Bouton Retour.

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur (les étapes peuvent être importées).

- [ ] **Step 7: Commit**

```bash
git add src/components/reservation/
git commit -m "feat: composants d'étape du tunnel de réservation"
```

---

## Task 7: Orchestrateur `Reservation.tsx` + branchement soumission

**Files:**
- Modify: `src/pages/Reservation.tsx`

**Interfaces:**
- Consumes: étapes (Task 6), `createReservation` (Task 3), `computeQuote/nights/splitPlan/canSplit/ROOMS/HOUSE_CAPACITY` (Task 1).
- Produces: page `/reserver` complète.

- [ ] **Step 1: Réécrire `Reservation.tsx` en orchestrateur**

Structure :
- État `step` (0..4) et `state: BookingState` (valeurs initiales : `mode:null, rooms:[], wholeHouse:false, beds:1, arrival:'', departure:'', options:{linge:false,pension:false}, ...strings vides, paymentPlan:'once', paymentMethod:null-cast)`.
- `setState = (patch) => setStateRaw((s) => ({ ...s, ...patch }))`.
- Rendu conditionnel : step 0 → `StepStayType` ; step 1 → `StepGroupSelection` ou `StepIndividualSelection` selon `state.mode` ; step 2 → `StepDetails` ; step 3 → `StepPayment`. (Barre de progression optionnelle en haut.)
- `onNext = () => setStep((s) => s + 1)`, `onBack = () => setStep((s) => s - 1)`.
- `onSubmit` (passé à `StepPayment`) :

```typescript
async function onSubmit() {
  const pers = state.wholeHouse
    ? HOUSE_CAPACITY
    : state.mode === 'groupe'
      ? state.rooms.reduce((s, r) => s + r.guests, 0)
      : state.beds
  const n = nights(state.arrival, state.departure)
  const quote = computeQuote(pers, n, state.options)
  const split =
    state.paymentPlan === 'split'
      ? splitPlan(quote.totalTtc, state.arrival)
      : null
  const typeLabel =
    state.mode === 'groupe'
      ? state.wholeHouse
        ? 'Séjour groupe — Maison complète'
        : `Séjour groupe — ${state.rooms.map((r) => r.room).join(', ')}`
      : `Séjour individuel — ${state.beds} lit(s)`
  try {
    setBusy(true)
    const { id } = await createReservation({
      client_name: `${state.firstName} ${state.lastName}`.trim(),
      client_email: state.email,
      client_phone: state.phone || undefined,
      type: typeLabel,
      arrival_date: state.arrival,
      departure_date: state.departure || undefined,
      guests: pers,
      message: state.message || undefined,
      mode: state.mode ?? undefined,
      rooms: state.wholeHouse ? { wholeHouse: true } : state.rooms,
      beds: state.mode === 'individuel' ? state.beds : undefined,
      options: state.options,
      activities_requested: state.activitiesRequested,
      allergies: state.allergies || undefined,
      payment_method: state.paymentMethod,
      payment_plan: state.paymentPlan,
      total_ht: quote.totalHt,
      vat_rate: 10,
      total_ttc: quote.totalTtc,
      deposit_amount: split?.deposit,
      balance_amount: split?.balance,
      balance_due_date: split?.balanceDueDate,
    })
    // Déclenche les mails (non bloquant pour l'affichage du succès)
    fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    }).catch(() => {})
    setDone(true)
  } catch (e) {
    setError((e as Error).message)
  } finally {
    setBusy(false)
  }
}
```

- Écran de succès (`done`) : message « Votre demande a bien été envoyée. Un email de confirmation vous a été adressé. Pour un règlement par virement, vous recevrez un devis avec nos coordonnées bancaires. » — réutiliser le style de l'écran `done` de `ReservationForm.tsx`.

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc -b --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Vérification manuelle (preview)**

Démarrer le preview (`fairy-house-dev`), aller sur `/reserver`. Parcourir chaque étape des deux parcours ; vérifier le calcul du récap (ex : Groupe 2 pers × 3 nuits + pension = 481,80 € TTC). Vérifier `read_console_messages` (aucune erreur). L'insertion réelle nécessite le patch SQL (Task 2) appliqué en base.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Reservation.tsx
git commit -m "feat: orchestrateur du tunnel de réservation sur /reserver"
```

---

## Task 8: Brancher les boutons d'entrée sur `/reserver`

**Files:**
- Modify: `src/pages/LeLieu.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: route `/reserver` (Task 7).

- [ ] **Step 1: `LeLieu.tsx`** — remplacer `const { open: openReservation } = useReservation()` et `onClick={() => openReservation()}` par une navigation :

```typescript
import { useNavigate } from 'react-router-dom'
// dans le composant :
const navigate = useNavigate()
// bouton :
onClick={() => navigate('/reserver')}
```

Retirer l'import `useReservation` s'il n'est plus utilisé dans le fichier.

- [ ] **Step 2: `Home.tsx`** — repérer les boutons « Réserver » liés aux lits/CTA (grep `openReservation` / `useReservation` dans le fichier) et les faire naviguer vers `/reserver` de la même manière. Conserver la modale `useReservation` uniquement là où elle sert au contexte événement (le cas échéant).

- [ ] **Step 3: Vérification manuelle**

Preview : depuis l'accueil et depuis Le Lieu, cliquer « Réserver » → arrive sur `/reserver` étape 1. `read_console_messages` sans erreur.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx src/pages/LeLieu.tsx
git commit -m "feat: boutons Réserver -> tunnel /reserver"
```

---

## Self-Review (couverture spec)

- Deux parcours Groupe/Individuel → Task 6 (StepStayType + sélections) ✅
- Sélection par chambre / maison complète, capacités → Task 1 (ROOMS) + Task 6 (StepGroupSelection) ✅
- Parcours individuel par nombre de lits → Task 6 (StepIndividualSelection) ✅
- Options Linge/Pension (les deux parcours) → Task 1 (computeQuote) + Task 6 ✅
- Pré-paiement : coordonnées + case activités (groupe) + allergies (individuel) + demandes diverses → Task 6 (StepDetails) ✅
- Paiement 2× si +30 j (50/50, échéance −30 j) → Task 1 (canSplit/splitPlan) + Task 6 (StepDetails/StepPayment) ✅
- Paiement virement actif, CB/PayPal désactivés → Task 6 (StepPayment) ✅
- TVA 10 % → Task 1 (VAT_RATE) ✅
- Mail confirmation + mail devis/RIB si virement → Task 4 (helpers) + Task 5 (api/book) ✅
- Persistance étendue → Task 2 (SQL) + Task 3 (types/api) ✅
- Points d'entrée Home/LeLieu → Task 8 ✅
- En attente humain : exécuter le patch SQL en base ; fournir RIB/SIRET/TVA réels (env). Signalé aux Tasks 2 et 5.
