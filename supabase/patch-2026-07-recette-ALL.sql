-- Fairy House — TOUTES les migrations du recette (à coller dans Supabase > SQL Editor)
-- Idempotent : peut être ré-exécuté sans risque.


-- ============================================================
-- supabase/patch-2026-07-recette-sync.sql
-- ============================================================
-- Fairy House — patch de synchronisation (recette juillet 2026)
-- À exécuter dans Supabase > SQL Editor sur la base de PRODUCTION.
--
-- Contexte : le recette a révélé que la base connectée est désynchronisée du
-- dépôt (des migrations n'ont pas été appliquées). Symptômes constatés :
--   * [F14] Newsletter : « Could not find the table 'public.newsletter_subscribers'
--            in the schema cache » → la table n'existe pas.
--   * [B3]  Création d'événement avec quota : erreur probable car la colonne
--            events.capacity (et/ou les colonnes tarifaires) manque(nt).
--
-- Ce script est 100 % idempotent (if not exists) : sans effet si déjà appliqué.
-- Il ne fait qu'ALIGNER la base sur schema.sql + patches existants.

-- ------------------------------------------------------------ [F14] Newsletter
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

drop policy if exists news_insert on newsletter_subscribers;
create policy news_insert on newsletter_subscribers for insert with check (true);
drop policy if exists news_select on newsletter_subscribers;
create policy news_select on newsletter_subscribers for select using (is_admin());
drop policy if exists news_delete on newsletter_subscribers;
create policy news_delete on newsletter_subscribers for delete using (is_admin());

-- ---------------------------------------------- [B3] Quota + tarifs événement
alter table events add column if not exists capacity int;
alter table events add column if not exists event_price_ttc numeric;
alter table events add column if not exists accommodation_tente_ttc numeric;
alter table events add column if not exists accommodation_chambre_ttc numeric;
alter table events add column if not exists shuttle_enabled boolean not null default false;
alter table events add column if not exists shuttle_price_ttc numeric default 15;
alter table events add column if not exists split_payment_enabled boolean not null default false;
alter table events add column if not exists reglement_texte text;
alter table events add column if not exists droits_image_texte text;

-- Après un ALTER, forcer PostgREST à recharger son cache de schéma :
notify pgrst, 'reload schema';


-- ============================================================
-- supabase/patch-2026-07-recette-lot2.sql
-- ============================================================
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


-- ============================================================
-- supabase/patch-2026-07-recette-dispo.sql
-- ============================================================
-- Fairy House — patch recette : sous-système Disponibilités (B1, B2, F1-F4)
-- À exécuter dans Supabase > SQL Editor. Idempotent.
--
-- Modèle : compteur global de 11 lits/nuit. Une nuit est « prise » par :
--   * les réservations CONFIRMÉES hors événement (privatisation = 11 lits =
--     exclusivité totale ; sinon nombre de personnes) ;
--   * les blocages manuels (bed_blocks) ;
--   * la capacité (quota) des événements sur leur plage de dates.
-- Les fonctions sont SECURITY DEFINER : elles contournent la RLS pour que le
-- public puisse vérifier la disponibilité sans lire les données de réservation.

create table if not exists bed_blocks (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,            -- exclusif (nuits [start, end))
  beds int not null,
  label text,
  created_at timestamptz not null default now()
);
alter table bed_blocks enable row level security;
drop policy if exists bb_admin on bed_blocks;
create policy bb_admin on bed_blocks for all using (is_admin()) with check (is_admin());

-- Lits pris pour une nuit donnée (fonction interne réutilisée).
create or replace function beds_taken_on(d date) returns int
language sql security definer stable as $$
  select
    coalesce((
      select sum(case when (r.rooms ? 'wholeHouse') then 11
                      else coalesce(r.guests, r.beds, 0) end)
      from reservations r
      where r.status = 'confirmed'
        and r.event_id is null
        and r.arrival_date <= d
        and coalesce(r.departure_date, r.arrival_date + 1) > d
    ), 0)
    + coalesce((
      select sum(b.beds) from bed_blocks b
      where b.start_date <= d and b.end_date > d
    ), 0)
    + coalesce((
      select sum(e.capacity) from events e
      where e.capacity is not null
        and e.event_date <= d
        and coalesce(e.event_end_date, e.event_date) >= d
    ), 0);
$$;
grant execute on function beds_taken_on(date) to anon, authenticated;

-- Disponibilité pour une demande (B1/B2). whole_house => exige 0 lit pris.
create or replace function check_availability(
  p_arrival date,
  p_departure date,
  p_beds int,
  p_whole_house boolean
) returns boolean
language plpgsql security definer stable as $$
declare
  total_beds int := 11;
  d date;
  end_night date;
begin
  if p_arrival is null then return false; end if;
  end_night := coalesce(p_departure, p_arrival + 1);
  if end_night <= p_arrival then end_night := p_arrival + 1; end if;
  d := p_arrival;
  while d < end_night loop
    if p_whole_house then
      if beds_taken_on(d) > 0 then return false; end if;
    else
      if beds_taken_on(d) + coalesce(p_beds, 0) > total_beds then return false; end if;
    end if;
    d := d + 1;
  end loop;
  return true;
end; $$;
grant execute on function check_availability(date, date, int, boolean) to anon, authenticated;

-- Lits restants par date (pour le calendrier F1).
create or replace function availability_calendar(p_from date, p_to date)
returns table(day date, remaining int)
language sql security definer stable as $$
  select g::date as day, greatest(0, 11 - beds_taken_on(g::date)) as remaining
  from generate_series(p_from, p_to, interval '1 day') as g;
$$;
grant execute on function availability_calendar(date, date) to anon, authenticated;

notify pgrst, 'reload schema';


-- ============================================================
-- supabase/patch-2026-07-recette-f8.sql
-- ============================================================
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

