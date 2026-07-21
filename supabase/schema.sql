-- Fairy House — schéma Supabase
-- À exécuter dans Supabase > SQL Editor.

-- ------------------------------------------------------------------ Tables
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  type text not null,
  arrival_date date not null,
  departure_date date,
  guests int,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  message text,
  event_id uuid,
  mode text,
  rooms jsonb,
  beds int,
  options jsonb,
  activities_requested boolean not null default false,
  allergies text,
  payment_method text,
  payment_plan text,
  total_ht numeric,
  vat_rate numeric default 10,
  total_ttc numeric,
  deposit_amount numeric,
  balance_amount numeric,
  balance_due_date date,
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  content text,
  event_date date,
  location text,
  image_url text,
  capacity int,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Lien réservation -> événement (ajouté après la création de `events`)
alter table reservations
  drop constraint if exists reservations_event_id_fkey;
alter table reservations
  add constraint reservations_event_id_fkey
  foreign key (event_id) references events(id) on delete set null;

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists intervenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null,
  bio text,
  price text,
  website text,
  photo_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Abonné·es à la newsletter (formulaire du Journal + « Être informé·e »)
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- Functions
-- L'utilisateur courant est-il un admin ?
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from admins where id = auth.uid());
$$;

-- Génération de référence : FH-YYYY-NNNNN par année
-- security definer : indispensable pour que la fonction puisse lire la table
-- `reservations` (protégée par RLS) même quand elle est appelée par un
-- visiteur public. Sans cela, le numéro calculé reste toujours 1 et provoque
-- une violation de contrainte unique sur `reference`.
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

-- --------------------------------------------------------------------- RLS
alter table admins enable row level security;
alter table reservations enable row level security;
alter table events enable row level security;
alter table articles enable row level security;
alter table intervenants enable row level security;
alter table messages enable row level security;
alter table newsletter_subscribers enable row level security;

drop policy if exists admins_select on admins;
create policy admins_select on admins for select using (is_admin());

drop policy if exists res_insert on reservations;
create policy res_insert on reservations for insert with check (true);
drop policy if exists res_select on reservations;
create policy res_select on reservations for select using (is_admin());
drop policy if exists res_update on reservations;
create policy res_update on reservations for update using (is_admin());
drop policy if exists res_delete on reservations;
create policy res_delete on reservations for delete using (is_admin());

drop policy if exists msg_insert on messages;
create policy msg_insert on messages for insert with check (true);
drop policy if exists msg_select on messages;
create policy msg_select on messages for select using (is_admin());
drop policy if exists msg_update on messages;
create policy msg_update on messages for update using (is_admin());

-- Newsletter : inscription ouverte à tous, lecture/suppression réservées à l'admin
drop policy if exists news_insert on newsletter_subscribers;
create policy news_insert on newsletter_subscribers for insert with check (true);
drop policy if exists news_select on newsletter_subscribers;
create policy news_select on newsletter_subscribers for select using (is_admin());
drop policy if exists news_delete on newsletter_subscribers;
create policy news_delete on newsletter_subscribers for delete using (is_admin());

drop policy if exists ev_public on events;
create policy ev_public on events for select using (published or is_admin());
drop policy if exists ev_write on events;
create policy ev_write on events for all using (is_admin()) with check (is_admin());

drop policy if exists ar_public on articles;
create policy ar_public on articles for select using (published or is_admin());
drop policy if exists ar_write on articles;
create policy ar_write on articles for all using (is_admin()) with check (is_admin());

drop policy if exists in_public on intervenants;
create policy in_public on intervenants for select using (published or is_admin());
drop policy if exists in_write on intervenants;
create policy in_write on intervenants for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------------ Devis
create table if not exists devis (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  reservation_id uuid references reservations(id) on delete set null,
  client_name text,
  client_email text,
  lines jsonb not null,
  total_ht numeric not null,
  vat_rate numeric not null default 20,
  total_ttc numeric not null,
  validity_days int not null default 30,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table devis enable row level security;
drop policy if exists devis_all on devis;
create policy devis_all on devis for all using (is_admin()) with check (is_admin());

-- Génération de référence : DEV-YYYY-NNNNN par année
create or replace function next_devis_reference() returns text
language plpgsql as $$
declare
  yr text := to_char(now(), 'YYYY');
  n int;
begin
  select coalesce(max((split_part(reference,'-',3))::int),0)+1 into n
  from devis where reference like 'DEV-'||yr||'-%';
  return 'DEV-'||yr||'-'||lpad(n::text,5,'0');
end; $$;

-- ----------------------------------------------------------------- Storage
insert into storage.buckets (id, name, public) values ('media','media', true)
  on conflict (id) do nothing;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for insert to authenticated with check (bucket_id = 'media');
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated using (bucket_id = 'media');
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media');
