# CMS édition en place (Accueil + Le Lieu) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre éditables depuis le back-office tous les textes/images/prix figés des pages Accueil et Le Lieu, sans changer leur structure, avec repli sur le contenu actuel.

**Architecture:** Table clé/valeur `site_content` + un registre déclaratif en code (`siteContent.ts`) qui est l'unique source de vérité (champs + valeurs par défaut). Un hook `useSiteContent()` charge tout en une requête et expose `c(key)`/`cList(key)` avec repli sur les défauts. Les pages lisent via ces helpers ; l'éditeur admin est auto-généré depuis le registre.

**Tech Stack:** React 18, TypeScript, Supabase (Postgres + RLS), Tailwind v4, Vitest + @testing-library/react.

## Global Constraints

- Français pour tout texte visible.
- **Structure des pages figée** : pas d'ajout/déplacement/suppression de sections, pas de nouvelle page. Les tableaux `ROOMS`/`PROJECTS`/`SPACES`/`COMFORT` gardent leur taille fixe ; seuls leurs champs deviennent pilotés.
- **Repli obligatoire** : `c(key)` renvoie la valeur par défaut du registre si la clé est absente OU vide → le site reste identique tant que rien n'est saisi.
- Réutiliser l'`ImageUpload` existant (`src/admin/components/ImageUpload.tsx`) pour les champs image.
- Les valeurs par défaut sont les **littéraux actuels exacts** des fichiers cités (à transcrire sans modification).
- Lecture publique de `site_content` (contenu marketing non sensible) ; écriture admin uniquement.
- Ne pas toucher aux contenus déjà dynamiques (événements, articles, accompagnant·es).

---

### Task 1 : Base de données + API + types

**Files:**
- Create: `supabase/patch-2026-08-site-content.sql`
- Modify: `src/types/db.ts`, `src/lib/api.ts`

**Interfaces:**
- Produces : `SiteContentRow` ; `listSiteContent(): Promise<SiteContentRow[]>` ; `upsertSiteContent(entries: { key: string; value: string }[]): Promise<void>`.

- [ ] **Step 1 : Migration SQL**

Create `supabase/patch-2026-08-site-content.sql` :
```sql
-- Fairy House — patch : contenu éditable des pages vitrine (CMS). Idempotent.
create table if not exists site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table site_content enable row level security;
drop policy if exists site_content_public on site_content;
create policy site_content_public on site_content for select using (true);
drop policy if exists site_content_admin on site_content;
create policy site_content_admin on site_content for all using (is_admin()) with check (is_admin());
notify pgrst, 'reload schema';
```

- [ ] **Step 2 : Type**

Dans `src/types/db.ts`, ajouter :
```ts
export interface SiteContentRow {
  key: string
  value: string | null
  updated_at: string
}
```

- [ ] **Step 3 : Fonctions API**

Dans `src/lib/api.ts` : importer le type (`SiteContentRow`) dans le bloc d'import `../types/db`, puis ajouter :
```ts
// ------------------------------------------------- Contenu des pages (CMS)
export async function listSiteContent(): Promise<SiteContentRow[]> {
  const { data, error } = await supabase.from('site_content').select('*')
  return unwrap(data, error)
}

export async function upsertSiteContent(
  entries: { key: string; value: string }[],
): Promise<void> {
  if (entries.length === 0) return
  const rows = entries.map((e) => ({
    key: e.key,
    value: e.value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('site_content').upsert(rows)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 4 : Vérifier le build**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 5 : Commit**
```bash
git add supabase/patch-2026-08-site-content.sql src/types/db.ts src/lib/api.ts
git commit -m "feat(cms): table site_content + API listSiteContent/upsertSiteContent"
```

---

### Task 2 : Registre de contenu (source de vérité + défauts)

**Files:**
- Create: `src/lib/siteContent.ts`
- Test: `src/lib/siteContent.test.ts`

**Interfaces:**
- Produces :
  - types `FieldType = 'text' | 'multiline' | 'list' | 'image'`
  - `interface Field { key: string; label: string; type: FieldType; default: string }`
  - `interface Section { label: string; fields: Field[] }`
  - `interface PageDef { key: string; label: string; sections: Section[] }`
  - `export const PAGES: PageDef[]`
  - `export const DEFAULTS: Record<string, string>` (dérivé : `key → default`)
  - `export function getDefault(key: string): string`

Notes :
- Pour les champs `list`, la valeur `default` est composée des éléments **séparés par des sauts de ligne** (`\n`), dans l'ordre actuel.
- Les valeurs par défaut sont les littéraux exacts des fichiers cités dans les tableaux ci-dessous (Tasks 4 et 5). Task 2 crée la **structure** et les entrées de la page **Accueil** ; Task 3 ajoute le hook ; les entrées de contenu proviennent des tableaux fournis en Tasks 4/5 (le registre est complété au fur et à mesure — additif dans le même fichier).

Pour éviter tout blocage : Task 2 crée le fichier avec les types, `PAGES` initialisé avec les deux pages (`home`, `lelieu`) et **leurs sections/champs complets** d'après les catalogues des Tasks 4 et 5 (les catalogues font foi). `DEFAULTS`/`getDefault` en découlent.

- [ ] **Step 1 : Test du dérivé defaults**

```ts
// src/lib/siteContent.test.ts
import { describe, it, expect } from 'vitest'
import { PAGES, DEFAULTS, getDefault } from './siteContent'

