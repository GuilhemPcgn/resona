-- =============================================
-- STEP 1 — À exécuter EN PREMIER dans le SQL Editor
-- Patches les enums existants avec les valeurs manquantes.
-- Doit être commité AVANT de lancer seed_step2_data.sql
-- =============================================

-- Suppression des colonnes parasites absentes du schéma cible
ALTER TABLE public.clients DROP COLUMN IF EXISTS studio_id;

-- Colonnes optionnelles de profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  TEXT,
  ADD COLUMN IF NOT EXISTS last_name   TEXT,
  ADD COLUMN IF NOT EXISTS company     TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS role        TEXT;

-- Création des enums s'ils n'existent pas encore
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE public.client_status AS ENUM ('active','inactive','prospect','vip');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE public.project_status AS ENUM ('draft','in_progress','on_hold','completed','cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
        CREATE TYPE public.session_type AS ENUM ('recording','mixing','mastering','editing','meeting');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_location') THEN
        CREATE TYPE public.session_location AS ENUM ('studio','remote','on_site');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('todo','in_progress','in_review','done','blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('draft','sent','overdue','paid','cancelled');
    END IF;
END $$;

-- Ajout des valeurs manquantes dans les enums existants
ALTER TYPE public.client_status    ADD VALUE IF NOT EXISTS 'prospect';
ALTER TYPE public.client_status    ADD VALUE IF NOT EXISTS 'vip';
ALTER TYPE public.project_status   ADD VALUE IF NOT EXISTS 'on_hold';
ALTER TYPE public.project_status   ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.session_type     ADD VALUE IF NOT EXISTS 'editing';
ALTER TYPE public.session_type     ADD VALUE IF NOT EXISTS 'meeting';
ALTER TYPE public.session_location ADD VALUE IF NOT EXISTS 'on_site';
ALTER TYPE public.task_status      ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE public.task_status      ADD VALUE IF NOT EXISTS 'done';
ALTER TYPE public.task_status      ADD VALUE IF NOT EXISTS 'blocked';
