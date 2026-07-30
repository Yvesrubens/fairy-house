# Intégration Stripe Checkout (paiement carte) — design

Date : 2026-07-30

## Objectif

Remplacer la **simulation** de paiement carte par un vrai encaissement via
**Stripe Checkout** (page hébergée), pour le tunnel de réservation séjour et
l'inscription à un événement. Le virement reste inchangé (devis + RIB, paiement
en 2 fois possible). PayPal est retiré (rebranchement ultérieur).

## Décisions cadrées

- **Stripe Checkout** (redirection vers page hébergée Stripe), pas d'Element intégré.
- **Carte = paiement du montant total en une fois.** Le paiement « en 2 fois »
  reste réservé au **virement** (comportement actuel, non modifié).
- **PayPal supprimé** des moyens de paiement (front).
- Retour après paiement : page de confirmation simple sur le site.
- Démarrage en **mode test** (clés `sk_test_…`) avant passage en live.

## Flux carte

1. Le client valide sa demande → la réservation est créée (statut `pending`,
   `payment_status = 'unpaid'`) — flux existant (`createReservation`).
2. Moyen de paiement = **carte** → le front appelle
   `POST /api/create-checkout-session` avec `{ reservationId }`.
3. Le serveur **relit le montant en base** (`reservations.amount`, source de
   vérité), crée une Checkout Session Stripe (devise EUR, 1 ligne au montant
   TTC en centimes, `metadata.reservationId`, `success_url`, `cancel_url`),
   enregistre `stripe_session_id`, et renvoie `{ url }`.
4. Le front redirige vers `url` (page Stripe : CB, Apple/Google Pay, 3-D Secure).
5. Succès → Stripe redirige vers `success_url` (page de confirmation du site) ;
   annulation → `cancel_url` (retour au tunnel, réservation laissée `pending`).
6. **Webhook** `POST /api/stripe-webhook` reçoit `checkout.session.completed`,
   **vérifie la signature** (`STRIPE_WEBHOOK_SECRET`), puis :
   - passe la réservation à `payment_status = 'paid'`, `status = 'confirmed'`,
     enregistre `stripe_payment_intent` ;
   - déclenche l'e-mail de confirmation (réutilise `confirmationEmail` +
     l'envoi Resend, comme `api/book.ts`).

La confirmation carte n'est **jamais** déduite du simple retour navigateur —
uniquement du webhook signé.

## Flux virement / sur-mesure / gratuit

Inchangés. La réservation carte n'appelle **pas** `/api/book` immédiatement
(l'e-mail part via le webhook après paiement) ; le virement conserve son envoi
immédiat (devis + RIB) et l'option 2 fois.

## Composants / fichiers

- **Dépendance** : `stripe` (npm, serveur uniquement).
- Créer `api/create-checkout-session.ts` (public) : valide `reservationId`,
  relit la réservation, refuse si `amount <= 0` ou déjà `paid`, crée la session,
  stocke `stripe_session_id`, renvoie `{ url }`.
- Créer `api/stripe-webhook.ts` (public) : lit le **corps brut** (pas de parsing
  JSON), vérifie la signature, traite `checkout.session.completed` (idempotent :
  ne renvoie pas d'e-mail si déjà `paid`).
- `src/lib/api.ts` : `createCheckoutSession(reservationId): Promise<{ url }>`.
- Front `StepPayment` (séjour) : retirer les faux champs CB et PayPal ; le
  bouton carte appelle `createCheckoutSession` et redirige (`window.location`).
  Conserver virement (et son option 2 fois).
- Front `EventInscription` : idem (retirer CB simulée + PayPal ; carte →
  Checkout).
- Page de confirmation : réutiliser l'écran de succès existant, atteint via
  `success_url` (ex. `/reserver?paid=1` / `/evenements/<slug>?paid=1`) affichant
  « Paiement reçu, réservation confirmée ».
- **Migration** `supabase/patch-2026-08-stripe.sql` : `reservations` +
  `payment_status text not null default 'unpaid'`, `stripe_session_id text`,
  `stripe_payment_intent text`.

## Configuration (à définir sur Vercel par le client)

- `STRIPE_SECRET_KEY` (test puis live)
- `STRIPE_WEBHOOK_SECRET` (fourni à la création de l'endpoint webhook dans Stripe)
- (pas de clé publique nécessaire : redirection via l'URL de session)

## Sécurité

- Montant relu en base côté serveur, jamais fourni par le client.
- Statut « payé » écrit uniquement par le webhook (signature vérifiée) via la
  clé service Supabase (RLS contournée côté serveur).
- Webhook idempotent (rejoue Stripe sans double envoi d'e-mail).

## Tests / vérification

- Build TypeScript + suite Vitest verts.
- Vérif logique : `createCheckoutSession` refuse un montant nul / déjà payé.
- Mode test Stripe : carte `4242 4242 4242 4242` → retour succès → webhook
  (via Stripe CLI ou dashboard) → réservation `paid` + `confirmed` + e-mail.

## Hors périmètre

Paiement carte en 2 fois, PayPal, remboursements, gestion des litiges — traités
ultérieurement.
