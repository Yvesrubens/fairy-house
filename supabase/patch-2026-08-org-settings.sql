-- Fairy House — patch : coordonnées & facturation éditables (dashboard). Idempotent.
-- À exécuter dans Supabase > SQL Editor.

-- Ligne unique de configuration (id fixe 'org').
create table if not exists org_settings (
  id text primary key default 'org' check (id = 'org'),
  contact_email text,
  contact_phone text,
  address text,
  siret text,
  tva text,
  rib_iban text,
  rib_bic text,
  rib_titulaire text,
  updated_at timestamptz not null default now()
);

alter table org_settings enable row level security;
-- Lecture/écriture réservées à l'admin (le RIB n'est jamais exposé publiquement ;
-- les fonctions serveur "book" y accèdent via la clé service qui contourne la RLS).
drop policy if exists org_settings_admin on org_settings;
create policy org_settings_admin on org_settings for all using (is_admin()) with check (is_admin());

-- Amorce de la ligne unique.
insert into org_settings (id) values ('org') on conflict (id) do nothing;

notify pgrst, 'reload schema';
