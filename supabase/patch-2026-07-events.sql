-- supabase/patch-2026-07-events.sql
-- Fairy House — patch incrémental : inscription payante à un événement.
-- À exécuter dans Supabase > SQL Editor sur une base existante.
-- Colonnes additives et nullable : n'impacte ni les événements ni les
-- réservations existants.

-- Config tarifaire par événement (surcharge des défauts globaux du code).
alter table events add column if not exists event_price_ttc numeric;              -- part animation (TVA 20%)
alter table events add column if not exists accommodation_tente_ttc numeric;      -- hébergement en tente (TVA 10%)
alter table events add column if not exists accommodation_chambre_ttc numeric;    -- chambre mixte partagée (TVA 10%)
alter table events add column if not exists shuttle_enabled boolean not null default false;
alter table events add column if not exists shuttle_price_ttc numeric default 15; -- navette A/R (TVA 10%)
alter table events add column if not exists split_payment_enabled boolean not null default false;
alter table events add column if not exists reglement_texte text;                 -- surcharge du texte règlement intérieur
alter table events add column if not exists droits_image_texte text;              -- surcharge du texte droits à l'image

-- Champs spécifiques d'une inscription à un événement.
alter table reservations add column if not exists social_handle text;             -- compte Instagram / Facebook
alter table reservations add column if not exists emergency_contact text;         -- contact en cas d'urgence
alter table reservations add column if not exists diet text;                      -- régime alimentaire
alter table reservations add column if not exists accommodation_choice text;      -- 'tente' | 'chambre' | 'aucun'
alter table reservations add column if not exists shuttle boolean;                -- navette demandée
alter table reservations add column if not exists consent_reglement boolean;      -- règlement intérieur accepté
alter table reservations add column if not exists consent_image boolean;          -- droits à l'image acceptés
alter table reservations add column if not exists quote_lines jsonb;              -- lignes chiffrées [{designation,qty,unitPrice,vatRate}]
alter table reservations add column if not exists vat_breakdown jsonb;            -- TVA par taux [{rate,ht,vat,ttc}]
