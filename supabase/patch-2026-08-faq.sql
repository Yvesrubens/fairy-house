-- Fairy House — patch 2026-08 : table FAQ (questions fréquentes gérées en admin).
-- Idempotent : ré-exécutable sans risque.

create table if not exists faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table faq enable row level security;

-- Lecture publique des entrées publiées ; admin voit tout.
drop policy if exists faq_public on faq;
create policy faq_public on faq for select using (published or is_admin());

-- Écriture réservée aux admins.
drop policy if exists faq_write on faq;
create policy faq_write on faq for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';