describe('registre siteContent', () => {
  it('les clés sont uniques', () => {
    const keys = PAGES.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => f.key)))
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('DEFAULTS mappe chaque clé sur sa valeur par défaut', () => {
    const first = PAGES[0].sections[0].fields[0]
    expect(DEFAULTS[first.key]).toBe(first.default)
    expect(getDefault(first.key)).toBe(first.default)
  })
  it('getDefault renvoie une chaîne vide pour une clé inconnue', () => {
    expect(getDefault('cle.inexistante')).toBe('')
  })
  it('couvre les pages home et lelieu', () => {
    expect(PAGES.map((p) => p.key).sort()).toEqual(['home', 'lelieu'])
  })
})
```

- [ ] **Step 2 : Run le test (échoue)**

Run: `npm test -- siteContent`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Implémenter `siteContent.ts`**

Squelette (les champs complets viennent des catalogues Tasks 4 & 5) :
```ts
export type FieldType = 'text' | 'multiline' | 'list' | 'image'
export interface Field { key: string; label: string; type: FieldType; default: string }
export interface Section { label: string; fields: Field[] }
export interface PageDef { key: string; label: string; sections: Section[] }

export const PAGES: PageDef[] = [
  {
    key: 'home',
    label: 'Accueil',
    sections: [
      // … remplir avec le CATALOGUE ACCUEIL (Task 4) …
    ],
  },
  {
    key: 'lelieu',
    label: 'Le Lieu',
    sections: [
      // … remplir avec le CATALOGUE LE LIEU (Task 5) …
    ],
  },
]

export const DEFAULTS: Record<string, string> = Object.fromEntries(
  PAGES.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => [f.key, f.default]))),
)

export function getDefault(key: string): string {
  return DEFAULTS[key] ?? ''
}
```
> Renseigner les `sections`/`fields` en transcrivant **exactement** les catalogues des Tasks 4 et 5 (clé, libellé, type, défaut). Pour `list`, joindre les éléments par `\n`.

- [ ] **Step 4 : Run le test (passe)**

Run: `npm test -- siteContent`
Expected: PASS.

- [ ] **Step 5 : Commit**
```bash
git add src/lib/siteContent.ts src/lib/siteContent.test.ts
git commit -m "feat(cms): registre de contenu (champs + valeurs par défaut) Accueil + Le Lieu"
```

---

### Task 3 : Hook `useSiteContent`

**Files:**
- Create: `src/lib/useSiteContent.ts`
- Test: `src/lib/useSiteContent.test.ts`

**Interfaces:**
- Consumes : `listSiteContent` (Task 1), `getDefault` (Task 2).
- Produces : `useSiteContent(): { c: (key: string) => string; cList: (key: string) => string[]; loaded: boolean }`.

Comportement : au montage, charge tout `site_content` ; `c(key)` = valeur en base si présente **et non vide (après trim)**, sinon `getDefault(key)`. `cList(key)` = `c(key)` découpé par lignes, `trim`, lignes vides retirées. Tant que non chargé, `c` renvoie déjà les défauts.

- [ ] **Step 1 : Test**

```tsx
// src/lib/useSiteContent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSiteContent } from './useSiteContent'
import * as api from './api'
import { getDefault } from './siteContent'

