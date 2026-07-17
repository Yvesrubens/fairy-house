# Fairy House — Dashboard d'administration : design

Date : 2026-07-17
Statut : validé (design)

## Objectif

Ajouter un espace d'administration à l'application Fairy House (aujourd'hui un
site statique Vite + React + Tailwind) permettant à un ou plusieurs
administrateurs de :

- se connecter de façon sécurisée ;
- suivre et gérer les réservations ;
- publier et modifier des événements ;
- publier et modifier des articles de blog ;
- gérer les accompagnant·es (intervenants) ;
- inviter d'autres administrateurs.

Le contenu publié depuis le dashboard alimente automatiquement les pages
publiques correspondantes.

## Décisions validées

| Sujet | Décision |
|---|---|
| Backend / base de données | Supabase (PostgreSQL + Auth + Storage + API auto) |
| Stack frontend | Inchangée : Vite + React + TypeScript + Tailwind |
| Étendue v1 | Login + Tableau de bord, Réservations, Événements, Articles, Intervenants, invitation d'admin |
| Pages publiques | Dynamiques : lisent le contenu publié depuis Supabase |
| Comptes admin | Invitation par un admin existant (email → lien pour définir le mot de passe) |
| Réservations | Formulaire public (statut « en attente ») + gestion admin (confirmer/annuler) |
| Paiement | Hors périmètre — le montant est un simple champ géré par l'admin |

## Architecture

- **Frontend** : l'app Vite/React existante. Nouvel arbre de routes `/admin/*`
  avec un layout dédié (thème violet, distinct du site public doré).
- **Backend** : Supabase. Un seul projet Supabase (base + auth + storage).
- **Client Supabase** : `@supabase/supabase-js` initialisé dans
  `src/lib/supabase.ts`, configuré via variables d'environnement Vite
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Sécurité** : Row Level Security (RLS) activée sur toutes les tables.
  - Lecture publique autorisée uniquement sur les lignes `published = true`
    des tables `events`, `articles`, `intervenants`.
  - Écriture (insert/update/delete) réservée aux utilisateurs authentifiés
    présents dans `admins`.
  - `reservations` et `messages` : insert public autorisé (depuis les
    formulaires), lecture/gestion réservées aux admins.
- **Secrets** : les clés Supabase et le fichier `.env` ne sont jamais commités
  (déjà couvert par `.gitignore`). La clé `anon` est publique par nature ;
  la sécurité repose sur les RLS. Aucune clé `service_role` côté frontend.

## Modèle de données

### `admins`
- `id` uuid (PK, = `auth.users.id`)
- `email` text
- `full_name` text
- `role` text (`admin`)
- `created_at` timestamptz

### `reservations`
- `id` uuid (PK)
- `reference` text unique (format `FH-YYYY-NNNNN`, généré à la création)
- `client_name` text
- `client_email` text
- `client_phone` text
- `type` text (ex. « Privatisation complète », « Chambre Litha »…)
- `arrival_date` date
- `departure_date` date (nullable)
- `guests` int (nullable)
- `amount` numeric default 0
- `status` text (`pending` | `confirmed` | `cancelled`) default `pending`
- `message` text (nullable)
- `created_at` timestamptz

### `events`
- `id` uuid (PK)
- `title` text
- `slug` text unique
- `description` text
- `content` text (nullable)
- `event_date` date
- `location` text (nullable)
- `image_url` text (nullable)
- `published` bool default false
- `created_at` timestamptz

### `articles`
- `id` uuid (PK)
- `title` text
- `slug` text unique
- `excerpt` text (nullable)
- `content` text
- `image_url` text (nullable)
- `published` bool default false
- `published_at` timestamptz (nullable)
- `created_at` timestamptz

### `intervenants`
- `id` uuid (PK)
- `name` text
- `domain` text
- `bio` text
- `price` text (nullable, ex. « 80€/h »)
- `website` text (nullable)
- `photo_url` text (nullable)
- `published` bool default true
- `created_at` timestamptz

### `messages`
- `id` uuid (PK)
- `first_name` text
- `last_name` text
- `email` text
- `phone` text (nullable)
- `subject` text
- `body` text
- `read` bool default false
- `created_at` timestamptz

### Storage
- Bucket public `media` pour les images d'événements, articles et intervenants.
  Upload réservé aux admins, lecture publique.

## Espace admin (`/admin`)

Layout commun : barre latérale (Tableau de bord, Événements, Réservations,
Messages, Articles, Intervenants, Paramètres), en-tête avec nom de l'admin
connecté et bouton de déconnexion. Thème violet conforme aux maquettes.

### Authentification
- `/admin/login` : email + mot de passe (Supabase Auth).
- Toutes les routes `/admin/*` (sauf login) sont protégées : redirection vers
  `/admin/login` si non authentifié. Un garde vérifie aussi l'appartenance à
  la table `admins`.
- Invitation : depuis Paramètres, un admin saisit un email ; Supabase envoie
  une invitation. À la première connexion, la personne définit son mot de passe
  et une ligne `admins` est créée.

### Tableau de bord (`/admin/dashboard`)
- 4 tuiles : Réservations ce mois, CA ce mois (somme des montants confirmés),
  Taux d'occupation (calcul simple à définir dans le plan), Événements actifs
  (publiés à venir).
- Bloc « Prochains événements ».

### Réservations (`/admin/reservations`)
- Tableau : N° réservation, Client (nom + email), Type, Date arrivée, Montant,
  Statut, Actions.
- Filtre par statut (Toutes / En attente / Confirmée / Annulée).
- Actions : confirmer, annuler (met à jour `status`).
- Export CSV de la liste filtrée.

### Événements / Articles / Intervenants
Chacun : page liste + formulaire créer/éditer + suppression + upload image +
bascule « publié ». Champs selon le modèle de données ci-dessus.

### Paramètres (`/admin/settings`)
- v1 : formulaire d'invitation d'un nouvel admin (email) + liste des admins.

## Intégration site public

- **Événements** (`/evenements`) : liste les `events` où `published = true`,
  triés par `event_date`. État vide conservé si aucun.
- **Blog** (`/blog`) : liste les `articles` où `published = true`. Page article
  individuelle `/blog/:slug` (ajoutée).
- **Accompagnant·es** (`/intervenants`) : liste les `intervenants` où
  `published = true`, avec les filtres par domaine existants.
- **Formulaire de réservation public** : nouveau formulaire (type de séjour,
  dates, nombre de personnes, coordonnées, message) → insère une `reservation`
  en statut `pending`. Accessible depuis les boutons « Réserver ».
- **Formulaire de contact** (`/contact`) : insère un `message`.

## Hors périmètre (v1)

- Paiement en ligne / facturation.
- Écran complet de gestion des Messages (table créée, lecture basique possible
  plus tard).
- Paramètres avancés au-delà de l'invitation d'admin.
- Notifications par email automatiques (hors invitation Supabase).

## Points à préciser dans le plan d'implémentation

- Formule exacte du taux d'occupation.
- Génération de la référence `FH-YYYY-NNNNN` (fonction SQL ou côté client).
- Configuration de l'envoi d'emails d'invitation Supabase (SMTP par défaut vs
  personnalisé).
- Variables d'environnement à ajouter côté Vercel.
