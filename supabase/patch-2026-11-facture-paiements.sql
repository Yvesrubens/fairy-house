-- Fairy House — patch 2026-11 : enregistrement des paiements sur les factures.
-- Une facture peut recevoir plusieurs règlements (acompte + solde, espèces sur
-- place, virement…). Le statut (payée / partielle / à régler) est calculé à
-- partir de la somme des paiements. Idempotent.

create table if not exists facture_payments (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references factures(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text not null check (method in ('especes','virement','cb','cheque','autre')),
  paid_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists facture_payments_facture_idx on facture_payments(facture_id);

alter table facture_payments enable row level security;
drop policy if exists facture_payments_admin on facture_payments;
create policy facture_payments_admin on facture_payments
  for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