describe('useSiteContent', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('repli sur le défaut avant chargement et pour clé absente', () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([])
    const { result } = renderHook(() => useSiteContent())
    const firstKey = 'home.hero.title'
    expect(result.current.c(firstKey)).toBe(getDefault(firstKey))
  })

  it('utilise la valeur en base quand présente et non vide', async () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([
      { key: 'home.hero.title', value: 'NOUVEAU TITRE', updated_at: '' },
      { key: 'home.hero.subtitle1', value: '   ', updated_at: '' },
    ])
    const { result } = renderHook(() => useSiteContent())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.c('home.hero.title')).toBe('NOUVEAU TITRE')
    // valeur vide (espaces) -> repli sur défaut
    expect(result.current.c('home.hero.subtitle1')).toBe(getDefault('home.hero.subtitle1'))
  })

  it('cList découpe par lignes non vides', async () => {
    vi.spyOn(api, 'listSiteContent').mockResolvedValue([
      { key: 'home.room1.features', value: 'Lit double\n\nVue sur jardin\n', updated_at: '' },
    ])
    const { result } = renderHook(() => useSiteContent())
    await waitFor(() => expect(result.current.loaded).toBe(true))
    expect(result.current.cList('home.room1.features')).toEqual(['Lit double', 'Vue sur jardin'])
  })
})
```

- [ ] **Step 2 : Run (échoue)**

Run: `npm test -- useSiteContent`
Expected: FAIL (module introuvable).

- [ ] **Step 3 : Implémenter**

```ts
// src/lib/useSiteContent.ts
import { useEffect, useState } from 'react'
import { listSiteContent } from './api'
import { getDefault } from './siteContent'

