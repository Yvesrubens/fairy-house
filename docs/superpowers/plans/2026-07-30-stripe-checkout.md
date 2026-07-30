# Intégration Stripe Checkout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encaisser les paiements carte via Stripe Checkout (page hébergée) pour le tunnel séjour et l'inscription événement, la confirmation étant validée par un webhook signé. Le virement (et son paiement en 2 fois) reste inchangé ; PayPal est retiré.

**Architecture:** Le client crée sa réservation (pending/unpaid), puis pour la carte le front demande une Checkout Session au serveur (montant relu en base), est redirigé vers Stripe, et le webhook `checkout.session.completed` marque la réservation payée + confirmée et envoie l'e-mail. Endpoints serverless Vercel + SDK `stripe`.

**Tech Stack:** React 18 + TS (front), fonctions serverless Vercel (`api/*.ts`), Supabase (service role côté serveur), Stripe (Checkout), Resend (emails), Vitest.

## Global Constraints

- **Carte = montant total en une fois.** Le paiement en 2 fois reste réservé au virement (ne pas y toucher).
- **PayPal retiré** du front (moyens : Virement + Carte).
- **Montant relu en base** côté serveur (`reservations.amount`), jamais fourni par le client.
- Statut « payé » écrit **uniquement** par le webhook (signature Stripe vérifiée), idempotent (pas de double e-mail).
- Français pour le texte visible.
- Clés via variables d'environnement Vercel : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM` (déjà présentes pour les 4 dernières). Mode test d'abord.
- Réutiliser les modules existants : `confirmationEmail` (`api/_lib/confirmation.js`), `fetchOrgSettings` (`api/_lib/org-settings.js`).
- Devise EUR ; montant en centimes = `Math.round(amount * 100)`.

---

### Task 1 : Migration + type + wrapper API front

**Files:**
- Create: `supabase/patch-2026-08-stripe.sql`
- Modify: `src/types/db.ts`, `src/lib/api.ts`

**Interfaces:**
- Produces : colonnes `payment_status` / `stripe_session_id` / `stripe_payment_intent` sur `reservations` ; `Reservation.payment_status: 'unpaid' | 'paid'` (+ 2 champs) ; `createCheckoutSession(input): Promise<{ url: string }>`.

- [ ] **Step 1 : Migration SQL**

Create `supabase/patch-2026-08-stripe.sql` :
```sql
-- Fairy House — patch : paiement carte Stripe. Idempotent.
alter table reservations add column if not exists payment_status text not null default 'unpaid';
alter table reservations add column if not exists stripe_session_id text;
alter table reservations add column if not exists stripe_payment_intent text;
notify pgrst, 'reload schema';
```

- [ ] **Step 2 : Types**

Dans `src/types/db.ts`, interface `Reservation`, avant `created_at` :
```ts
  payment_status: 'unpaid' | 'paid'
  stripe_session_id: string | null
  stripe_payment_intent: string | null
```
Mettre à jour les fixtures de test qui construisent un `Reservation` complet : ajouter `payment_status: 'unpaid', stripe_session_id: null, stripe_payment_intent: null` dans `src/lib/stats.test.ts` (objet `base`) et `src/admin/pages/ReservationDetail.test.tsx` (objet `base`).

- [ ] **Step 3 : Wrapper API front**

Dans `src/lib/api.ts`, ajouter (section « Public writes », après `createReservation`) :
```ts
/** Crée une session Stripe Checkout pour une réservation et renvoie l'URL. */
export async function createCheckoutSession(input: {
  reservationId: string
  successUrl: string
  cancelUrl: string
  label: string
}): Promise<{ url: string }> {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.url) throw new Error(body.error || 'Paiement indisponible')
  return { url: body.url as string }
}
```

- [ ] **Step 4 : Build**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 5 : Commit**
```bash
git add supabase/patch-2026-08-stripe.sql src/types/db.ts src/lib/api.ts
git commit -m "feat(stripe): migration payment_status + wrapper createCheckoutSession"
```

---

### Task 2 : Endpoint `create-checkout-session`

**Files:**
- Create: `api/create-checkout-session.ts`
- Modify: `package.json` (dépendance `stripe`)

