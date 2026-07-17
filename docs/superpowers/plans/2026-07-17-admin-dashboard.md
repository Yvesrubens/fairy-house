# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure admin back-office to the Fairy House Vite/React app so admins can log in, manage reservations, publish events/articles/intervenants, and invite other admins — with published content feeding the public pages via Supabase.

**Architecture:** Keep the existing Vite + React + TypeScript + Tailwind SPA. Add a Supabase backend (Postgres + Auth + Storage) accessed through `@supabase/supabase-js`. New protected `/admin/*` route tree with a purple admin layout; public pages read published rows from Supabase. Security enforced by Row Level Security (RLS).

**Tech Stack:** Vite 5, React 18, react-router-dom 6, Tailwind v4, `@supabase/supabase-js` v2, Vitest + @testing-library/react for unit tests.

## Global Constraints

- Language of all UI copy: French.
- Public site theme: gold (`#c79c37`) / cream (`#e0dcd1`). Admin theme: purple/magenta (matches provided screenshots).
- Secrets: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend, loaded from env. Never commit `.env`. Never ship the `service_role` key.
- Security model: RLS on every table. Public read only where `published = true` (events/articles/intervenants). Public insert allowed on `reservations` and `messages`. All writes to protected tables require an authenticated user present in `admins`.
- Reservation reference format: `FH-YYYY-NNNNN` (5-digit zero-padded, per calendar year).
- TDD for pure logic (reference generation, CSV export, stats formulas, formatters). UI/integration tasks verified via `npm run build` + browser preview.
- Commit after every task.

---

## File Structure

**New — infra/libs**
- `src/lib/supabase.ts` — Supabase client singleton.
- `src/lib/format.ts` — pure helpers (date, currency, reservation reference, CSV).
- `src/lib/stats.ts` — dashboard stat computations.
- `src/types/db.ts` — TypeScript types mirroring DB tables.
- `.env.example` — documents required env vars.
- `supabase/schema.sql` — tables, RLS policies, storage bucket, reference function.

**New — auth**
- `src/admin/AuthProvider.tsx` — session context + `useAuth()`.
- `src/admin/RequireAdmin.tsx` — route guard.

**New — admin UI**
- `src/admin/AdminLayout.tsx` — sidebar + header shell.
- `src/admin/pages/Login.tsx`
- `src/admin/pages/Dashboard.tsx`
- `src/admin/pages/Reservations.tsx`
- `src/admin/pages/Events.tsx` + `EventForm.tsx`
- `src/admin/pages/Articles.tsx` + `ArticleForm.tsx`
- `src/admin/pages/Intervenants.tsx` + `IntervenantForm.tsx`
- `src/admin/pages/Settings.tsx`
- `src/admin/components/` — shared admin bits (StatCard, DataTable, ImageUpload, Field).

**New — public data + forms**
- `src/lib/api.ts` — typed data-access functions (fetch published content, insert reservation/message).
- `src/pages/Reservation.tsx` — public reservation form.
- `src/pages/BlogArticle.tsx` — single article page `/blog/:slug`.

**Modified**
- `src/App.tsx` — mount `/admin/*` routes + wrap in AuthProvider; add public reservation + article routes.
- `src/main.tsx` — no change expected (router already present).
- `src/pages/Evenements.tsx`, `src/pages/Blog.tsx`, `src/pages/Intervenants.tsx`, `src/pages/Contact.tsx` — read/write Supabase.
- `package.json` — add deps + test scripts.
- `vitest.config.ts` — test config.

---

## Phase 0 — Tooling & Supabase foundation

### Task 0.1: Add dependencies and test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: `npm test` runs Vitest; `@supabase/supabase-js` available.

- [ ] **Step 1: Install runtime + dev deps**

Run:
```bash
npm install @supabase/supabase-js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Add test script to package.json**

In `package.json` `"scripts"` add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Create test setup**

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Sanity test**

Create `src/test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => { it('runs', () => { expect(1 + 1).toBe(2) }) })
```
Run: `npm test` → Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test
git commit -m "chore: add supabase client and vitest tooling"
```

---

### Task 0.2: [MANUAL] Create the Supabase project and env

**Files:**
- Create: `.env.example`
- Create (local, git-ignored): `.env`

This task requires the user. The agent prepares files and instructions; the user performs the Supabase console steps and pastes the keys.

- [ ] **Step 1: Create `.env.example`**

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 2: User creates project**

Instructions for the user:
1. Go to https://supabase.com → New project (choose an organization, name `fairy-house`, set a DB password, region EU).
2. In Project Settings → API, copy the **Project URL** and the **anon public** key.
3. Create a local `.env` file (same folder as `package.json`) with those two values using the keys from `.env.example`.

- [ ] **Step 3: Verify `.env` is git-ignored**

Run: `git check-ignore .env` → Expected: prints `.env`.