export function useSiteContent(): {
  c: (key: string) => string
  cList: (key: string) => string[]
  loaded: boolean
} {
  const [map, setMap] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    listSiteContent()
      .then((rows) => {
        if (!active) return
        const m: Record<string, string> = {}
        for (const r of rows) if (r.value != null) m[r.key] = r.value
        setMap(m)
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true))
    return () => {
      active = false
    }
  }, [])

  const c = (key: string): string => {
    const v = map[key]
    return v != null && v.trim() !== '' ? v : getDefault(key)
  }
  const cList = (key: string): string[] =>
    c(key)
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  return { c, cList, loaded }
}
```

- [ ] **Step 4 : Run (passe)**

Run: `npm test -- useSiteContent`
Expected: PASS.

- [ ] **Step 5 : Commit**
```bash
git add src/lib/useSiteContent.ts src/lib/useSiteContent.test.ts
git commit -m "feat(cms): hook useSiteContent (chargement + repli sur défauts)"
```

---

### Task 4 : Câbler la page Accueil + CATALOGUE ACCUEIL

**Files:**
- Modify: `src/pages/Home.tsx`, `src/lib/siteContent.ts` (section `home`)

**Interfaces:**
- Consumes : `useSiteContent` (Task 3).

**CATALOGUE ACCUEIL** — chaque ligne = un `Field` de la section `home` du registre. `default` = littéral EXACT dans `src/pages/Home.tsx` (source indiquée). Type `list` : joindre les éléments par `\n`.

| key | label | type | source (Home.tsx) |
|-----|-------|------|-------------------|
| home.hero.image | Image de fond (hero) | image | `src="/photo/Vue_coucher_de_soleil.jpg"` (hero) |
| home.hero.title | Titre hero | text | `FAIRY HOUSE` |
| home.hero.subtitle1 | Sous-titre 1 | text | `Bienvenue au Sanctuaire de vos Inspirations !` |
| home.hero.subtitle2 | Sous-titre 2 | text | `Un lieu pour se révéler, créer, oser et ressentir` |
| home.hero.cta1 | Bouton 1 | text | `Entrez dans la Fairy House` |
| home.hero.cta2 | Bouton 2 | text | `Découvrir nos expériences` |
| home.vision.badge | Badge | text | `Notre Vision` |
| home.vision.title | Titre | multiline | `Un sanctuaire vivant, refuge pour les âmes créatives, sensibles et indomptées.` |
| home.vision.image | Image de fond | image | `/photo/PXL_20260101_081856561.jpg` |
| home.vision.lines | Lignes (italique) | list | les 4 `<p>` italiques (une par ligne) |
| home.vision.emphasis | Lignes (accent) | list | `L'art et l'intime ne sont plus séparés.` / `Ils se répondent.` |
| home.vision.cta | Bouton | text | `Découvrir la Fairy House` |
| home.prog.badge | Badge | text | `Programmation` |
| home.prog.title | Titre | text | `Au programme à la Fairy House` |
| home.prog.cta | Bouton | text | `Voir tous les événements` |
| home.heb.badge | Badge | text | `Hébergements` |
| home.heb.title | Titre | text | `Votre séjour à la Fairy House` |
| home.heb.intro | Paragraphes d'intro | list | les 3 `<p>` d'intro (un par ligne) |
| home.room1.name | Chambre 1 — nom | text | `Chambre Litha` |
| home.room1.image | Chambre 1 — image | image | `/photo/Chambre_Litha.jpg` |
| home.room1.subtitle | Chambre 1 — sous-titre | text | `Espace intime, familial pour 2 à 3 personnes` |
| home.room1.features | Chambre 1 — atouts | list | `Lit double` / `Vue sur jardin` |
| home.room2.name | Chambre 2 — nom | text | `Chambre Mabon` |
| home.room2.image | Chambre 2 — image | image | `/photo/Chambre_Mabbon.jpg` |
| home.room2.subtitle | Chambre 2 — sous-titre | text | `Dortoir partagé pour 5 personnes` |
| home.room2.features | Chambre 2 — atouts | list | `Vue sur jardin` |
| home.room3.name | Chambre 3 — nom | text | `Chambre Imbolc` |
| home.room3.image | Chambre 3 — image | image | `/photo/Chambre_Imbolc.jpg` |
| home.room3.subtitle | Chambre 3 — sous-titre | text | `Dortoir 4 personnes` |
| home.room3.features | Chambre 3 — atouts | list | `Vue sur jardin` |
| home.proj.badge | Badge | text | `Vos Projets` |
| home.proj.title | Titre | text | `Votre expérience sur mesure` |
| home.proj.image | Image de fond | image | `/photo/PXL_20260320_085850183.jpg` |
| home.proj.intro | Paragraphes d'intro | list | les 2 `<p>` d'intro (un par ligne) |
| home.proj1.title | Projet 1 — titre | text | `Privatisation simple` |
| home.proj1.image | Projet 1 — image | image | `/photo/Vue_d_ensemble.jpg` |
| home.proj1.subtitle | Projet 1 — sous-titre | text | `Pour vos vacances, séminaires, retraites...` |
| home.proj1.points | Projet 1 — points | list | les 3 `points` |
| home.proj1.cta | Projet 1 — bouton | text | `Réserver` |
| home.proj2.title | Projet 2 — titre | text | `Organisation d'un séjour sur mesure` |
| home.proj2.image | Projet 2 — image | image | `/photo/Chill_Room.jpg` |
| home.proj2.subtitle | Projet 2 — sous-titre | text | `Pour vos retraites, EVJF/EVG, cérémonies...` |
| home.proj2.points | Projet 2 — points | list | les 3 `points` |
| home.proj2.cta | Projet 2 — bouton | text | `Découvrir nos accompagnant·es` |
| home.res.image | Résidences — image | image | `/photo/Ostara_1.jpg` |
| home.res.badge | Badge | text | `Résidences` |
| home.res.title | Titre | multiline | `Un espace imaginé comme une entité, un cocon vivant` (garder le `<br/>` sous forme de 2 lignes → type `list`) |
| home.res.intro1 | Bloc « corps/créativité » | multiline | `À la Fairy House, le corps devient langage. La créativité est un chemin à explorer.` |
| home.res.intro2 | Bloc « barre de votre vie » | multiline | `Et vous êtes à la barre de votre vie, de vos décisions.` |
| home.res.refuge_title | Titre encart refuge | text | `La Fairy House est un refuge pour :` |
| home.res.refuge_items | Items refuge | list | les 4 items |
| home.res.outro | Paragraphe final | multiline | `Ici, chacun·e avance à son propre rythme…` (le `<p>` final) |
| home.res.cta | Bouton | text | `Découvrir notre programmation` |
| home.contact.title | Titre | text | `Contactez-nous` |
| home.contact.text | Texte | multiline | `Retraite, résidence artistique, EVJF/EVG, cérémonie : on adapte la Fairy House à votre projet` |
| home.contact.cta | Bouton | text | `Nous contacter` |

> `home.vision.title` est de type `multiline` (une seule valeur). `home.res.title` contient un `<br/>` → le représenter en `list` (2 lignes) rendu avec des `<br/>`.

