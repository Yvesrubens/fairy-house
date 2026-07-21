# Tunnel de réservation — Design

Date : 2026-07-21
Statut : validé (design) — à implémenter

## Objectif

Remplacer la modale de réservation unique par un **tunnel multi-étapes en page dédiée**
(`/reserver`) proposant deux parcours (Séjour Groupe / Séjour Individuel), la sélection de
chambres ou de lits, des options payantes, un pré-paiement et un paiement. Pour cette
première livraison, **seul le virement est fonctionnel** ; CB et PayPal sont présents mais
désactivés (branchement Stripe/PayPal ultérieur).

## Décisions cadrées

- **Paiement** : virement seul fonctionnel. CB / PayPal = boutons visibles mais désactivés.
- **Tarif séjour** : 45 € / nuit / personne, quel que soit le parcours.
- **Chambres** (capacité totale 12) :
  | Chambre | Lits | Capacité |
  |---|---|---|
  | Litha | 1 double + 1 simple | 3 |
  | Mabbon | 5 simples | 5 |
  | Imbolc | 4 simples | 4 |
- **Disponibilités** : PAS de blocage automatique. Le client choisit librement ; l'admin
  gère les conflits et valide/refuse. (Calcul auto = évolution future.)
- **Options** (disponibles Individuel ET Groupe) :
  - Linge de maison : **8 € / personne / nuit**
  - Pension complète : **20 € / personne / jour** (« jour » = nuit de séjour, cf. Règles de calcul)
- **Paiement en 2 fois** : proposé uniquement si la date d'arrivée est à **plus de 30 jours**.
  50 % d'acompte à la réservation + 50 % de solde à régler **30 jours avant l'arrivée**.
- **TVA** : **10 %** sur les séjours (avec ou sans pension). S'applique à l'ensemble des
  lignes de ce tunnel.

## Parcours utilisateur

Points d'entrée : boutons « Réserver » de l'accueil (`Home`) et de `LeLieu` → navigation
vers la page `/reserver` (route existante, refondue). La modale actuelle
(`ReservationProvider`) reste **uniquement** pour la réservation d'un événement (contexte
`eventId`), inchangée.

### Étape 1 — Type de séjour
Choix : **Séjour Groupe** ou **Séjour Individuel**.

### Étape 2 — Sélection (diffère selon le parcours)

**Groupe :**
- Sélection **par chambre** (une ou plusieurs) OU **maison complète**.
- Pour chaque chambre choisie : nombre de personnes ≤ capacité de la chambre.
- Dates d'arrivée / départ.
- Options : Linge, Pension complète.

**Individuel :**
- Nombre de **lits** (1 à 11).
- Dates d'arrivée / départ.
- Options : Linge, Pension complète.

### Étape 3 — Pré-paiement (coordonnées)

**Champs communs :** nom, prénom, email, téléphone.

