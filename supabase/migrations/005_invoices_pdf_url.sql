-- Migration 005 : ajout des colonnes PDF sur la table invoices
-- pdf_url          : chemin dans le bucket Supabase Storage "invoices"
--                    ex: {user_id}/{invoice_id}.pdf
-- pdf_generated_at : horodatage de la dernière génération du PDF

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS pdf_url          TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Bucket Supabase Storage "invoices" : créer manuellement dans le dashboard
-- ou via l'API Storage si nécessaire (non géré par les migrations SQL).
-- Politique recommandée : accès service-role uniquement (le backend gère tout).
