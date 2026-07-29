# CMS « édition en place » des pages vitrine — design

Date : 2026-07-24
Périmètre de ce lot : **Accueil** et **Le Lieu** (architecture extensible aux autres pages).

## Objectif

Permettre à l'admin de modifier, depuis le back-office, **tout le contenu figé**
(textes, images, prix) des pages vitrine, **sans changer la structure** des pages
(pas d'ajout/déplacement/suppression de sections, pas de nouvelles pages). Le
design actuel doit rester intact tant que rien n'est modifié.

## Contexte

- Déjà éditable en base : Événements, Articles, Accompagnant·es, catégories,
  domaines, coordonnées (`org_settings`).
- En dur dans le code : le contenu marketing de `src/pages/Home.tsx` (hero,
  vision, hébergements + tableau `ROOMS`, projets + tableau `PROJECTS`,
  résidences, contact) et `src/pages/LeLieu.tsx` (héros, tableau `COMFORT`,
  autres blocs). Textes et chemins d'images sont des littéraux JSX.

## Architecture

### Base de données
Table `site_content` :
- `key text primary key` (ex. `home.hero.title`)
- `value text` (texte **ou** URL d'image — les deux stockés en texte)
- `updated_at timestamptz`

RLS : `select` public (nécessaire au rendu du site) ; `all` réservé à l'admin.
Le contenu est purement marketing (non sensible) → lecture publique acceptable.

Migration : `supabase/patch-2026-08-site-content.sql` (table + RLS). **Pas de
seed** : les valeurs par défaut vivent dans le code (voir registre).

### Registre de contenu (code)
`src/lib/siteContent.ts` : structure déclarative
```
PAGES = {
  home: { label: 'Accueil', sections: [
    { label: 'Hero', fields: [
      { key: 'home.hero.title', label: 'Titre', type: 'text', default: 'FAIRY HOUSE' },
      { key: 'home.hero.image', label: 'Image de fond', type: 'image', default: '/photo/Vue_coucher_de_soleil.jpg' },
      ...
    ]},
    ...
  ]},
  lelieu: { label: 'Le Lieu', sections: [ ... ] },
}
```
Types de champ : `text` (une ligne), `multiline` (paragraphe), `list` (multi-lignes,
une ligne = un élément), `image` (URL, éditée via `ImageUpload`).

Ce registre est l'unique source de vérité : il pilote l'éditeur admin
(formulaire auto-généré) **et** fournit les valeurs par défaut au rendu.

### Lecture côté pages
Hook `useSiteContent()` (`src/lib/useSiteContent.ts`) :
- charge tout `site_content` en **une requête** au montage, met en cache ;
- expose `c(key): string` → valeur en base si présente **et non vide**, sinon la
  valeur `default` du registre ;
- expose `cList(key): string[]` → `c(key)` découpé par lignes non vides (pour les
  champs `list`).

Pendant le chargement, `c` renvoie directement les défauts (pas d'écran vide, pas
de flash). Un échec de requête retombe sur les défauts.

### Pages
`Home.tsx` et `LeLieu.tsx` : remplacer les littéraux par `c('...')` / `cList('...')`.
Les tableaux `ROOMS`/`PROJECTS`/`COMFORT` restent **de taille fixe** ; seuls leurs
champs deviennent pilotés par le contenu (ex. `home.room1.name`,
`home.room1.image`, `home.room1.features` en `list`).

### Back-office
- Nouvelle entrée menu **« Contenu du site »** (`/admin/contenu`).
- Onglets par page (Accueil / Le Lieu). Pour la page active : sections du
  registre, chaque champ rendu selon son type (input, textarea, textarea liste,
  `ImageUpload`). Bouton **Enregistrer** (upsert des clés modifiées dans
  `site_content`).
- API (`src/lib/api.ts`) : `listSiteContent()`, `upsertSiteContent(entries: {key,value}[])`.

## Non-objectifs
- Pas de modification de structure (sections figées), pas d'ajout/suppression de
  sections, pas de réordonnancement, pas de nouvelles pages.
- Pas de couverture des autres pages dans ce lot (Contact, FAQ, héros des pages
  listes) : extension ultérieure en ajoutant des entrées au registre — aucune
  nouvelle architecture requise.

## Tests / vérification
- Unitaire : le hook/utilitaire de repli (`c` renvoie le défaut si clé absente ou
  valeur vide ; `cList` découpe correctement).
- Build TypeScript + suite de tests verts.
- Preview : Accueil et Le Lieu rendus **à l'identique** sans contenu en base
  (défauts) ; après saisie d'une valeur, la page reflète la modification.

## Livrables (fichiers)
- Création : `supabase/patch-2026-08-site-content.sql`, `src/lib/siteContent.ts`,
  `src/lib/useSiteContent.ts`, `src/admin/pages/SiteContent.tsx`,
  `src/lib/siteContent.test.ts`.
- Modification : `src/pages/Home.tsx`, `src/pages/LeLieu.tsx`, `src/lib/api.ts`,
  `src/App.tsx` (route), `src/admin/AdminLayout.tsx` (menu).
