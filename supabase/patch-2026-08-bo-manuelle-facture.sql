-- Fairy House — patch : inscription manuelle événement + adresse facture. Idempotent.
-- À exécuter dans Supabase > SQL Editor.

-- [1] Le quota d'un événement se compte désormais au NOMBRE DE PLACES (guests),
-- pour permettre une inscription manuelle de groupe. Identique pour les
-- inscriptions en ligne (guests = 1).
create or replace function events_seats_taken()
returns table(event_id uuid, taken int)
language sql security definer stable as $$
  select r.event_id, sum(coalesce(r.guests, 1))::int as taken
  from reservations r
  where r.event_id is not null and r.status <> 'cancelled'
  group by r.event_id;
$$;
grant execute on function events_seats_taken() to anon, authenticated;

-- [2] Adresse de facturation du client sur la facture (affichée sur le PDF).
alter table factures add column if not exists client_address text;

notify pgrst, 'reload schema';
