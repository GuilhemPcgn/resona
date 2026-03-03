# CLAUDE.md — Resona Sound Studio Hub

## Vue d'ensemble

Plateforme de gestion de studio audio (projets, clients, sessions, facturation, upload audio).

- **Frontend** : Next.js 14 + TypeScript — port 3000
- **Backend** : NestJS 11 + TypeScript — port 3001
- **Base de données** : Supabase (PostgreSQL) avec RLS activé sur toutes les tables
- **Auth** : Supabase Auth (cookies SSR) côté frontend + Passport JWT côté backend
- **Paiements** : Stripe (Payment Intents + webhooks)
- **UI** : shadcn/ui (Radix UI + Tailwind CSS)
- **Langue de l'UI** : Français

---

## Commandes essentielles

### Frontend
```bash
cd frontend
npm run dev      # démarrage dev (port 3000)
npm run build    # build production
npm run lint     # ESLint
```

### Backend
```bash
cd backend
npm run start:dev   # démarrage dev avec hot-reload (port 3001)
npm run build       # build NestJS
npm run lint        # ESLint + Prettier
npm run test        # Jest (unit)
npm run test:e2e    # Jest e2e
```

### Supabase
```bash
# Appliquer les migrations manuellement via Supabase Dashboard ou CLI
# Fichiers dans supabase/migrations/
```

---

## Architecture

### Backend (`backend/src/`)

Chaque domaine suit le pattern NestJS standard : `module` → `controller` → `service` → `dto/`.

| Module | Route | Description |
|--------|-------|-------------|
| `auth/` | — | JWT strategy (Supabase JWKS), guard `JwtAuthGuard`, décorateur `@CurrentUser()` |
| `projects/` | `/projects` | CRUD projets avec pagination |
| `clients/` | `/clients` | CRUD clients |
| `sessions/` | `/sessions` | Sessions d'enregistrement |
| `invoices/` | `/invoices` | Facturation + Stripe Payment Intents |
| `files/` | `/files` | Upload audio (signed URLs Supabase Storage) + génération peaks |
| `audio-processing/` | — | Génération peaks via `audiowaveform` CLI |
| `stripe/` | `/stripe/webhook` | Webhooks Stripe (raw body requis) |
| `common/filters/` | — | `HttpExceptionFilter` global |
| `integrations/supabase/` | — | `SupabaseService` (service role key) |

**Conventions backend :**
- Tous les controllers sont protégés par `@UseGuards(JwtAuthGuard)` au niveau classe
- `@CurrentUser() user: AuthUser` injecte l'utilisateur authentifié (id, email)
- Pagination : query params `page` (défaut 1) + `limit` (défaut 20) → offset calculé dans le service
- Validation globale via `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`)
- Erreurs : `HttpExceptionFilter` → `{ statusCode, message, timestamp, path }`
- Le raw body pour Stripe est configuré avant `json()` dans `main.ts`

### Frontend (`frontend/src/`)

| Dossier | Description |
|---------|-------------|
| `app/dashboard/` | Stats, projets/clients récents, actions rapides |
| `app/projects/` | Gestion projets |
| `app/clients/` | Gestion clients |
| `app/calendar/` | Sessions (vue calendrier) |
| `app/studio/` | Upload audio + lecteur WaveSurfer.js |
| `app/billing/` | Factures |
| `app/auth/` | Login / register / forgot-password / callback |
| `app/api/stats/` | Route API server-side (stats dashboard) |
| `components/` | Organisé par domaine (audio, clients, dashboard, invoices, layout, projects, sessions, studio) |
| `hooks/` | `use-dashboard-data.ts`, `use-stats.ts` (React Query) |
| `lib/api-client.ts` | `fetchWithAuth()` — ajoute le Bearer token Supabase automatiquement |
| `middleware.ts` | Protège toutes les routes, redirige vers `/auth/login` |
| `integrations/supabase/` | Client browser (`client.ts`) + client server (`server.ts`) |
| `types/enums.ts` | Enums partagés |

