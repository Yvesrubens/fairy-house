-- Fairy House — patch : paiement carte Stripe. Idempotent.
-- À exécuter dans Supabase > SQL Editor.
alter table reservations add column if not exists payment_status text not null default 'unpaid';
alter table reservations add column if not exists stripe_session_id text;
alter table reservations add column if not exists stripe_payment_intent text;
notify pgrst, 'reload schema';
