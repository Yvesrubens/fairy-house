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
  published boolean not null default false,
  created_at timestamptz not null default now()
);

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

-- --------------------------------------------------------------- Functions
-- L'utilisateur courant est-il un admin ?
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from admins where id = auth.uid());
$$;

-- Génération de référence : FH-YYYY-NNNNN par année
create or replace function next_reservation_reference() returns text
language plpgsql as $$
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

drop policy if exists admins_select on admins;
create policy admins_select on admins for select using (is_admin());

drop policy if exists res_insert on reservations;
create policy res_insert on reservations for insert with check (true);
drop policy if exists res_select on reservations;
create policy res_select on reservations for select using (is_admin());
drop policy if exists res_update on reservations;
create policy res_update on reservations for update using (is_admin());

drop policy if exists msg_insert on messages;
create policy msg_insert on messages for insert with check (true);
drop policy if exists msg_select on messages;
create policy msg_select on messages for select using (is_admin());
drop policy if exists msg_update on messages;
create policy msg_update on messages for update using (is_admin());

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
