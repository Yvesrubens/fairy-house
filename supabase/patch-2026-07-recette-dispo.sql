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
