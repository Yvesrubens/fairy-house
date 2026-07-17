# Email de confirmation de réservation : design

Date : 2026-07-17
Statut : validé (design)

## Objectif

Permettre à un administrateur d'envoyer, depuis le back-office, un email de
confirmation au client d'une réservation. Le devis (PDF) fera l'objet d'une
phase 2 séparée.

## Décisions validées

| Sujet | Décision |
|---|---|
| Service d'email | Resend |
| Exécution | Fonction serverless Vercel `api/send-confirmation` |
| Déclenchement | Bouton manuel « Envoyer la confirmation » par réservation |
| Contenu | Bienvenue personnalisée + récap + montant + coordonnées |
| Suivi | Colonne `confirmation_sent_at` sur `reservations` |
| Devis | Hors périmètre (phase 2) |

## Architecture

- **`api/send-confirmation.ts`** (fonction Node sur Vercel) :
  1. Lit `{ reservationId }` et l'en-tête `Authorization: Bearer <access_token>`.
  2. Vérifie le token via Supabase (`auth.getUser`) puis l'appartenance à la
     table `admins`. Refuse (401/403) sinon.
  3. Récupère la réservation (client Supabase avec le token de l'admin — RLS
     autorise la lecture aux admins).
  4. Construit l'email HTML (charte dorée) et l'envoie via l'API Resend.
  5. Met à jour `reservations.confirmation_sent_at = now()`.
  6. Renvoie `{ ok: true }` ou une erreur explicite.

- **Sécurité** : la clé Resend n'existe que côté serveur (env Vercel). L'endpoint
  n'agit que pour un admin authentifié.

## Variables d'environnement (Vercel, secrètes)

- `RESEND_API_KEY` — clé API Resend
- `RESEND_FROM` — adresse expéditeur (ex. `Fairy House <contact@domaine-verifié>`)
- `SUPABASE_URL` — URL du projet (pour la fonction serveur)
- `SUPABASE_ANON_KEY` — clé publiable (pour vérifier le token côté serveur)

## Modèle de données

Ajout à `reservations` :
- `confirmation_sent_at timestamptz` (nullable)

## UI admin (page Réservations)

- Nouveau bouton **« Envoyer la confirmation »** par ligne (colonne Actions).
- Au clic : POST `api/send-confirmation` avec `{ reservationId }` + token.
- États : envoi en cours, succès (« Confirmation envoyée »), erreur.
- Si `confirmation_sent_at` est renseigné : afficher « Envoyée le JJ/MM/AAAA »
  au lieu (ou à côté) du bouton, pour éviter les doublons.

## Contenu de l'email

- Objet : `Confirmation de votre réservation — Fairy House (<référence>)`
- Corps HTML, charte dorée (#c79c37) :
  - En-tête « Fairy House »
  - « Bonjour <client_name>, » + message de bienvenue chaleureux
  - Encadré récapitulatif : référence, type, dates arrivée/départ, personnes
  - Montant si `amount > 0`
  - Coordonnées : contact@fairyhouse.com · +33 1 23 45 67 89 · Le Grand Leu,
    45230 La Chapelle sur Aveyron
- Version texte de repli.

## Dépendances côté utilisateur

1. Créer un compte Resend, fournir `RESEND_API_KEY`.
2. Vérifier un domaine expéditeur dans Resend et définir `RESEND_FROM`. Sans
   domaine vérifié, l'envoi est limité à l'adresse du titulaire du compte.

## Hors périmètre

- Génération de devis PDF (phase 2).
- Emails automatiques à la confirmation (on garde le bouton manuel).
- Relances / suivi marketing.
