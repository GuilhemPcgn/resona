-- Migration 007 : ajout de la valeur 'production' à l'enum session_type
-- Correspond au type "Prod/Beatmaking" dans l'interface utilisateur.
-- Note : PostgreSQL ne permet pas de supprimer des valeurs d'un enum,
--        on ajoute donc uniquement la nouvelle valeur.

ALTER TYPE session_type ADD VALUE IF NOT EXISTS 'production';
