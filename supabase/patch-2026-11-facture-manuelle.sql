-- Fairy House — patch 2026-11 : factures saisies à la main (sans réservation).
-- Les factures reprises (ex. émises à la main cet été) peuvent porter leur
-- numéro d'origine, dans n'importe quel format. On rend donc la numérotation
-- automatique robuste : elle ne lit que les numéros « FAC-AAAA-NNNNN »
-- strictement numériques (sinon un numéro libre ferait échouer le calcul).
-- Si un numéro repris suit ce format, la suite automatique continue après lui.
-- Idempotent.

create or replace function next_facture_reference() returns text
language plpgsql security definer as $$
declare
  yr text := to_char(now(), 'YYYY');
  n int;
begin
  select coalesce(max((split_part(reference, '-', 3))::int), 0) + 1 into n
  from factures
  where reference ~ ('^FAC-' || yr || '-[0-9]+$');
  return 'FAC-' || yr || '-' || lpad(n::text, 5, '0');
end; $$;

notify pgrst, 'reload schema';
