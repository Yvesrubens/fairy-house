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
