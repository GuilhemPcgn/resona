-- Migration 006 : ajout de la colonne progress sur la table projects
-- progress : entier 0-100, calculé automatiquement par le backend
--             (ProjectProgressService) à chaque changement de session,
--             fichier audio ou facture liés au projet.
--
-- Pondération :
--   40 % → séances confirmées (is_confirmed = true) / total séances
--   40 % → présence d'au moins un fichier audio
--   20 % → au moins une facture avec status = 'paid'

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100);