**Interfaces:**
- Consumes : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`.
- Produces : `POST /api/create-checkout-session` → `{ url }`.

- [ ] **Step 1 : Installer la dépendance**

Run: `npm install stripe`
Expected: `stripe` ajouté à `dependencies`.

- [ ] **Step 2 : Écrire l'endpoint**

Create `api/create-checkout-session.ts` :
```ts
// Crée une session Stripe Checkout pour une réservation. Le montant est relu en
// base (source de vérité), jamais fourni par le client. Public (le client vient
// de créer sa réservation et en possède l'id).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Configuration paiement manquante.' })
    return
  }
  const body =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { reservationId, successUrl, cancelUrl, label } = body
  if (!reservationId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: 'Paramètres manquants.' })
    return
  }
  // Anti open-redirect : les URLs de retour doivent être sur l'origine du site.
  const origin = req.headers.origin || ''
  if (origin && (!String(successUrl).startsWith(origin) || !String(cancelUrl).startsWith(origin))) {
    res.status(400).json({ error: 'URLs de retour invalides.' })
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: r, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle()
  if (error || !r) {
    res.status(404).json({ error: 'Réservation introuvable' })
    return
  }
  const amount = Number(r.amount) || 0
  if (amount <= 0) {
    res.status(400).json({ error: 'Montant invalide pour un paiement.' })
    return
  }
  if (r.payment_status === 'paid') {
    res.status(400).json({ error: 'Réservation déjà payée.' })
    return
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amount * 100),
          product_data: { name: String(label || `Réservation ${r.reference}`) },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: reservationId,
    metadata: { reservationId },
    customer_email: r.client_email || undefined,
  })

  await supabase
    .from('reservations')
    .update({ stripe_session_id: session.id })
    .eq('id', reservationId)

  res.status(200).json({ url: session.url })
}
```

- [ ] **Step 3 : Build**

Run: `npx tsc -b`
Expected: exit 0 (le SDK `stripe` fournit ses types).

- [ ] **Step 4 : Commit**
```bash
git add api/create-checkout-session.ts package.json package-lock.json
git commit -m "feat(stripe): endpoint create-checkout-session (montant relu en base)"
```

---

### Task 3 : Webhook `stripe-webhook`

**Files:**
- Create: `api/stripe-webhook.ts`

**Interfaces:**
- Consumes : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `confirmationEmail`, `fetchOrgSettings`.
- Produces : `POST /api/stripe-webhook`. Sur `checkout.session.completed` : `payment_status='paid'`, `status='confirmed'`, `stripe_payment_intent` renseigné, e-mail de confirmation (idempotent via `confirmation_sent_at`).

Notes : le webhook exige le **corps brut** (vérification de signature). On désactive le body-parser Vercel via `export const config` et on lit le flux.

- [ ] **Step 1 : Écrire le webhook**

Create `api/stripe-webhook.ts` :
```ts
// Webhook Stripe : confirme le paiement d'une réservation. Corps brut requis
// pour vérifier la signature. Marque la réservation payée + confirmée et envoie
// l'e-mail de confirmation (idempotent).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { confirmationEmail } from './_lib/confirmation.js'
import { fetchOrgSettings } from './_lib/org-settings.js'

