-- Fairy House — patch 2026-10 : modèles de mails (confirmation enrichie + mails planifiés).
-- Idempotent : ré-exécutable sans risque.

-- Événements : intervenant·es (texte libre) et consignes/matériel à apporter
-- (affichés dans les mails de confirmation et de préparation J-2).
alter table events add column if not exists intervenants text;
alter table events add column if not exists email_consignes text;

-- Réservations : marqueurs d'envoi des mails planifiés (anti-doublon pour le cron).
alter table reservations add column if not exists prep_sent_at timestamptz;          -- préparation J-2
alter table reservations add column if not exists satisfaction_sent_at timestamptz;  -- satisfaction J+2
alter table reservations add column if not exists reminder_sent_at timestamptz;      -- relance paiement (2 fois)

notify pgrst, 'reload schema';
