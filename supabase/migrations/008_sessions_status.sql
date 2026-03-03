-- 008_sessions_status.sql
-- Ajoute le champ status (enum session_status) à la table sessions

CREATE TYPE session_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled');

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status session_status NOT NULL DEFAULT 'pending';

-- Migrer les séances déjà confirmées via is_confirmed
UPDATE sessions SET status = 'confirmed' WHERE is_confirmed = true AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