export const config = { api: { bodyParser: false } }

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const RESEND_FROM = process.env.RESEND_FROM as string

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readRaw(req: any): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function sendConfirmation(r: Record<string, unknown>, org: {
  contactEmail: string; contactPhone: string; address: string
}): Promise<void> {
  const { html, text } = confirmationEmail(r, {
    email: org.contactEmail,
    phone: org.contactPhone,
    address: org.address,
  })
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [r.client_email],
      subject: `Confirmation de votre réservation — Fairy House (${r.reference})`,
      html,
      text,
    }),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY)
  let event: Stripe.Event
  try {
    const raw = await readRaw(req)
    const sig = req.headers['stripe-signature'] as string
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    res.status(400).send(`Webhook Error: ${(e as Error).message}`)
    return
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservationId = session.metadata?.reservationId
    if (reservationId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data: r } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .maybeSingle()
      // Idempotence : ne rien refaire si déjà payé.
      if (r && r.payment_status !== 'paid') {
        await supabase
          .from('reservations')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_payment_intent: (session.payment_intent as string) ?? null,
          })
          .eq('id', reservationId)
        if (!r.confirmation_sent_at) {
          try {
            const org = await fetchOrgSettings(supabase)
            await sendConfirmation(r, org)
            await supabase
              .from('reservations')
              .update({ confirmation_sent_at: new Date().toISOString() })
              .eq('id', reservationId)
          } catch (e) {
            console.error('stripe-webhook email error', e)
          }
        }
      }
    }
  }

  res.status(200).json({ received: true })
}
```

- [ ] **Step 2 : Build**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 3 : Commit**
```bash
git add api/stripe-webhook.ts
git commit -m "feat(stripe): webhook de confirmation de paiement (signé, idempotent)"
```

---

### Task 4 : Front tunnel séjour (StepPayment + Reservation)

**Files:**
- Modify: `src/components/reservation/StepPayment.tsx`, `src/pages/Reservation.tsx`

**Interfaces:**
- Consumes : `createCheckoutSession` (Task 1).

- [ ] **Step 1 : StepPayment — moyens de paiement (retirer PayPal + faux CB)**

Dans `src/components/reservation/StepPayment.tsx` :
- Remplacer `METHODS` par :
```tsx
const METHODS = [
  { key: 'virement', label: 'Virement' },
  { key: 'cb', label: 'Carte bancaire' },
] as const
```
- Supprimer les états et blocs de **carte simulée** et **PayPal** : les `useState` `cardName/cardNumber/cardExpiry/cardCvc/paypalConfirmed`, les fonctions `formatCardNumber`/`formatExpiry`, le bloc `{state.paymentMethod === 'cb' && (...)}` (champs carte) et le bloc `{state.paymentMethod === 'paypal' && (...)}`.
- Remplacer `paymentReady` par :
```tsx
  const paymentReady =
    state.paymentMethod === 'virement' || state.paymentMethod === 'cb'
```
- Le sous-titre « Simulation » sous les boutons : le retirer (plus de simulation). Dans le `METHODS.map`, supprimer le `{m.key !== 'virement' && (<span>Simulation</span>)}`.
- Bouton final : libellé selon le moyen :
```tsx
{busy
  ? 'Redirection…'
  : state.paymentMethod === 'cb'
    ? 'Payer par carte'
    : 'Valider ma réservation'}
```
(Conserver l'option « Payer en 2 fois » telle quelle — elle ne s'affiche que pour le virement.)

- [ ] **Step 2 : Reservation.tsx — brancher la carte sur Checkout**

Dans `src/pages/Reservation.tsx` :
- Importer `createReservation, checkAvailability, createCheckoutSession` depuis `../lib/api`.
- Dans le `useState`/effet initial, gérer le retour de paiement : au montage, si `new URLSearchParams(window.location.search).get('paid') === '1'`, faire `setDone(true)`.
- Dans `onSubmit`, pour le parcours **non sur-mesure**, remplacer la fin :
```tsx
      const { id } = await createReservation({ /* … inchangé … */ })
      if (state.paymentMethod === 'cb') {
        const origin = window.location.origin
        const { url } = await createCheckoutSession({
          reservationId: id,
          successUrl: `${origin}/reserver?paid=1`,
          cancelUrl: `${origin}/reserver`,
          label: typeLabel,
        })
        window.location.href = url
        return
      }
      // Virement (ou autre) : e-mail immédiat (devis + RIB).
      fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id }),
      }).catch(() => {})
      setDone(true)
