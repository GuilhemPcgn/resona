-- =============================================
-- Migration : 000_add_profiles_columns.sql
-- Objet     : Ajoute les colonnes manquantes à public.profiles
--             (first_name, last_name, company, phone, avatar_url)
--
-- Contexte  : Supabase génère la table profiles avec seulement id/email.
--             Les colonnes métier doivent être ajoutées manuellement.
--             ADD COLUMN IF NOT EXISTS → migration idempotente.
-- Instance  : tvvhopbpwqofmuwyxubt
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  TEXT,
  ADD COLUMN IF NOT EXISTS last_name   TEXT,
  ADD COLUMN IF NOT EXISTS company     TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS role        TEXT;
