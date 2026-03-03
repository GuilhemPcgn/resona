-- =============================================
-- Migration : 004_projects_start_end_dates.sql
-- Objet     : Ajout des colonnes start_date et end_date sur la table projects
--             pour aligner le schéma avec le backend (CreateProjectDto)
--             et le formulaire frontend.
--
-- Contexte  : La table projects possédait une colonne "deadline" mais pas
--             de "start_date" ni "end_date". Le backend et le frontend
--             utilisent start_date / end_date, ce qui provoquait une erreur
--             lors de l'insertion dès que l'utilisateur renseignait des dates.
-- =============================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date   DATE;
