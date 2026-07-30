-- Fairy House — patch recette 2 (points 9 et 14). Idempotent.
-- À exécuter dans Supabase > SQL Editor.

-- [9] Contact/adresse de facturation distincts sur une réservation.
alter table reservations add column if not exists billing_name text;
alter table reservations add column if not exists billing_email text;
alter table reservations add column if not exists billing_address text;

-- [14] Nombre de lits de la maison configurable (inventaire éditable au BO).
alter table org_settings add column if not exists total_beds int not null default 11;

-- Recalcul des fonctions de disponibilité pour lire le nombre de lits configuré
-- (repli sur 11 si org_settings absent). Une privatisation (wholeHouse) occupe
-- la totalité de l'inventaire → exclusivité conservée quel que soit le total.
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
        and e.event_date <= d
        and coalesce(e.event_end_date, e.event_date) >= d
    ), 0);
$$;
grant execute on function beds_taken_on(date) to anon, authenticated;

create or replace function check_availability(
  p_arrival date,
  p_departure date,
  p_beds int,
  p_whole_house boolean
) returns boolean
language plpgsql security definer stable as $$
declare
  total_beds int := coalesce((select total_beds from org_settings where id = 'org'), 11);
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

create or replace function availability_calendar(p_from date, p_to date)
returns table(day date, remaining int)
language sql security definer stable as $$
  with cfg as (
    select coalesce((select total_beds from org_settings where id = 'org'), 11) as total
  )
  select g::date as day,
    greatest(0, (select total from cfg) - beds_taken_on(g::date)) as remaining
  from generate_series(p_from, p_to, interval '1 day') as g;
$$;
grant execute on function availability_calendar(date, date) to anon, authenticated;

notify pgrst, 'reload schema';
