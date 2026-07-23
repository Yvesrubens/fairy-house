# Dashboard réservations — détail complet + colonnes enrichies

Date : 2026-07-23
Branche cible : master

## Objectif

Rendre exploitable côté admin l'intégralité des données collectées lors des
réservations. Deux périmètres déjà séparés dans le menu et les routes :
« Réservations séjour » et « Réservations événement ». Le dashboard doit
permettre à l'admin de voir, sans friction, toutes les informations saisies par
le client dans les formulaires.

## État actuel

- Le type `Reservation` (`src/types/db.ts`) contient déjà tous les champs des
  deux formulaires (séjour et événement). Aucun changement de schéma DB/API.
- Les routes et le menu sont déjà scindés (`scope="sejour"` / `scope="evenement"`).
- `Reservations.tsx` importe `./ReservationDetail` (bouton « Détails ») **mais ce
  fichier n'existe pas encore** → le build est cassé. C'est la pièce centrale à
  livrer.

## Livrables

### 1. Colonnes enrichies (`src/admin/pages/Reservations.tsx`)

Séjour — ajouter : **Tél**, **Formule** (`mode` : groupe/individuel/sur-mesure),
**Voyageurs** (`guests`), **Paiement**.

Ordre : N° · Client · Type · Arrivée · Départ · Tél · Formule · Voyageurs ·
Paiement · Montant · Statut · Actions.

Événement — ajouter : **Tél**, **Régime** (`diet`), **Paiement**, **Consent.**

Ordre : N° · Client · Événement · Date · Hébergement · Navette · Tél · Régime ·
Paiement · Consent. · Montant · Statut · Actions.

- « Paiement » : badge méthode (Virement / CB / PayPal) + `1×` ou `2×` selon
  `payment_plan`. Rien si `payment_method` nul.
- « Consent. » : deux pastilles règlement / image (✓ vert si `true`, ✗ gris sinon).
- `colCount` mis à jour en conséquence.
- Export CSV enrichi des mêmes champs (téléphone, formule/régime, paiement,
  consentements).

### 2. Composant `ReservationDetail` (`src/admin/pages/ReservationDetail.tsx`)

Modale centrée, soignée, cohérente avec l'admin existant.

Props :

```ts
{ reservation: Reservation; onClose: () => void }
```

Présentation :

- Overlay sombre semi-transparent, clic overlay → `onClose`.
- Fermeture aussi par bouton (croix) et touche `Échap`.
- En-tête à dégradé (même esprit que le bandeau du Dashboard) : référence,
  badge statut, date de création formatée.
- Contenu en **sections cartes**, adaptatives selon le périmètre
  (`Boolean(reservation.event_id)`), sections non pertinentes masquées :
  - **Client** : nom, email, téléphone ; + (événement) réseau social,
    contact d'urgence.
  - **Séjour** (scope séjour) : formule (`mode`), arrivée/départ, chambres/lits
    (`rooms` : liste `{room, guests}` ou « Maison entière » si `{wholeHouse}`),
    lits (`beds`), voyageurs (`guests`), options (`linge` / `pension`),
    activités demandées (`activities_requested`), allergies.
  - **Événement** (scope événement) : événement (`type`), date (`arrival_date`),
    hébergement (`accommodation_choice` : tente/chambre/aucun), navette
    (`shuttle`), régime (`diet`), consentements règlement/image.
  - **Paiement** : montant total TTC formaté comme sur le devis
    (`formatEuro2(amount)`), méthode (`payment_method`), plan (`payment_plan`) ;
    si `split` : acompte (`deposit_amount`), solde (`balance_amount`), échéance
    (`balance_due_date`). État « confirmation envoyée » (`confirmation_sent_at`).
  - **Message client** : `message` s'il existe.
- **Pas** de détail HT / TVA par taux : uniquement le montant TTC.
- Champs vides masqués proprement (ne pas afficher une ligne « — » vide).

## Contraintes / non-objectifs

- Aucune modification de schéma DB ni des fonctions `api/`.
- Pas d'élargissement du périmètre (ex. pas de graphiques supplémentaires,
  pas de filtres nouveaux) au-delà de ce document.
- Réutiliser les helpers existants (`formatDate`, `formatEuro2`, labels de
  statut / hébergement déjà définis dans `Reservations.tsx`).

## Tests / vérification

- Build TypeScript passe (l'import `ReservationDetail` est résolu).
- Vérification visuelle via preview : ouverture de la modale sur une résa séjour
  et une résa événement, affichage correct des sections selon le périmètre,
  fermeture (croix / overlay / Échap).
- Colonnes enrichies affichées ; export CSV contient les nouveaux champs.
