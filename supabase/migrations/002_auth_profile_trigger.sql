-- =============================================
-- Migration : 002_auth_profile_trigger.sql
-- Objet     : Intégrité référentielle profiles ↔ auth.users
--             + trigger de création automatique de profil
--             + index pour les requêtes critiques
-- Instance  : tvvhopbpwqofmuwyxubt
-- =============================================


-- =============================================
-- 1. FOREIGN KEY : profiles.id → auth.users(id)
--
-- Rétablit l'intégrité référentielle supprimée dans le seed de développement.
-- ON DELETE CASCADE : la suppression d'un utilisateur Supabase Auth
-- supprime automatiquement son profil (et par cascade toutes ses données
-- si les autres FK sont configurées de la même façon).
-- =============================================

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- =============================================
-- 2. TRIGGER : création automatique de profil à l'inscription
--
-- Déclenché AFTER INSERT ON auth.users (géré par Supabase Auth).
-- SECURITY DEFINER : la fonction s'exécute avec les droits de son propriétaire
-- (postgres) pour pouvoir écrire dans public.profiles même depuis auth.users.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'engineer',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprime le trigger s'il existe déjà (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 3. INDEX : optimisations critiques
--
-- Les colonnes indexées ci-dessous apparaissent systématiquement dans les
-- clauses WHERE et JOIN des requêtes RLS (auth.uid()) et applicatives.
-- IF NOT EXISTS : migration idempotente, sans erreur si déjà présents.
-- =============================================

-- projects : filtrage par propriétaire (RLS) et par statut (listes filtrées)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON public.projects(status);

-- clients : filtrage par propriétaire (RLS)
CREATE INDEX IF NOT EXISTS idx_clients_user_id  ON public.clients(user_id);

-- sessions : filtrage par date de début (calendrier, dashboard)
CREATE INDEX IF NOT EXISTS idx_sessions_start_date ON public.sessions(start_date);

-- invoices : filtrage par propriétaire (RLS) et par statut (relances, rapports)
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON public.invoices(status);

-- files : JOIN systématique avec projects dans les politiques RLS
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