- [ ] **Step 1 : Compléter le registre**

Dans `src/lib/siteContent.ts`, remplir `PAGES[0].sections` (page `home`) avec les champs du CATALOGUE ACCUEIL, regroupés en sections (`Hero`, `Notre Vision`, `Programmation`, `Hébergements`, `Vos Projets`, `Résidences`, `Contact`). `default` = littéral exact du fichier.

- [ ] **Step 2 : Vérifier le test du registre**

Run: `npm test -- siteContent`
Expected: PASS (clés uniques, pages home+lelieu).

- [ ] **Step 3 : Câbler `Home.tsx`**

En tête de `src/pages/Home.tsx` : `import { useSiteContent } from '../lib/useSiteContent'`. Dans le composant : `const { c, cList } = useSiteContent()`.
Remplacer chaque littéral par l'appel correspondant. Les tableaux `ROOMS`/`PROJECTS` (déclarés en module) doivent être reconstruits **dans le composant** à partir de `c`/`cList` (taille fixe conservée), par ex. :
```tsx
const ROOMS = [
  { name: c('home.room1.name'), img: c('home.room1.image'), subtitle: c('home.room1.subtitle'), features: cList('home.room1.features') },
  { name: c('home.room2.name'), img: c('home.room2.image'), subtitle: c('home.room2.subtitle'), features: cList('home.room2.features') },
  { name: c('home.room3.name'), img: c('home.room3.image'), subtitle: c('home.room3.subtitle'), features: cList('home.room3.features') },
]
const PROJECTS = [
  { title: c('home.proj1.title'), img: c('home.proj1.image'), subtitle: c('home.proj1.subtitle'), points: cList('home.proj1.points'), cta: c('home.proj1.cta'), to: '/reserver' },
  { title: c('home.proj2.title'), img: c('home.proj2.image'), subtitle: c('home.proj2.subtitle'), points: cList('home.proj2.points'), cta: c('home.proj2.cta'), to: '/intervenants' },
]
```
Les routes `to` restent en dur (non éditables). Le hero, la vision (`cList('home.vision.lines')`, `cList('home.vision.emphasis')`), l'intro hébergements (`cList('home.heb.intro')`), les projets (`cList('home.proj.intro')`), les résidences et le contact sont câblés de la même façon.

- [ ] **Step 4 : Build + rendu identique**

Run: `npx tsc -b && npm run build`
Expected: exit 0. Vérifier ensuite dans la preview que l'Accueil s'affiche **à l'identique** (aucune valeur en base → défauts).

- [ ] **Step 5 : Commit**
```bash
git add src/lib/siteContent.ts src/pages/Home.tsx
git commit -m "feat(cms): Accueil piloté par le registre de contenu (repli sur défauts)"
```

---

### Task 5 : Câbler la page Le Lieu + CATALOGUE LE LIEU

**Files:**
- Modify: `src/pages/LeLieu.tsx`, `src/lib/siteContent.ts` (section `lelieu`)

**CATALOGUE LE LIEU** — `default` = littéral EXACT dans `src/pages/LeLieu.tsx`.

