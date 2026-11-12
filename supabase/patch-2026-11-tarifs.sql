-- Fairy House — patch 2026-11 : tarifs modifiables depuis l'admin.
-- Une seule ligne (id = 1). Prix en TTC (TVA 10 %), lus par le tunnel de
-- réservation ; modifiables uniquement par les admins. Idempotent.

create table if not exists tarifs (
  id int primary key default 1 check (id = 1),
  lit_nuit_ttc numeric not null check (lit_nuit_ttc >= 0),        -- lit simple, par personne et par nuit
  linge_ttc numeric not null check (linge_ttc >= 0),              -- linge de maison, par personne (forfait séjour)
  pension_nuit_ttc numeric not null check (pension_nuit_ttc >= 0),-- pension complète, par personne et par nuit
  maison_nuit_ttc numeric not null check (maison_nuit_ttc >= 0),  -- maison complète, forfait par nuit
  updated_at timestamptz not null default now()
);

-- Valeurs actuelles (ne remplace pas des tarifs déjà saisis).
insert into tarifs (id, lit_nuit_ttc, linge_ttc, pension_nuit_ttc, maison_nuit_ttc)
values (1, 50, 8, 20, 700)
on conflict (id) do nothing;

alter table tarifs enable row level security;
drop policy if exists tarifs_public on tarifs;
create policy tarifs_public on tarifs for select using (true);
drop policy if exists tarifs_admin on tarifs;
create policy tarifs_admin on tarifs for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
