-- Fairy House — patch : événements à réservation externe (co-organisés). Idempotent.
-- À exécuter dans Supabase > SQL Editor.

alter table events add column if not exists reservation_type text not null default 'interne';
alter table events add column if not exists external_url text;
alter table events add column if not exists partner_name text;

-- La capacité d'un événement EXTERNE ne doit PAS occuper de lits (gérée par le
-- partenaire) : on recalcule beds_taken_on pour ne compter que les événements
-- internes (null = interne, rétro-compatibilité).
create or replace function beds_taken_on(d date) returns int
language sql security definer stable as $$
  with cfg as (
    select coalesce((select total_beds from org_settings where id = 'org'), 11) as total
  )
  select
    coalesce((
      select sum(case when (r.rooms ? 'wholeHouse') then (select total from cfg)
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
        and coalesce(e.reservation_type, 'interne') = 'interne'
        and e.event_date <= d
        and coalesce(e.event_end_date, e.event_date) >= d
    ), 0);
$$;
grant execute on function beds_taken_on(date) to anon, authenticated;

notify pgrst, 'reload schema';