- [ ] **Step 4: Commit the example only**

```bash
git add .env.example
git commit -m "docs: add env example for supabase"
```

---

### Task 0.3: Database schema, RLS, storage, reference function

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces: tables `admins, reservations, events, articles, intervenants, messages`; storage bucket `media`; SQL function `next_reservation_reference()`.

- [ ] **Step 1: Write `supabase/schema.sql`**

Full SQL (tables from the spec + RLS + bucket + reference helper). Content:
```sql
-- Tables
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  type text not null,
  arrival_date date not null,
  departure_date date,
  guests int,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  message text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  content text,
  event_date date,
  location text,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists intervenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  bio text,
  price text,
  website text,
  photo_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from admins where id = auth.uid());
$$;

-- Reservation reference generator: FH-YYYY-NNNNN per year
create or replace function next_reservation_reference() returns text
language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  n int;
begin
  select coalesce(max((split_part(reference,'-',3))::int),0)+1 into n
  from reservations where reference like 'FH-'||yr||'-%';
  return 'FH-'||yr||'-'||lpad(n::text,5,'0');
end; $$;

-- Enable RLS
alter table admins enable row level security;
alter table reservations enable row level security;
alter table events enable row level security;
alter table articles enable row level security;
alter table intervenants enable row level security;
alter table messages enable row level security;

-- admins: readable by admins only
create policy admins_select on admins for select using (is_admin());

-- reservations: public insert, admin read/update
create policy res_insert on reservations for insert with check (true);
create policy res_select on reservations for select using (is_admin());
create policy res_update on reservations for update using (is_admin());

-- messages: public insert, admin read/update
create policy msg_insert on messages for insert with check (true);
create policy msg_select on messages for select using (is_admin());
create policy msg_update on messages for update using (is_admin());

-- events/articles/intervenants: public read published, admin full write
create policy ev_public on events for select using (published or is_admin());
create policy ev_write on events for all using (is_admin()) with check (is_admin());
create policy ar_public on articles for select using (published or is_admin());
create policy ar_write on articles for all using (is_admin()) with check (is_admin());
create policy in_public on intervenants for select using (published or is_admin());
create policy in_write on intervenants for all using (is_admin()) with check (is_admin());

-- Storage bucket for media
insert into storage.buckets (id, name, public) values ('media','media', true)
  on conflict (id) do nothing;
create policy media_read on storage.objects for select using (bucket_id = 'media');
create policy media_write on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy media_update on storage.objects for update to authenticated using (bucket_id = 'media');
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media');
```

- [ ] **Step 2: [MANUAL] Run the schema**

User: open Supabase → SQL Editor → paste the contents of `supabase/schema.sql` → Run. Expected: "Success. No rows returned."

- [ ] **Step 3: [MANUAL] Create the first admin**

User: Supabase → Authentication → Users → Add user (email + password, auto-confirm). Then SQL Editor:
```sql
insert into admins (id, email, full_name)
select id, email, 'Aurélie Admin' from auth.users where email = 'YOUR_EMAIL';
```

- [ ] **Step 4: Commit schema**

```bash
git add supabase/schema.sql
git commit -m "feat: supabase schema, RLS, storage, reservation reference"
```

---

### Task 0.4: Supabase client + DB types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/db.ts`

**Interfaces:**
- Produces: `supabase` client; types `Reservation, EventRow, Article, Intervenant, MessageRow, ReservationStatus`.

- [ ] **Step 1: Types in `src/types/db.ts`**

```ts
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Reservation {
  id: string
  reference: string
  client_name: string
  client_email: string
  client_phone: string | null
  type: string
  arrival_date: string
  departure_date: string | null
  guests: number | null
  amount: number
  status: ReservationStatus
  message: string | null
  created_at: string
}

export interface EventRow {
  id: string; title: string; slug: string; description: string | null
  content: string | null; event_date: string | null; location: string | null
  image_url: string | null; published: boolean; created_at: string
}

export interface Article {
  id: string; title: string; slug: string; excerpt: string | null
  content: string; image_url: string | null; published: boolean
  published_at: string | null; created_at: string
}

export interface Intervenant {
  id: string; name: string; domain: string; bio: string | null
  price: string | null; website: string | null; photo_url: string | null
  published: boolean; created_at: string
}

export interface MessageRow {
  id: string; first_name: string; last_name: string; email: string
  phone: string | null; subject: string | null; body: string
  read: boolean; created_at: string
}
```

- [ ] **Step 2: Client in `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.warn('Supabase env vars manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
}

export const supabase = createClient(url ?? '', anon ?? '')
```

- [ ] **Step 3: Verify build**

