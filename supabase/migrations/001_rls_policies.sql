-- =============================================
-- Migration : 001_rls_policies.sql
-- Objet     : Politiques Row Level Security (RLS) pour toutes les tables
-- Instance  : tvvhopbpwqofmuwyxubt
--
-- Principe  : chaque utilisateur n'accède qu'à ses propres données.
-- auth.uid() retourne l'UUID de l'utilisateur authentifié (JWT Supabase).
--
-- Cas particuliers :
--   profiles     → pas d'INSERT direct (création via trigger on auth.users)
--   invoice_items → pas de user_id direct ; accès via la facture parente
--   files        → colonne "uploaded_by" (pas "user_id") ; accès via projet
--   tasks        → colonne "created_by" (pas "user_id") ; accès via projet
--   comments     → colonne user_id directe (incluse bien que hors liste initiale)
-- =============================================


-- =============================================
-- TABLE: profiles
--
-- La clé primaire "id" correspond à auth.users(id).
-- Un utilisateur peut lire et modifier uniquement son propre profil.
-- Pas de politique INSERT : la ligne est créée automatiquement par un trigger
-- (handle_new_user) déclenché sur auth.users lors de l'inscription.
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : l'utilisateur ne voit que sa propre ligne
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Mise à jour : l'utilisateur ne modifie que sa propre ligne
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Suppression : l'utilisateur ne supprime que sa propre ligne
-- (rarement utilisée en production ; préférer une désactivation logique)
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());


-- =============================================
-- TABLE: clients
--
-- Chaque client appartient à un utilisateur via la colonne user_id.
-- Un utilisateur ne voit et ne gère que ses propres clients.
-- =============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_own"
  ON public.clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "clients_insert_own"
  ON public.clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_update_own"
  ON public.clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_delete_own"
  ON public.clients FOR DELETE
  USING (user_id = auth.uid());


-- =============================================
-- TABLE: projects
--
-- Chaque projet appartient à un utilisateur via la colonne user_id.
-- Un utilisateur ne voit et ne gère que ses propres projets.
-- =============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (user_id = auth.uid());


-- =============================================
-- TABLE: sessions
--
-- Chaque session (recording, mixing…) appartient à un utilisateur via user_id.
-- Un utilisateur ne voit et ne gère que ses propres sessions.
-- =============================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "sessions_insert_own"
  ON public.sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "sessions_delete_own"
  ON public.sessions FOR DELETE
  USING (user_id = auth.uid());


-- =============================================
-- TABLE: invoices
--
-- Chaque facture appartient à un utilisateur via la colonne user_id.
-- Un utilisateur ne voit et ne gère que ses propres factures.
-- =============================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_own"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "invoices_insert_own"
  ON public.invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_update_own"
  ON public.invoices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_delete_own"
  ON public.invoices FOR DELETE
  USING (user_id = auth.uid());


-- =============================================
-- TABLE: invoice_items
--
-- Pas de colonne user_id directe sur invoice_items.
-- L'accès est dérivé de la facture parente :
--   un utilisateur peut accéder aux lignes de ses propres factures.
-- Remarque : la sous-requête EXISTS est indexée via la FK invoice_id.
-- =============================================

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select_own"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_insert_own"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_update_own"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items_delete_own"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );


-- =============================================
-- TABLE: files
--
-- Pas de colonne user_id directe ; la colonne "uploaded_by" référence profiles.
-- Stratégie :
--   SELECT / DELETE → via le projet parent (accès à tous les fichiers du projet)
--   INSERT         → uploaded_by = auth.uid() ET projet appartenant à l'utilisateur
--   UPDATE         → uploaded_by = auth.uid() (seul l'uploadeur modifie ses fichiers)
--
-- Cette approche permet au propriétaire du projet de lire/supprimer tous ses
-- fichiers, tout en restreignant les modifications au déposant d'origine.
-- =============================================

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les fichiers des projets de l'utilisateur
CREATE POLICY "files_select_own"
  ON public.files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = files.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Insertion : l'utilisateur doit être l'uploadeur ET propriétaire du projet
CREATE POLICY "files_insert_own"
  ON public.files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = files.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Mise à jour : uniquement par l'utilisateur qui a déposé le fichier
CREATE POLICY "files_update_own"
  ON public.files FOR UPDATE
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Suppression : par le propriétaire du projet (permet de nettoyer le projet entier)
CREATE POLICY "files_delete_own"
  ON public.files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = files.project_id
        AND projects.user_id = auth.uid()
    )
  );


-- =============================================
-- TABLE: tasks
--
-- Pas de colonne user_id directe ; colonnes "created_by" et "assigned_to".
-- Stratégie : accès via le projet parent.
--   Un utilisateur accède à toutes les tâches de ses propres projets.
--   INSERT : created_by = auth.uid() ET projet appartenant à l'utilisateur.
--
-- Ce modèle permet une gestion centralisée des tâches au niveau du projet
-- (le propriétaire du projet voit et gère toutes ses tâches).
-- =============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Lecture : toutes les tâches des projets de l'utilisateur
CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Insertion : l'utilisateur doit être le créateur ET propriétaire du projet
CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Mise à jour : via le projet parent (propriétaire du projet peut tout modifier)
CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Suppression : via le projet parent
CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );


-- =============================================
-- TABLE: comments
--
-- Présente dans le schéma (non listée dans le prompt initial mais incluse
-- pour éviter toute fuite de données).
-- La colonne user_id référence directement profiles.
-- Un utilisateur ne voit et ne gère que ses propres commentaires.
-- =============================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_own"
  ON public.comments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (user_id = auth.uid());