**Conventions frontend :**
- Toutes les pages app sont des Server ou Client Components Next.js 14
- `fetchWithAuth(endpoint, options)` pour tous les appels API backend (ajoute automatiquement `Authorization: Bearer <token>`)
- State serveur : React Query (`@tanstack/react-query`) pour les données API
- Toast : `sonner` (`toast.success()`, `toast.error()`)
- Composants UI : shadcn/ui — utiliser les composants existants dans `components/ui/`
- Icônes : `lucide-react`
- Dates : `date-fns` avec locale `fr-FR`
- Monnaie : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`

---

## Flux d'authentification

```
Supabase Auth (cookies SSR)
  → middleware.ts (getUser() — validation serveur)
  → redirect /auth/login si non authentifié
  → client : getSession() → access_token
  → fetchWithAuth : Authorization: Bearer <token>
  → Backend : Passport JWT (JWKS Supabase) → @CurrentUser()
  → Supabase (service role) : opérations DB
```

**Routes publiques** : `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/callback`

---

## Flux upload audio

```
POST /files/upload  (metadata)
  → signed URL Supabase Storage (upload direct)
  → PUT signedUrl (blob depuis frontend)
  → POST /files/:id/process (fire-and-forget)
  → audiowaveform CLI → peaks JSONB + duration FLOAT en DB
```

---

## Schéma base de données

| Table | Isolation RLS | Colonnes notables |
|-------|--------------|-------------------|
| `profiles` | `id = auth.uid()` | Créé via trigger `handle_new_user` |
| `clients` | `user_id = auth.uid()` | `status`: active/vip/prospect/inactive |
| `projects` | `user_id = auth.uid()` | `status`: draft/in_progress/on_hold/completed/cancelled, `start_date`, `end_date` |
| `sessions` | `user_id = auth.uid()` | FK → projects + clients |
| `invoices` | `user_id = auth.uid()` | `total_amount`, `due_date`, `status` |
| `invoice_items` | via `invoice_id` → invoices | Pas de `user_id` direct |
| `files` | via `project_id` → projects | `uploaded_by` (pas `user_id`), `peaks` JSONB, `duration` FLOAT |
| `tasks` | via `project_id` → projects | `created_by`, `assigned_to` |
| `comments` | `user_id = auth.uid()` | FK → files, `timestamp_ms` |

---

## Variables d'environnement

### Backend (`.env` à la racine de `backend/`)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local` à la racine de `frontend/`)
```
NEXT_PUBLIC_SUPABASE_URL=https://tvvhopbpwqofmuwyxubt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dmhvcGJwd3FvZm11d3l4dWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODI0NzAsImV4cCI6MjA4Nzc1ODQ3MH0.sPm1Lt6ESabJt2gYZRLAdwRXznPrIqaHpASnKJEuxl4
NEXT_PUBLIC_API_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Règles de développement

### Ne jamais faire
- Bypass le `JwtAuthGuard` sur un endpoint (toutes les routes sont protégées par défaut)
- Utiliser la `anon key` côté backend (toujours `service role key` pour les opérations serveur)
- Committer `.env` ou `.env.local`
- Utiliser `getSession()` dans le middleware (utiliser `getUser()` qui valide côté serveur)

### Toujours faire
- Passer `user.id` à chaque méthode de service pour l'isolation des données
- Utiliser `ParseUUIDPipe` pour les params UUID dans les controllers
- Invalider les React Query keys après une mutation (`queryClient.invalidateQueries`)
- Afficher un skeleton pendant le chargement (pattern existant dans dashboard)
- Gérer les erreurs dans les mutations React Query avec `toast.error()`

### Ajouter un nouveau module backend
1. Créer le dossier `backend/src/<nom>/` avec `module`, `controller`, `service`, `dto/`
2. Ajouter `@UseGuards(JwtAuthGuard)` au niveau de la classe controller
3. Importer le module dans `app.module.ts`
4. Injecter `SupabaseService` pour les opérations DB

### Ajouter une nouvelle page frontend
1. Créer `frontend/src/app/<route>/page.tsx`
2. Ajouter la route dans `AppSidebar.tsx` si elle doit apparaître dans la navigation
3. Wrapper la page dans `<AppLayout>` (composant layout existant)
4. Utiliser `fetchWithAuth` pour tous les appels API

### Ajouter une migration Supabase
1. Nommer le fichier `NNN_description.sql` dans `supabase/migrations/`
2. Activer RLS sur toute nouvelle table
3. Créer les 4 politiques CRUD standard (select/insert/update/delete)

---

## Dépendances externes requises

- `audiowaveform` CLI doit être installé sur le serveur backend pour la génération de peaks audio
- Node.js 18+ recommandé
