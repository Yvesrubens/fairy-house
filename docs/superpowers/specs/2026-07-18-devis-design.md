# Devis (quote) PDF par email : design

Date : 2026-07-18
Statut : validé (design)

## Objectif

Permettre à un administrateur de générer, depuis une réservation, un devis PDF
(lignes détaillées, TVA 20 %) et de l'envoyer au client par email en pièce
jointe.

## Décisions validées

| Sujet | Décision |
|---|---|
| Composition | Lignes pré-remplies depuis la réservation, puis modifiables |
| TVA | Assujetti — taux global **20 %** (HT / TVA / TTC) |
| Transmission | Email au client avec le PDF en pièce jointe (Resend) |
| Stockage / téléchargement | Hors périmètre pour l'instant |
| Émetteur | Coordonnées Fairy House + SIRET / N° TVA en placeholders |
| Validité | 30 jours |
| Génération PDF | `pdf-lib` côté serveur (fonction Vercel) |

## Architecture

- **`api/send-devis.ts`** (fonction Vercel, authentifiée admin comme
  `send-confirmation`) :
  1. Reçoit `{ reservationId, lines, validityDays?, note? }` + token admin.
     `lines: { designation: string; qty: number; unitPrice: number }[]`
     (`unitPrice` = PU HT).
  2. Vérifie le token → `admins`.
  3. Récupère la réservation.
  4. Génère le numéro de devis via `next_devis_reference()`.
  5. Calcule Total HT, TVA (20 %), Total TTC.
  6. Construit le PDF (`pdf-lib`).
  7. Envoie au client via Resend avec le PDF en pièce jointe (base64).
  8. Enregistre une ligne dans `devis`.
  9. Renvoie `{ ok: true, reference }`.

- **Sécurité** : clé Resend et clés Supabase uniquement en variables
  d'environnement Vercel. Endpoint réservé aux admins.

## Modèle de données

Nouvelle table `devis` :
- `id uuid pk default gen_random_uuid()`
- `reference text unique not null` (`DEV-YYYY-NNNNN`)
- `reservation_id uuid references reservations(id) on delete set null`
- `client_name text`, `client_email text`
- `lines jsonb not null` (tableau des lignes)
- `total_ht numeric not null`
- `vat_rate numeric not null default 20`
- `total_ttc numeric not null`
- `validity_days int not null default 30`
- `sent_at timestamptz`
- `created_at timestamptz default now()`

RLS : lecture/écriture réservées aux admins (`is_admin()`), comme les autres
tables de gestion.

Fonction `next_devis_reference()` : `DEV-YYYY-NNNNN` séquentiel par année
(même principe que `next_reservation_reference`).

## UI admin (page Réservations)

- Bouton **« Créer un devis »** par ligne (colonne Actions).
- Ouvre un panneau `DevisForm` :
  - Lignes pré-remplies depuis la réservation :
    - 1 ligne : désignation = `<type> — séjour du <arrivée> au <départ>`,
      qté = nombre de nuits (min 1), PU HT = `amount` (ou 0).
  - Boutons ajouter / supprimer une ligne ; champs désignation, qté, PU HT.
  - Totaux recalculés en direct : Total HT, TVA 20 %, Total TTC.
  - Champ note optionnel + validité (défaut 30 jours).
  - Bouton **« Générer et envoyer au client »** → POST `api/send-devis`.
  - États : envoi, succès (« Devis <ref> envoyé »), erreur.

## Contenu du PDF (charte dorée #c79c37)

- En-tête « FAIRY HOUSE ».
- Bloc émetteur (gauche) : Fairy House, Le Grand Leu, 45230 La Chapelle sur
  Aveyron, contact@fairyhouse.com, +33 1 23 45 67 89, « SIRET : … », « N° TVA : … ».
- Bloc devis (droite) : « DEVIS », n° `DEV-YYYY-NNNNN`, date d'émission,
  « Valable 30 jours ».
- Bloc client : nom, email, référence réservation.
- Tableau : Désignation · Qté · PU HT · Total HT.
- Totaux : Total HT · TVA 20 % · Total TTC.
- Note (si fournie).
- Mention « Bon pour accord (date et signature) ».
- Pied de page.

## Email d'accompagnement

- Objet : `Votre devis Fairy House — <référence>`
- Corps : message court + rappel du total TTC + PDF joint.

## Variables d'environnement

Réutilise `RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
(déjà configurées).

## Hors périmètre

- Stockage du PDF dans Supabase Storage / téléchargement admin.
- Acompte / paiement en ligne, signature électronique.
- TVA multi-taux par ligne (un seul taux global 20 %).