| key | label | type | source (LeLieu.tsx) |
|-----|-------|------|---------------------|
| lelieu.hero.image | Image hero | image | `/photo/Vue_coucher_de_soleil.jpg` |
| lelieu.hero.title | Titre hero | text | `Fairy House` |
| lelieu.hero.subtitle | Sous-titre hero | text | `Un lieu pour se déposer, créer et se transformer` |
| lelieu.intro.text | Intro | multiline | `Ici, on prend le temps de se ressourcer…` |
| lelieu.habiter.badge | Badge | text | `Habiter la maison` |
| lelieu.habiter.title | Titre | text | `Habiter la maison` |
| lelieu.habiter.text | Paragraphe | multiline | `La Fairy House a été pensée comme un lieu vivant…` |
| lelieu.space1.name | Espace 1 — nom | text | `Se Reposer` |
| lelieu.space1.image | Espace 1 — image | image | `/photo/Chambre_Mabbon.jpg` |
| lelieu.space1.text | Espace 1 — texte | multiline | texte `Se Reposer` |
| lelieu.space2.name | Espace 2 — nom | text | `Créer` |
| lelieu.space2.image | Espace 2 — image | image | `/photo/Exterieur_pique_nique.png` |
| lelieu.space2.text | Espace 2 — texte | multiline | texte `Créer` |
| lelieu.space3.name | Espace 3 — nom | text | `Se retrouver` |
| lelieu.space3.image | Espace 3 — image | image | `/photo/PXL_20260314_221152313.jpg` |
| lelieu.space3.text | Espace 3 — texte | multiline | texte `Se retrouver` |
| lelieu.space4.name | Espace 4 — nom | text | `Respirer` |
| lelieu.space4.image | Espace 4 — image | image | `/photo/Bassin.jpg` |
| lelieu.space4.text | Espace 4 — texte | multiline | texte `Respirer` |
| lelieu.confort.title | Titre confort | text | `Le confort du lieu : l'essentiel à savoir` |
| lelieu.confort.sejour_title | Bloc Séjour — titre | text | `Séjour` |
| lelieu.confort.sejour_items | Bloc Séjour — items | list | les 5 items `Séjour` |
| lelieu.confort.repas_title | Bloc Repas — titre | text | `Repas` |
| lelieu.confort.repas_items | Bloc Repas — items | list | les 5 items `Repas` |
| lelieu.confort.vie_title | Bloc Vie — titre | text | `Vie sur place` |
| lelieu.confort.vie_items | Bloc Vie — items | list | les 6 items `Vie sur place` |
| lelieu.confort.plus_title | Bloc Les Plus — titre | text | `Les Plus` |
| lelieu.confort.plus_items | Bloc Les Plus — paragraphes | list | les 2 `<p>` |
| lelieu.cta.title | CTA — titre | text | `Prêt·e à découvrir Fairy House ?` |
| lelieu.cta.text | CTA — texte | text | `Réservez dès maintenant votre séjour dans notre havre de paix` |
| lelieu.cta.button | CTA — bouton | text | `Réserver maintenant` |
| lelieu.venir.title | Comment venir — titre | text | `Comment venir ?` |
| lelieu.venir.adresse | Adresse | list | `2 Le Grand Leu` / `45230 La Chapelle sur Aveyron` / `France` |
| lelieu.venir.navette | Navette | list | `Depuis Montargis : 25 min` / `Depuis Nogent : 15 min` / `2 trajets/jour sur réservation` |
| lelieu.venir.phone | Téléphone | text | `+33 6 71 39 88 07` |
| lelieu.venir.email | E-mail | text | `contact@fairyhousecollectif.com` |

> Note : le `href="tel:…"` et `mailto:` seront dérivés des valeurs `phone`/`email` (retirer les espaces pour le `tel:`). La carte Google Maps (iframe) reste en dur.

- [ ] **Step 1 : Compléter le registre** (`PAGES[1].sections`, page `lelieu`) avec le CATALOGUE LE LIEU, regroupé en sections (`Hero`, `Intro`, `Habiter la maison`, `Confort`, `Appel à l'action`, `Comment venir`).

- [ ] **Step 2 : Vérifier le test du registre**
Run: `npm test -- siteContent`
Expected: PASS.

- [ ] **Step 3 : Câbler `LeLieu.tsx`** : `const { c, cList } = useSiteContent()` ; reconstruire `SPACES` et `COMFORT` dans le composant à partir de `c`/`cList` (taille fixe) ; câbler hero, intro, habiter, CTA, comment venir. Pour l'adresse/navette (`list`), rendre chaque ligne séparée par `<br/>` (`cList(...).map((l, i) => <span key={i}>{l}<br/></span>)` ou équivalent). `href={`tel:${c('lelieu.venir.phone').replace(/\s/g, '')}`}` et `href={`mailto:${c('lelieu.venir.email')}`}`.

- [ ] **Step 4 : Build + rendu identique**
Run: `npx tsc -b && npm run build`
Expected: exit 0 ; preview « Le Lieu » identique à l'existant.

- [ ] **Step 5 : Commit**
```bash
git add src/lib/siteContent.ts src/pages/LeLieu.tsx
git commit -m "feat(cms): page Le Lieu pilotée par le registre de contenu"
```

---

### Task 6 : Éditeur back-office « Contenu du site »

**Files:**
- Create: `src/admin/pages/SiteContent.tsx`
- Modify: `src/App.tsx`, `src/admin/AdminLayout.tsx`

**Interfaces:**
- Consumes : `PAGES` (Task 2), `listSiteContent`/`upsertSiteContent` (Task 1), `ImageUpload`.

