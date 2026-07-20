-- Fairy House — patch incrémental (lot 2)
-- À exécuter dans Supabase > SQL Editor sur une base existante.
-- (Le fichier schema.sql reste la référence complète.)

-- 1) BUG « duplicate key value violates unique constraint reservations-reference_key »
--    La fonction doit être en security definer pour lire `reservations` (RLS)
--    lorsqu'elle est appelée par un visiteur public. Sinon le numéro reste
--    toujours 1 → collision dès la 2e réservation publique.
create or replace function next_reservation_reference() returns text
language plpgsql security definer as $$
declare
  yr text := to_char(now(), 'YYYY');
  n int;
begin
  select coalesce(max((split_part(reference,'-',3))::int),0)+1 into n
  from reservations where reference like 'FH-'||yr||'-%';
  return 'FH-'||yr||'-'||lpad(n::text,5,'0');
end; $$;

-- 2) Capacité (quota de places) sur les événements
alter table events add column if not exists capacity int;

-- 3) Lien réservation -> événement
alter table reservations add column if not exists event_id uuid;
alter table reservations drop constraint if exists reservations_event_id_fkey;
alter table reservations
  add constraint reservations_event_id_fkey
  foreign key (event_id) references events(id) on delete set null;

-- 4) Newsletter
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
