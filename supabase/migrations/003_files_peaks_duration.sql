-- Migration 003 : ajout des colonnes peaks et duration à la table files
-- Utilisées par le système de waveform dynamique (Phase 2)
--
-- peaks    : tableau de peaks par canal au format [min0, max0, min1, max1, …]
--            valeurs normalisées dans [-1, 1], stocké en JSONB
-- duration : durée totale du fichier audio en secondes

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS peaks    JSONB,
  ADD COLUMN IF NOT EXISTS duration FLOAT;

-- Index GIN optionnel pour requêtes JSONB futures (peut être ignoré en MVP)
-- CREATE INDEX IF NOT EXISTS idx_files_peaks_gin ON files USING GIN (peaks);
