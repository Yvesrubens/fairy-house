-- Fairy House — patch recette (lot 2 : F5, F11, F12)
-- À exécuter dans Supabase > SQL Editor. 100 % idempotent.

-- [F5] Événement : date de fin (départ) en plus de la date de début (arrivée).
alter table events add column if not exists event_end_date date;

-- [F11] Messages : statut traité + archivé, et policy de suppression (absente).
alter table messages add column if not exists treated boolean not null default false;
alter table messages add column if not exists archived boolean not null default false;
drop policy if exists msg_delete on messages;
create policy msg_delete on messages for delete using (is_admin());

-- [F12] Domaines d'accompagnant·es gérés (liste fermée pour éviter les doublons).
create table if not exists intervenant_domains (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);
alter table intervenant_domains enable row level security;
drop policy if exists dom_public on intervenant_domains;
create policy dom_public on intervenant_domains for select using (true);
drop policy if exists dom_write on intervenant_domains;
create policy dom_write on intervenant_domains for all using (is_admin()) with check (is_admin());

-- Amorce : reprend les domaines déjà saisis en texte libre.
insert into intervenant_domains (name)
select distinct domain from intervenants
where domain is not null and domain <> ''
on conflict (name) do nothing;

notify pgrst, 'reload schema';