- [ ] **Step 1 : Composant éditeur**

Create `src/admin/pages/SiteContent.tsx` :
```tsx
import { useEffect, useState } from 'react'
import { PAGES } from '../../lib/siteContent'
import { listSiteContent, upsertSiteContent } from '../../lib/api'
import ImageUpload from '../components/ImageUpload'

export default function SiteContent() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [pageKey, setPageKey] = useState(PAGES[0].key)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    listSiteContent()
      .then((rows) => {
        const v: Record<string, string> = {}
        for (const r of rows) v[r.key] = r.value ?? ''
        setValues(v)
      })
      .catch((e) => setMsg((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const page = PAGES.find((p) => p.key === pageKey)!
  const val = (key: string, def: string) => (key in values ? values[key] : def)
  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }))

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      const entries = page.sections.flatMap((s) =>
        s.fields.filter((f) => f.key in values).map((f) => ({ key: f.key, value: values[f.key] })),
      )
      await upsertSiteContent(entries)
      setMsg('Contenu enregistré.')
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-gray-500">Chargement…</p>

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Contenu du site</h1>
      <p className="mt-2 text-gray-600">
        Modifiez les textes et images des pages. Un champ vide réutilise le texte par défaut.
      </p>

      <div className="mt-6 flex gap-2">
        {PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPageKey(p.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              pageKey === p.key ? 'bg-purple-600 text-white' : 'border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {msg && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="mt-6 space-y-8">
        {page.sections.map((s) => (
          <section key={s.label} className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">{s.label}</h2>
            <div className="mt-4 space-y-4">
              {s.fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {f.label}
                    {f.type === 'list' && (
                      <span className="ml-2 text-xs text-gray-400">(un élément par ligne)</span>
                    )}
                  </label>
                  {f.type === 'image' ? (
                    <ImageUpload
                      value={val(f.key, f.default) || null}
                      onChange={(url) => set(f.key, url ?? '')}
                    />
                  ) : f.type === 'text' ? (
                    <input
                      value={val(f.key, f.default)}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  ) : (
                    <textarea
                      rows={f.type === 'list' ? 5 : 3}
                      value={val(f.key, f.default)}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
```
> Note : les champs non modifiés sont pré-remplis avec la valeur par défaut (`val`) mais ne sont enregistrés que s'ils ont été touchés (présents dans `values`), pour ne pas figer inutilement les défauts.

- [ ] **Step 2 : Route**

Dans `src/App.tsx` : `import SiteContent from './admin/pages/SiteContent'` (près des autres imports admin), et sous les routes admin ajouter :
```tsx
          <Route path="contenu" element={<SiteContent />} />
```

- [ ] **Step 3 : Menu**

Dans `src/admin/AdminLayout.tsx`, ajouter dans `LINKS` (après « Paramètres » ou avant) :
```tsx
  { to: '/admin/contenu', label: 'Contenu du site', icon: <DocIcon /> },
```

- [ ] **Step 4 : Build + tests**

Run: `npx tsc -b && npm run build && npm test`
Expected: exit 0 ; suite verte.

- [ ] **Step 5 : Commit**
```bash
git add src/admin/pages/SiteContent.tsx src/App.tsx src/admin/AdminLayout.tsx
git commit -m "feat(cms): éditeur back-office « Contenu du site » (Accueil + Le Lieu)"
```

---

## Self-Review

- **Couverture spec :** table+RLS (T1), registre+défauts (T2), hook repli (T3), Accueil câblé (T4), Le Lieu câblé (T5), éditeur admin + route + menu (T6). Repli sur défauts (T3 + `val`), structure figée (catalogues à taille fixe), lecture publique/écriture admin (T1). ✓
- **Placeholders :** les seuls « … » sont des renvois explicites aux catalogues fournis (Tasks 4/5) — données réelles présentes sous forme de tableaux clé/défaut. ✓
- **Cohérence des types :** `c`/`cList`/`getDefault`/`PAGES`/`DEFAULTS` définis en T2/T3 et consommés à l'identique en T4/T5/T6 ; `listSiteContent`/`upsertSiteContent`/`SiteContentRow` définis en T1 et réutilisés en T3/T6. ✓
- **Migration :** `patch-2026-08-site-content.sql` à appliquer avant que l'édition/lecture en base fonctionne (le site fonctionne malgré tout via les défauts). ✓
