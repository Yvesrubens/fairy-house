-- supabase/patch-2026-07-reservation-tunnel.sql
-- Fairy House — patch incrémental : tunnel de réservation.
-- À exécuter dans Supabase > SQL Editor sur une base existante.
-- Colonnes additives et nullable : n'impacte pas les réservations existantes.

alter table reservations add column if not exists mode text;                 -- 'groupe' | 'individuel'
alter table reservations add column if not exists rooms jsonb;               -- [{room,guests}] ou {wholeHouse:true}
alter table reservations add column if not exists beds int;                  -- parcours individuel
alter table reservations add column if not exists options jsonb;             -- {linge:bool,pension:bool}
alter table reservations add column if not exists activities_requested boolean not null default false;
alter table reservations add column if not exists allergies text;
alter table reservations add column if not exists payment_method text;       -- 'virement' | 'cb' | 'paypal'
alter table reservations add column if not exists payment_plan text;         -- 'once' | 'split'
alter table reservations add column if not exists total_ht numeric;
alter table reservations add column if not exists vat_rate numeric default 10;
alter table reservations add column if not exists total_ttc numeric;
alter table reservations add column if not exists deposit_amount numeric;
alter table reservations add column if not exists balance_amount numeric;
alter table reservations add column if not exists balance_due_date date;
