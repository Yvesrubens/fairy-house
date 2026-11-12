-- Fairy House — patch 2026-11 : bons cadeaux.
-- Achat en ligne (Stripe) → bon PDF numéroté envoyé à l'acheteur.
-- Registre admin : suivi du solde, enregistrement des utilisations.
-- Aucun accès public (création et lecture uniquement côté serveur / admin) :
-- un code de bon a une valeur monétaire. Idempotent.

create table if not exists gift_vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                 -- ex. FH-7K3M-9QX2 (aléatoire, non devinable)
  amount numeric not null check (amount > 0),-- valeur faciale TTC
  balance numeric not null check (balance >= 0), -- solde restant
  buyer_name text not null,
  buyer_email text not null,
  recipient_name text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'cancelled')),
  stripe_session_id text,
  stripe_payment_intent text,
  paid_at timestamptz,
  expires_at date,                           -- validité 1 an après l'achat
  sent_at timestamptz,                       -- envoi du bon par e-mail
  created_at timestamptz not null default now()
);

create table if not exists gift_voucher_uses (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references gift_vouchers(id) on delete cascade,
  amount numeric not null check (amount > 0),
  used_at date not null default current_date,
  reservation_ref text,                      -- réservation / facture concernée
  note text,
  created_at timestamptz not null default now()
);

create index if not exists gift_voucher_uses_voucher_idx on gift_voucher_uses(voucher_id);

-- Solde tenu à jour automatiquement : montant − somme des utilisations.
-- La contrainte balance >= 0 refuse toute utilisation qui dépasserait le solde.
create or replace function gift_voucher_refresh_balance() returns trigger
language plpgsql security definer as $$
declare
  vid uuid := coalesce(new.voucher_id, old.voucher_id);
begin
  update gift_vouchers v
     set balance = v.amount - coalesce(
       (select sum(u.amount) from gift_voucher_uses u where u.voucher_id = vid), 0)
   where v.id = vid;
  return null;
end; $$;

drop trigger if exists gift_voucher_uses_balance on gift_voucher_uses;
create trigger gift_voucher_uses_balance
  after insert or update or delete on gift_voucher_uses
  for each row execute function gift_voucher_refresh_balance();

alter table gift_vouchers enable row level security;
alter table gift_voucher_uses enable row level security;

drop policy if exists gift_vouchers_admin on gift_vouchers;
create policy gift_vouchers_admin on gift_vouchers
  for all using (is_admin()) with check (is_admin());

drop policy if exists gift_voucher_uses_admin on gift_voucher_uses;
create policy gift_voucher_uses_admin on gift_voucher_uses
  for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