```
Laisser le `catch` d'erreur autour du bloc afficher un message si `createCheckoutSession` échoue (ne pas rediriger). `setBusy(true)` reste avant l'appel.

- [ ] **Step 3 : Build + preview**

Run: `npx tsc -b && npm run build`
Expected: exit 0.
Vérifier dans la preview : étape paiement du tunnel n'affiche plus PayPal ni les champs carte ; moyens = Virement / Carte bancaire ; le bouton devient « Payer par carte » quand Carte est choisie. (La redirection Stripe réelle nécessite les clés — testée en mode test après déploiement.)

- [ ] **Step 4 : Commit**
```bash
git add src/components/reservation/StepPayment.tsx src/pages/Reservation.tsx
git commit -m "feat(stripe): tunnel séjour — carte via Checkout, retrait CB simulée + PayPal"
```

---

### Task 5 : Front inscription événement

**Files:**
- Modify: `src/pages/EventInscription.tsx`

**Interfaces:**
- Consumes : `createCheckoutSession` (Task 1).

- [ ] **Step 1 : Retirer PayPal + faux CB, brancher Checkout**

Dans `src/pages/EventInscription.tsx` :
- `METHODS` → `[{ key: 'virement', label: 'Virement' }, { key: 'cb', label: 'Carte bancaire' }]` (retirer `paypal`).
- Supprimer les états `cardName/cardNumber/cardExpiry/cardCvc/paypalConfirmed`, les helpers `formatCardNumber`/`formatExpiry`, et les blocs de saisie carte simulée + PayPal.
- `paymentReady` :
```tsx
  const paymentReady =
    isFree ||
    state.paymentMethod === 'virement' ||
    paymentMethod === 'virement' ||
    paymentMethod === 'cb'
```
(adapter au nom de variable réel `paymentMethod` du composant ; conserver le cas `isFree`).
- Importer `createCheckoutSession` depuis `../lib/api`.
- Retour de paiement : au montage, si `?paid=1` dans l'URL → `setDone(true)`.
- Dans `submit()`, après `createReservation({...})` obtenant `{ id }`, avant l'envoi `/api/book` :
```tsx
      if (!isFree && paymentMethod === 'cb') {
        const origin = window.location.origin
        const { url } = await createCheckoutSession({
          reservationId: id,
          successUrl: `${origin}/evenements/${slug}/inscription?paid=1`,
          cancelUrl: `${origin}/evenements/${slug}/inscription`,
          label: `Événement — ${event.title}`,
        })
        window.location.href = url
        return
      }
      fetch('/api/book', { /* … inchangé … */ }).catch(() => {})
      setDone(true)
```

- [ ] **Step 2 : Build + preview**

Run: `npx tsc -b && npm run build`
Expected: exit 0.
Preview : la page d'inscription n'affiche plus PayPal ni les champs carte ; carte → bouton « Payer (carte) ». Redirection réelle testée en mode test après déploiement.

- [ ] **Step 3 : Commit**
```bash
git add src/pages/EventInscription.tsx
git commit -m "feat(stripe): inscription événement — carte via Checkout, retrait CB simulée + PayPal"
```

---

### Déploiement / configuration (hors code)

1. Sur Vercel : définir `STRIPE_SECRET_KEY` (test : `sk_test_…`).
2. Appliquer `supabase/patch-2026-08-stripe.sql`.
3. Déployer, puis créer l'endpoint webhook dans Stripe (URL `https://<domaine>/api/stripe-webhook`, événement `checkout.session.completed`) → récupérer le `whsec_…` et le mettre dans `STRIPE_WEBHOOK_SECRET` sur Vercel → redéployer.
4. Test bout-en-bout en mode test (carte `4242 4242 4242 4242`) : paiement → retour succès → réservation `paid` + `confirmed` + e-mail.
5. Passage en live : remplacer par les clés `sk_live_…` + webhook live.

---

## Self-Review

- **Couverture spec :** migration + champs (T1), endpoint session montant-relu-en-base (T2), webhook signé idempotent + email (T3), front séjour carte→Checkout + retrait PayPal/CB simulée (T4), front événement idem (T5), config/déploiement documentés. Virement/2 fois non touchés. ✓
- **Placeholders :** aucun « TODO » ; code fourni pour endpoints, wrapper, migration ; les modifs front citent les ancrages précis (METHODS, paymentReady, fin de onSubmit/submit). ✓
- **Cohérence types :** `createCheckoutSession({reservationId, successUrl, cancelUrl, label})` défini en T1, consommé à l'identique en T4/T5 ; `payment_status`/`stripe_session_id`/`stripe_payment_intent` définis en T1, écrits en T2/T3. `metadata.reservationId` posé en T2, lu en T3. ✓
- **Sécurité :** montant relu en base (T2), origine des URLs validée (T2), statut payé écrit seulement par le webhook signé (T3), idempotence via `payment_status`/`confirmation_sent_at` (T3). ✓