**Groupe uniquement :**
- Case à cocher « Je veux être contactée pour organiser des activités sur place
  (construction d'un séjour sur mesure) ».
- Champ libre « Demandes diverses ».

**Individuel uniquement :**
- Champ « Allergies alimentaires ».
- Champ libre « Demandes diverses ».

Si l'arrivée est à **+30 jours** : proposition **paiement en 2 fois** (case ou choix).

### Étape 4 — Paiement

- Récapitulatif détaillé + total HT / TVA 10 % / TTC (et échéancier si 2×).
- Choix du moyen : **Virement** (actif) · **CB** (désactivé) · **PayPal** (désactivé).
- Validation → création de la réservation (statut `pending`) + envoi des mails.

## Règles de calcul

Soit `nuits` = nombre de nuits entre arrivée et départ (≥ 1), `pers` = nombre total de
personnes (groupe : somme des personnes par chambre ; individuel : nombre de lits).

- Séjour (HT) = `45 × pers × nuits`
- Linge (HT) = `8 × pers × nuits` (si option cochée)
- Pension (HT) = `20 × pers × nuits` (si option cochée) — « jour » assimilé à une nuit de séjour
- Total HT = somme des lignes
- TVA = `Total HT × 10 %`
- Total TTC = `Total HT + TVA`
- Si 2× : acompte = `round(TTC / 2)`, solde = `TTC − acompte`, échéance solde =
  `arrivée − 30 jours`.

Tous les prix ci-dessus (45 € séjour, 8 € linge, 20 € pension) sont **HT** (confirmé) ;
le TTC (HT + TVA 10 %) est ce que règle le client.

## Modèle de données

Extension de la table `reservations` (patch SQL additif, colonnes nullable pour ne pas
casser l'existant) :

- `mode text` — `'groupe' | 'individuel'` (null pour les résas historiques / événements)
- `rooms jsonb` — sélection groupe : `[{ room: 'Litha', guests: 2 }, ...]` ou
  `{ wholeHouse: true }`
- `beds int` — parcours individuel : nombre de lits
- `options jsonb` — `{ linge: bool, pension: bool }`
- `activities_requested boolean` — case « activités sur mesure » (groupe)
- `allergies text` — parcours individuel
- `payment_method text` — `'virement' | 'cb' | 'paypal'`
- `payment_plan text` — `'once' | 'split'`
- `total_ht numeric`, `vat_rate numeric` (=10), `total_ttc numeric`
- `deposit_amount numeric`, `balance_amount numeric`, `balance_due_date date` (si 2×)

Le champ `type` existant continue d'être renseigné avec un libellé lisible
(ex : « Séjour groupe — Litha, Mabbon » ou « Séjour individuel — 3 lits »).
`amount` (existant) = `total_ttc` pour rester compatible avec l'admin et les mails.

## API / Backend

- **`createReservation` (public, `src/lib/api.ts`)** : étendu pour accepter les nouveaux
  champs. Insère la réservation (statut `pending`), calcule et stocke les montants côté
  client (recalcul de sûreté possible plus tard).
- **Nouvel endpoint public `api/book.ts`** (serverless Vercel) déclenché à la validation :
  1. Envoie le **mail de confirmation** (récapitulatif de la demande) — réutilise le
     template de `send-confirmation.ts` (extrait dans un helper partagé).
  2. Si `payment_method === 'virement'` : envoie **en plus** un **mail devis + RIB**
     (PDF devis généré via la logique de `send-devis.ts`, **TVA 10 %**, + coordonnées
     bancaires RIB dans le corps du mail / le PDF).
  - Cet endpoint ne requiert PAS d'auth admin (déclenché par le visiteur), mais recalcule
    le devis à partir des données de la réservation lue en base pour éviter la falsification
    des montants.
- **Refactor** : extraire la génération du PDF devis et le template de confirmation dans des
  helpers réutilisables (`api/_lib/`), partagés entre l'endpoint admin existant et le
  nouvel endpoint public. La TVA du devis passe de 20 % à **10 %** (paramétrable).
- **Config** : `FH_RIB_IBAN`, `FH_RIB_BIC`, `FH_RIB_TITULAIRE`, ainsi que `FH_SIRET` /
  `FH_TVA` existants — via variables d'environnement (placeholders tant que le
  questionnaire légal n'est pas rempli).

## Composants front (découpage)

- `src/pages/Reservation.tsx` — orchestre le wizard (état des étapes, données collectées).
- `src/components/reservation/StepStayType.tsx` — étape 1.
- `src/components/reservation/StepGroupSelection.tsx` — étape 2 groupe.
- `src/components/reservation/StepIndividualSelection.tsx` — étape 2 individuel.
- `src/components/reservation/StepDetails.tsx` — étape 3 (coordonnées + champs conditionnels).
- `src/components/reservation/StepPayment.tsx` — étape 4 (récap + moyens de paiement).
- `src/lib/booking.ts` — constantes (chambres, tarifs, options) + fonctions de calcul
  pures (prix, TVA, échéancier). **Testé unitairement** (vitest, cf. `stats.test.ts`).

La modale `ReservationProvider` / `ReservationForm` actuelle est conservée pour le parcours
événement uniquement.

## Gestion des erreurs

- Validation à chaque étape (dates cohérentes, capacités respectées, champs requis) avant
  de pouvoir avancer.
- Échec d'envoi de mail : la réservation est tout de même enregistrée ; message invitant le
  client à nous contacter, et l'admin voit la résa en `pending`.
- Recalcul serveur des montants du devis (source de vérité = la ligne en base).

## Tests

- `src/lib/booking.test.ts` : calculs de prix (séjour, options, TVA 10 %, acompte/solde,
  bornes de capacité, seuil des 30 jours). TDD.
- Vérification manuelle du tunnel via le preview (chaque étape, deux parcours).

## Points confirmés / en attente

1. **HT vs TTC** — ✅ confirmé : les prix (45 €, 8 €, 20 €) sont **HT**. Le client règle le TTC.
2. **Pension « jour »** — ✅ confirmé : assimilé à une nuit de séjour dans les calculs.
3. **RIB / SIRET / TVA** — ⏳ en attente : valeurs réelles à fournir pour le mail virement.
   Placeholders en variables d'environnement en attendant (n'empêche pas l'implémentation).

## Hors périmètre (évolutions futures)

- Blocage automatique des disponibilités / calendrier temps réel.
- Paiement CB (Stripe) et PayPal fonctionnels.
- Espace client / suivi de paiement du solde.
