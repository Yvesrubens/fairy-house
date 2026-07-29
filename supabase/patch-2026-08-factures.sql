-- Fairy House — patch : modèle de facture (Q2). Idempotent.
-- À exécuter dans Supabase > SQL Editor.

create table if not exists factures (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  reservation_id uuid references reservations(id) on delete set null,
  client_name text,
  client_email text,
  lines jsonb not null,
  total_ht numeric not null,
  vat_rate numeric not null default 20,
  total_ttc numeric not null,
  issued_at timestamptz,
  created_at timestamptz not null default now()
);

alter table factures enable row level security;
drop policy if exists factures_all on factures;
create policy factures_all on factures for all using (is_admin()) with check (is_admin());

-- Numérotation FAC-AAAA-NNNNN par année.
create or replace function next_facture_reference() returns text
language plpgsql security definer as $$
declare
  yr text := to_char(now(), 'YYYY');
  n int;
begin
  select coalesce(max((split_part(reference,'-',3))::int),0)+1 into n
  from factures where reference like 'FAC-'||yr||'-%';
  return 'FAC-'||yr||'-'||lpad(n::text,5,'0');
end; $$;

notify pgrst, 'reload schema';