Run: `npm run build` → Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/types/db.ts
git commit -m "feat: supabase client and db types"
```

---

## Phase 1 — Pure logic (TDD)

### Task 1.1: Formatters + CSV + reference parsing

**Files:**
- Create: `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `formatDate(iso: string): string` → `DD/MM/YYYY`
  - `formatEuro(n: number): string` → `"0€"`, `"1 200€"`
  - `toCSV(rows: Record<string, string | number>[]): string`
  - `slugify(s: string): string`

- [ ] **Step 1: Write failing tests**

`src/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatDate, formatEuro, toCSV, slugify } from './format'

describe('formatDate', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2026-06-04')).toBe('04/06/2026')
  })
})
describe('formatEuro', () => {
  it('formats zero', () => { expect(formatEuro(0)).toBe('0€') })
  it('groups thousands', () => { expect(formatEuro(1200)).toBe('1 200€') })
})
describe('toCSV', () => {
  it('builds header + rows and escapes commas', () => {
    const csv = toCSV([{ a: 'x,y', b: 1 }])
    expect(csv).toBe('a,b\r\n"x,y",1')
  })
})
describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('Été à la Fairy House!')).toBe('ete-a-la-fairy-house')
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test` → Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')}€`
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(','))
  return lines.join('\r\n')
}

export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test` → Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: formatting, CSV and slug helpers with tests"
```

---

### Task 1.2: Dashboard stats

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `Reservation`, `EventRow` from `src/types/db.ts`.
- Produces:
  - `reservationsThisMonth(res: Reservation[], now: Date): number`
  - `revenueThisMonth(res: Reservation[], now: Date): number` (sum of `amount` for `confirmed` created in month)
  - `occupancyRate(res: Reservation[], now: Date, capacityNights: number): number` (percent, 1 decimal — confirmed nights this month / capacityNights * 100)
  - `activeEvents(events: EventRow[], now: Date): number` (published, `event_date >= today`)

- [ ] **Step 1: Write failing tests**

`src/lib/stats.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { reservationsThisMonth, revenueThisMonth, occupancyRate, activeEvents } from './stats'
import type { Reservation, EventRow } from '../types/db'

const base: Reservation = {
  id: '1', reference: 'FH-2026-00001', client_name: 'A', client_email: 'a@a.fr',
  client_phone: null, type: 'Privatisation complète', arrival_date: '2026-06-03',
  departure_date: '2026-06-05', guests: 2, amount: 100, status: 'confirmed',
  message: null, created_at: '2026-06-03T10:00:00Z',
}
const now = new Date('2026-06-15T00:00:00Z')

describe('stats', () => {
  it('counts reservations created this month', () => {
    expect(reservationsThisMonth([base], now)).toBe(1)
  })
  it('sums revenue of confirmed this month', () => {
    expect(revenueThisMonth([base, { ...base, id: '2', status: 'pending', amount: 50 }], now)).toBe(100)
  })
  it('computes occupancy percent to 1 decimal', () => {
    // 2 nights / 60 capacity = 3.333% -> 3.3
    expect(occupancyRate([base], now, 60)).toBe(3.3)
  })
  it('counts published upcoming events', () => {
    const ev: EventRow = { id: 'e', title: 't', slug: 't', description: null, content: null,
      event_date: '2026-06-20', location: null, image_url: null, published: true, created_at: '' }
    expect(activeEvents([ev, { ...ev, id: 'e2', published: false }], now)).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test` → Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/stats.ts`**

```ts
import type { Reservation, EventRow } from '../types/db'

const sameMonth = (iso: string, now: Date) => {
  const d = new Date(iso)
  return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
}

export function reservationsThisMonth(res: Reservation[], now: Date): number {
  return res.filter((r) => sameMonth(r.created_at, now)).length
}

export function revenueThisMonth(res: Reservation[], now: Date): number {
  return res
    .filter((r) => r.status === 'confirmed' && sameMonth(r.created_at, now))
    .reduce((s, r) => s + Number(r.amount), 0)
}

export function occupancyRate(res: Reservation[], now: Date, capacityNights: number): number {
  const nights = res
    .filter((r) => r.status === 'confirmed' && sameMonth(r.arrival_date, now))
    .reduce((s, r) => {
      if (!r.departure_date) return s + 1
      const a = new Date(r.arrival_date).getTime()
      const b = new Date(r.departure_date).getTime()
      return s + Math.max(1, Math.round((b - a) / 86400000))
    }, 0)
  if (capacityNights <= 0) return 0
  return Math.round((nights / capacityNights) * 1000) / 10
}

