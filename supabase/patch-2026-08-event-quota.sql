-- Fairy House — patch : places restantes par événement (quota). Idempotent.
-- À exécuter dans Supabase > SQL Editor.
-- Une inscription = 1 place (guests = 1). On compte les inscriptions non
-- annulées par événement, via une fonction SECURITY DEFINER (le public ne peut
-- pas lire `reservations` directement à cause de la RLS).

create or replace function events_seats_taken()
returns table(event_id uuid, taken int)
language sql security definer stable as $$
  select r.event_id, count(*)::int as taken
  from reservations r
  where r.event_id is not null and r.status <> 'cancelled'
  group by r.event_id;
$$;
grant execute on function events_seats_taken() to anon, authenticated;

notify pgrst, 'reload schema';
