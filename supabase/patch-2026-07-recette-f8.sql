-- Fairy House — patch recette : filtres d'événements (F8). Idempotent.

-- Catégorie sur l'événement + liste gérée de catégories (évite les doublons).
alter table events add column if not exists category text;

create table if not exists event_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);
alter table event_categories enable row level security;
drop policy if exists evcat_public on event_categories;
create policy evcat_public on event_categories for select using (true);
drop policy if exists evcat_write on event_categories;
create policy evcat_write on event_categories for all using (is_admin()) with check (is_admin());

-- Amorce : reprend les catégories déjà saisies sur des événements.
insert into event_categories (name)
select distinct category from events
where category is not null and category <> ''
on conflict (name) do nothing;

notify pgrst, 'reload schema';