export function activeEvents(events: EventRow[], now: Date): number {
  const today = now.toISOString().slice(0, 10)
  return events.filter((e) => e.published && e.event_date && e.event_date >= today).length
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test` → Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts src/lib/stats.test.ts
git commit -m "feat: dashboard stat computations with tests"
```

---

## Phase 2 — Data access layer

### Task 2.1: Typed API functions

**Files:**
- Create: `src/lib/api.ts`

**Interfaces:**
- Consumes: `supabase`, DB types.
- Produces (all async, throw on error):
  - Public: `listPublishedEvents()`, `getArticleBySlug(slug)`, `listPublishedArticles()`, `listPublishedIntervenants()`, `createReservation(input)`, `createMessage(input)`
  - Admin: `listReservations()`, `updateReservationStatus(id, status)`, CRUD for events/articles/intervenants (`list*All`, `upsert*`, `delete*`), `uploadMedia(file)`, `listAdmins()`, `inviteAdmin(email)`

- [ ] **Step 1: Implement `src/lib/api.ts`**

```ts
import { supabase } from './supabase'
import type { Article, EventRow, Intervenant, Reservation, ReservationStatus } from '../types/db'

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return data as T
}

// ---------- Public reads ----------
export async function listPublishedEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from('events').select('*')
    .eq('published', true).order('event_date', { ascending: true })
  return unwrap(data, error)
}
export async function listPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from('articles').select('*')
    .eq('published', true).order('published_at', { ascending: false })
  return unwrap(data, error)
}
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('*')
    .eq('slug', slug).eq('published', true).maybeSingle()
  return unwrap(data, error)
}
export async function listPublishedIntervenants(): Promise<Intervenant[]> {
  const { data, error } = await supabase.from('intervenants').select('*')
    .eq('published', true).order('created_at', { ascending: true })
  return unwrap(data, error)
}

// ---------- Public writes ----------
export interface ReservationInput {
  client_name: string; client_email: string; client_phone?: string
  type: string; arrival_date: string; departure_date?: string
  guests?: number; message?: string
}
export async function createReservation(input: ReservationInput): Promise<void> {
  const { data: ref, error: rErr } = await supabase.rpc('next_reservation_reference')
  if (rErr) throw new Error(rErr.message)
  const { error } = await supabase.from('reservations').insert({ ...input, reference: ref })
  if (error) throw new Error(error.message)
}
export interface MessageInput {
  first_name: string; last_name: string; email: string
  phone?: string; subject?: string; body: string
}
export async function createMessage(input: MessageInput): Promise<void> {
  const { error } = await supabase.from('messages').insert(input)
  if (error) throw new Error(error.message)
}

// ---------- Admin: reservations ----------
export async function listReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase.from('reservations').select('*')
    .order('created_at', { ascending: false })
  return unwrap(data, error)
}
export async function updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
  const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- Admin: generic CRUD ----------
export async function listAllEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: false })
  return unwrap(data, error)
}
export async function upsertEvent(row: Partial<EventRow>): Promise<void> {
  const { error } = await supabase.from('events').upsert(row)
  if (error) throw new Error(error.message)
}
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
export async function listAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
  return unwrap(data, error)
}
export async function upsertArticle(row: Partial<Article>): Promise<void> {
  const { error } = await supabase.from('articles').upsert(row)
  if (error) throw new Error(error.message)
}
export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
export async function listAllIntervenants(): Promise<Intervenant[]> {
  const { data, error } = await supabase.from('intervenants').select('*').order('created_at', { ascending: true })
  return unwrap(data, error)
}
export async function upsertIntervenant(row: Partial<Intervenant>): Promise<void> {
  const { error } = await supabase.from('intervenants').upsert(row)
  if (error) throw new Error(error.message)
}
export async function deleteIntervenant(id: string): Promise<void> {
  const { error } = await supabase.from('intervenants').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- Admin: media + admins ----------
export async function uploadMedia(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error } = await supabase.storage.from('media').upload(path, file)
  if (error) throw new Error(error.message)
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
export async function inviteAdmin(email: string): Promise<void> {
  // Uses Supabase's built-in signInWithOtp to send a magic invite link.
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw new Error(error.message)
}
```

Note for implementer: `inviteAdmin` sends a magic-link. After the invitee first
authenticates, an admin must add their row to `admins` (documented in Settings
UI, Task 5.1). Full server-side invite via service_role is out of scope for v1.

- [ ] **Step 2: Verify build**

Run: `npm run build` → Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: typed supabase data-access layer"
```

---

## Phase 3 — Auth + admin shell

### Task 3.1: AuthProvider + guard

**Files:**
- Create: `src/admin/AuthProvider.tsx`
- Create: `src/admin/RequireAdmin.tsx`

**Interfaces:**
- Produces: `AuthProvider` (wraps app), `useAuth() => { session, admin, loading, signIn, signOut }`, `RequireAdmin` (redirects to `/admin/login` when no admin).

- [ ] **Step 1: Implement AuthProvider**

`src/admin/AuthProvider.tsx`:
```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AdminProfile { id: string; email: string; full_name: string | null }
interface AuthValue {
  session: Session | null
  admin: AdminProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
const Ctx = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadAdmin(s: Session | null) {
    if (!s) { setAdmin(null); return }
    const { data } = await supabase.from('admins').select('id,email,full_name').eq('id', s.user.id).maybeSingle()
    setAdmin(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session); await loadAdmin(data.session); setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s); await loadAdmin(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }
  async function signOut() { await supabase.auth.signOut() }

  return <Ctx.Provider value={{ session, admin, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
```

- [ ] **Step 2: Implement RequireAdmin**

`src/admin/RequireAdmin.tsx`:
```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="p-10 text-center text-gray-500">Chargement…</div>
  if (!admin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` → Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/admin/AuthProvider.tsx src/admin/RequireAdmin.tsx
git commit -m "feat: admin auth provider and route guard"
```

---

### Task 3.2: Login page

**Files:**
- Create: `src/admin/pages/Login.tsx`

**Interfaces:**
- Consumes: `useAuth().signIn`.
- Produces: `/admin/login` screen; on success navigates to `/admin/dashboard`.

- [ ] **Step 1: Implement Login**

`src/admin/pages/Login.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try { await signIn(email, password); nav('/admin/dashboard') }
    catch (err) { setError((err as Error).message || 'Échec de la connexion') }
    finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-fuchsia-50 px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-purple-700">Fairy House <span className="text-gray-400 text-base font-normal">Administration</span></h1>
        <p className="mt-1 text-sm text-gray-500">Connectez-vous pour accéder au tableau de bord.</p>
        {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <label className="mt-6 block text-sm font-medium">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500" />
        </label>
        <label className="mt-4 block text-sm font-medium">Mot de passe
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-purple-500" />
        </label>
        <button disabled={busy}
          className="mt-6 w-full rounded-lg bg-purple-600 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build` → Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Login.tsx
git commit -m "feat: admin login page"
```

---

### Task 3.3: Admin layout (sidebar + header)

**Files:**
- Create: `src/admin/AdminLayout.tsx`
- Create: `src/admin/components/StatCard.tsx`

**Interfaces:**
- Consumes: `useAuth().admin`, `signOut`.
- Produces: `AdminLayout` with `<Outlet/>`; `StatCard` presentational component.

- [ ] **Step 1: Implement AdminLayout**

`src/admin/AdminLayout.tsx`:
```tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

const LINKS = [
  { to: '/admin/dashboard', label: 'Tableau de bord' },
  { to: '/admin/events', label: 'Événements' },
  { to: '/admin/reservations', label: 'Réservations' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/intervenants', label: 'Intervenants' },
  { to: '/admin/settings', label: 'Paramètres' },
]

export default function AdminLayout() {
  const { admin, signOut } = useAuth()
  const nav = useNavigate()
  async function logout() { await signOut(); nav('/admin/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-purple-700">Fairy House</span>
          <span className="text-sm text-gray-400">Administration</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{admin?.full_name ?? admin?.email}</span>
          <button onClick={logout} className="text-sm font-medium text-red-500 hover:text-red-600">Déconnexion</button>
        </div>
      </header>
      <div className="flex">
        <aside className="min-h-[calc(100vh-4rem)] w-60 border-r bg-white p-4">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `rounded-lg px-4 py-2.5 text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8"><Outlet /></main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement StatCard**

`src/admin/components/StatCard.tsx`:
```tsx
export default function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` → Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/admin/AdminLayout.tsx src/admin/components/StatCard.tsx
git commit -m "feat: admin layout shell and stat card"
```

---

### Task 3.4: Wire admin routes into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx` (only if AuthProvider placed here)

**Interfaces:**
- Consumes: all admin pages, `AuthProvider`, `RequireAdmin`.
- Produces: working `/admin/login` and protected `/admin/*` (dashboard placeholder until Task 4.x).

- [ ] **Step 1: Wrap app with AuthProvider and add routes**

Modify `src/App.tsx` to add (imports + routes). The public routes stay; add:
```tsx
// imports
import { AuthProvider } from './admin/AuthProvider'
import RequireAdmin from './admin/RequireAdmin'
import AdminLayout from './admin/AdminLayout'
import Login from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import Reservations from './admin/pages/Reservations'
import Events from './admin/pages/Events'
import Articles from './admin/pages/Articles'
import IntervenantsAdmin from './admin/pages/Intervenants'
import Settings from './admin/pages/Settings'
```
Wrap the returned tree in `<AuthProvider>…</AuthProvider>`. Public site chrome
(Header/Footer) must NOT render on `/admin/*`. Restructure as:
```tsx
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="events" element={<Events />} />
          <Route path="articles" element={<Articles />} />
          <Route path="intervenants" element={<IntervenantsAdmin />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  )
}
```
Extract the current public layout (Header + Routes + Footer) into a
`PublicSite` component in the same file. Import `Navigate` from react-router-dom.

- [ ] **Step 2: Create minimal placeholder admin pages**

For each admin page not yet built (Dashboard, Reservations, Events, Articles, Intervenants, Settings), create a stub returning `<h1 className="text-2xl font-bold">…</h1>` so the build compiles. These are replaced in later tasks.

- [ ] **Step 3: Verify build + browser**

Run: `npm run build` → Expected: success.
Preview: start dev server, navigate to `/admin/login` → login form shows; navigating to `/admin/dashboard` while logged out redirects to login.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/admin/pages
git commit -m "feat: mount admin routes with auth guard and public/admin split"
```

---

## Phase 4 — Admin feature pages

### Task 4.1: Dashboard page

**Files:**
- Modify: `src/admin/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `listReservations`, `listAllEvents`, stats fns, `StatCard`, `formatEuro`.
- Produces: dashboard with 4 stat cards + upcoming events list.

- [ ] **Step 1: Implement Dashboard**

Fetch reservations + events on mount; compute stats with `now = new Date()` and
`capacityNights = 60` (documented assumption: ~2 rooms configurable later).
Render title "Dashboard", a 4-column grid of `StatCard` (Réservations ce mois,
CA ce mois via `formatEuro`, Taux d'occupation `${rate}%`, Événements actifs),
then a "Prochains événements" card listing published upcoming events or
"Aucun événement à venir". Use `useState`/`useEffect`, show "Chargement…" while
loading, and a red error line on failure.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview `/admin/dashboard` (logged in) shows the
4 tiles matching the screenshot layout.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Dashboard.tsx
git commit -m "feat: admin dashboard with live stats"
```

---

### Task 4.2: Reservations page

**Files:**
- Modify: `src/admin/pages/Reservations.tsx`

**Interfaces:**
- Consumes: `listReservations`, `updateReservationStatus`, `formatDate`, `formatEuro`, `toCSV`.
- Produces: reservations table + status filter + confirm/cancel + CSV export.

- [ ] **Step 1: Implement Reservations**

Load reservations into state. Status filter select (Toutes/En attente/
Confirmée/Annulée) filters the list. Table columns: N° Réservation, Client
(name + email), Type, Date arrivée (`formatDate`), Montant (`formatEuro`),
Statut (colored badge: pending=amber, confirmed=green, cancelled=rose),
Actions. Actions: for pending → "Confirmer" and "Annuler"; for others → allow
re-cancel/confirm as appropriate; each calls `updateReservationStatus` then
updates local state. "Exporter CSV" builds rows from the filtered list via
`toCSV`, then downloads through a Blob + temporary `<a>`.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: table renders; changing the filter
narrows rows; clicking Confirmer flips the badge; Export CSV downloads a file.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Reservations.tsx
git commit -m "feat: admin reservations management with CSV export"
```

---

### Task 4.3: Shared admin form primitives

**Files:**
- Create: `src/admin/components/Field.tsx`
- Create: `src/admin/components/ImageUpload.tsx`
- Create: `src/admin/components/DataTable.tsx`

**Interfaces:**
- Produces:
  - `Field({label, value, onChange, type?, textarea?})`
  - `ImageUpload({value, onChange})` — uploads via `uploadMedia`, shows preview, sets URL.
  - `DataTable({columns, rows, renderActions})` — generic list table.

- [ ] **Step 1: Implement the three components**

`Field`: labelled input/textarea (controlled). `ImageUpload`: file input →
`uploadMedia(file)` → calls `onChange(url)`, shows spinner while uploading and
a thumbnail when set. `DataTable`: takes `columns: {key,label,render?}[]` and
`rows`, renders a styled table with an Actions column from `renderActions(row)`.

- [ ] **Step 2: Verify build**

Run: `npm run build` → success.

- [ ] **Step 3: Commit**

```bash
git add src/admin/components/Field.tsx src/admin/components/ImageUpload.tsx src/admin/components/DataTable.tsx
git commit -m "feat: shared admin form and table components"
```

---

### Task 4.4: Events admin (list + form)

**Files:**
- Modify: `src/admin/pages/Events.tsx`
- Create: `src/admin/pages/EventForm.tsx`

**Interfaces:**
- Consumes: `listAllEvents`, `upsertEvent`, `deleteEvent`, `slugify`, `DataTable`, `Field`, `ImageUpload`.
- Produces: list with New/Edit/Delete + publish toggle; modal or inline form.

- [ ] **Step 1: Implement Events list + form**

`Events.tsx`: load all events into `DataTable` (columns: Titre, Date, Publié).
"Nouvel événement" opens `EventForm` (inline panel) with empty state; row Edit
opens it with the row. `EventForm` fields: title (auto-fills slug via
`slugify` when slug empty), event_date, location, description, content,
`ImageUpload` for image_url, published checkbox. Save → `upsertEvent` →
refresh list. Delete → confirm() → `deleteEvent` → refresh.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: create an event, see it listed;
toggle published; delete it.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Events.tsx src/admin/pages/EventForm.tsx
git commit -m "feat: admin events CRUD"
```

---

### Task 4.5: Articles admin (list + form)

**Files:**
- Modify: `src/admin/pages/Articles.tsx`
- Create: `src/admin/pages/ArticleForm.tsx`

**Interfaces:**
- Consumes: `listAllArticles`, `upsertArticle`, `deleteArticle`, `slugify`, shared components.
- Produces: articles list + form with publish (sets `published_at` when first published).

- [ ] **Step 1: Implement Articles list + form**

Mirror Events. `ArticleForm` fields: title (→ slug), excerpt, content
(textarea), `ImageUpload`, published checkbox. On save, if `published` is true
and `published_at` is null, set `published_at = new Date().toISOString()`.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: create/publish/delete an article.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Articles.tsx src/admin/pages/ArticleForm.tsx
git commit -m "feat: admin articles CRUD"
```

---

### Task 4.6: Intervenants admin (list + form)

**Files:**
- Modify: `src/admin/pages/Intervenants.tsx`
- Create: `src/admin/pages/IntervenantForm.tsx`

**Interfaces:**
- Consumes: `listAllIntervenants`, `upsertIntervenant`, `deleteIntervenant`, shared components.
- Produces: intervenants list + form.

- [ ] **Step 1: Implement Intervenants list + form**

`IntervenantForm` fields: name, domain, bio (textarea), price, website,
`ImageUpload` for photo_url, published checkbox (default true). Same
list/edit/delete pattern.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: create/edit/delete an intervenant.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages/Intervenants.tsx src/admin/pages/IntervenantForm.tsx
git commit -m "feat: admin intervenants CRUD"
```

---

## Phase 5 — Admin settings (invite)

### Task 5.1: Settings — invite admin + list admins

**Files:**
- Modify: `src/admin/pages/Settings.tsx`
- Add to `src/lib/api.ts`: `listAdmins()`

**Interfaces:**
- Consumes: `inviteAdmin`, `listAdmins`.
- Produces: settings page with admins list + invite-by-email form.

- [ ] **Step 1: Add `listAdmins` to api.ts**

```ts
export async function listAdmins(): Promise<{ id: string; email: string; full_name: string | null }[]> {
  const { data, error } = await supabase.from('admins').select('id,email,full_name').order('created_at')
  return unwrap(data, error)
}
```

- [ ] **Step 2: Implement Settings**

Show current admins (from `listAdmins`). Invite form: email input → `inviteAdmin`
→ success message explaining the invitee receives a magic link, and that after
their first login an existing admin must add them to the `admins` table (show
the exact SQL snippet with a copy note). This documents the v1 limitation
honestly.

- [ ] **Step 3: Verify build + browser**

Run: `npm run build` → success. Preview: settings lists the seeded admin;
submitting an email shows the confirmation message.

- [ ] **Step 4: Commit**

```bash
git add src/admin/pages/Settings.tsx src/lib/api.ts
git commit -m "feat: admin settings with invite and admins list"
```

---

## Phase 6 — Public site integration

### Task 6.1: Public Événements from Supabase

**Files:**
- Modify: `src/pages/Evenements.tsx`

**Interfaces:**
- Consumes: `listPublishedEvents`, `formatDate`.

- [ ] **Step 1: Replace static empty-state with live data**

On mount call `listPublishedEvents`. If none, keep the existing "D'autres
expériences arrivent bientôt" empty state. Otherwise render a grid of event
cards (image, title, `formatDate(event_date)`, location, description). Keep
newsletter + CTA sections.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview `/evenements`: publish one event in
admin, reload public page → it appears.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Evenements.tsx
git commit -m "feat: public events page reads from supabase"
```

---

### Task 6.2: Public Blog list + article page

**Files:**
- Modify: `src/pages/Blog.tsx`
- Create: `src/pages/BlogArticle.tsx`
- Modify: `src/App.tsx` (add `/blog/:slug` route inside PublicSite)

**Interfaces:**
- Consumes: `listPublishedArticles`, `getArticleBySlug`, `formatDate`.

- [ ] **Step 1: Blog list**

On mount `listPublishedArticles`. If none → keep "Aucun article pour le
moment." Else render cards linking to `/blog/:slug` (image, title, excerpt,
`formatDate(published_at)`).

- [ ] **Step 2: Article page**

`BlogArticle.tsx`: read `:slug` param, `getArticleBySlug`; if null show a
"Article introuvable" state; else render hero image, title, date, content.

- [ ] **Step 3: Add route**

In `PublicSite` routes add `<Route path="/blog/:slug" element={<BlogArticle />} />`.

- [ ] **Step 4: Verify build + browser**

Run: `npm run build` → success. Preview: publish an article, see it in list and
open its page.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Blog.tsx src/pages/BlogArticle.tsx src/App.tsx
git commit -m "feat: public blog list and article page from supabase"
```

---

### Task 6.3: Public Intervenants from Supabase

**Files:**
- Modify: `src/pages/Intervenants.tsx`

**Interfaces:**
- Consumes: `listPublishedIntervenants`.

- [ ] **Step 1: Replace hardcoded PEOPLE with live data**

On mount `listPublishedIntervenants`. Derive the domain filter pills from the
distinct `domain` values plus "Tous les domaines". Keep the click-to-reveal
card behavior. If a photo_url exists, show it in the card. Empty → simple
"Aucun accompagnant·e pour le moment."

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: add an intervenant in admin → appears
on public page; filter works.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Intervenants.tsx
git commit -m "feat: public intervenants page reads from supabase"
```

---

### Task 6.4: Public reservation form

**Files:**
- Create: `src/pages/Reservation.tsx`
- Modify: `src/App.tsx` (add `/reserver` route)
- Modify: `src/pages/Home.tsx`, `src/pages/LeLieu.tsx` (point "Réserver" buttons to `/reserver`)

**Interfaces:**
- Consumes: `createReservation`.

- [ ] **Step 1: Build the form**

Fields: type (select: Privatisation complète, Chambre Litha, Chambre Mabon,
Chambre Imbolc, Séjour sur mesure), arrival_date, departure_date, guests,
client_name, client_email, client_phone, message. Submit → `createReservation`
→ success screen ("Votre demande a bien été envoyée, nous revenons vers vous
sous 48h."). Validate required fields; show error line on failure.

- [ ] **Step 2: Route + button links**

Add `<Route path="/reserver" element={<Reservation />} />` in PublicSite.
Change the room "Réserver maintenant" and hero/CTA "Réserver" links from
`/contact` to `/reserver` where they mean booking.

- [ ] **Step 3: Verify build + browser**

Run: `npm run build` → success. Preview: submit a reservation → appears in
`/admin/reservations` as "En attente".

- [ ] **Step 4: Commit**

```bash
git add src/pages/Reservation.tsx src/App.tsx src/pages/Home.tsx src/pages/LeLieu.tsx
git commit -m "feat: public reservation form creating pending reservations"
```

---

### Task 6.5: Contact form writes to messages

**Files:**
- Modify: `src/pages/Contact.tsx`

**Interfaces:**
- Consumes: `createMessage`.

- [ ] **Step 1: Wire the existing form**

Make fields controlled; on submit call `createMessage` with first_name,
last_name, email, phone, subject (from the existing select), body. Show success
message; keep the info column.

- [ ] **Step 2: Verify build + browser**

Run: `npm run build` → success. Preview: submit contact form → row appears in
Supabase `messages` table.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Contact.tsx
git commit -m "feat: contact form persists messages to supabase"
```

---

## Phase 7 — Deploy config

### Task 7.1: Vercel env vars + verify production

**Files:**
- None (config) — plus a note in `README` optional.

- [ ] **Step 1: [MANUAL] Add env vars on Vercel**

User (or agent via CLI): add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
to the Vercel project (Production + Preview):
```bash
vercel env add VITE_SUPABASE_URL production --scope gramica1
vercel env add VITE_SUPABASE_ANON_KEY production --scope gramica1
```

- [ ] **Step 2: Redeploy**

```bash
vercel --prod --scope gramica1 --yes
```

- [ ] **Step 3: Verify**

Open the production URL `/admin/login`, log in with the seeded admin, confirm
dashboard loads and a public reservation reaches the admin list.

- [ ] **Step 4: Commit any config**

```bash
git add -A && git commit -m "chore: document vercel env for supabase" || true
```

---

## Self-Review

**Spec coverage:**
- Supabase backend + auth + storage → Tasks 0.1–0.4, 3.1.
- Tables/RLS/reference → Task 0.3; types → 0.4.
- Login + dashboard → 3.2, 4.1.
- Reservations (filter/confirm/cancel/CSV) → 4.2.
- Events/Articles/Intervenants CRUD + image upload + publish → 4.3–4.6.
- Invite admin + admins list → 5.1.
- Public dynamic events/blog/intervenants → 6.1–6.3.
- Public reservation form (pending) → 6.4; contact → messages → 6.5.
- Deploy env → 7.1.
- Out of scope (payment, full Messages/Settings screens) → respected.

**Placeholder scan:** UI-heavy tasks (4.1, 4.2, 4.4–4.6, 6.x) describe behavior
with exact fns/fields rather than full JSX, by design (repetitive CRUD with the
shared primitives from 4.3); pure-logic tasks include complete code + tests.

**Type consistency:** api.ts names used consistently across pages; DB types in
`src/types/db.ts` are the single source; `EventRow` used (not `Event`) to avoid
clashing with the DOM `Event` type.

**Known v1 limitation (documented):** admin invite sends a magic link, but
adding the invitee to `admins` still needs one SQL insert (surfaced in Settings
UI). Full service_role invite deferred.
