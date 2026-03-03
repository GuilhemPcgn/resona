/**
 * Enums TypeScript alignés avec les types PostgreSQL de la base de données.
 *
 * SOURCE DE VÉRITÉ : supabase/Seed No Auth.sql (bloc DO $$ BEGIN … END $$)
 * Instance Supabase  : tvvhopbpwqofmuwyxubt
 *
 * Ces constantes sont validées à la compilation via `satisfies` contre les
 * types générés dans `integrations/supabase/types.ts`.
 * À chaque regénération de types.ts (supabase gen types), vérifier que les
 * valeurs ci-dessous restent en phase avec le bloc Enums du fichier généré.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * INCOHÉRENCES CORRIGÉES (types.ts auto-généré vs DB réelle)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 1. client_status
 *    - Valeur invalide retirée  : "completed" (n'existe pas dans l'enum SQL)
 *    - Valeurs ajoutées         : "prospect", "vip"
 *    - DB : ('active','inactive','prospect','vip')
 *
 * 2. project_status
 *    - Valeurs invalides retirées : "mixing", "mastering", "delivered"
 *      (phases de production qui n'existent pas comme statut dans l'enum SQL)
 *    - Valeurs ajoutées           : "on_hold", "cancelled"
 *    - DB : ('draft','in_progress','on_hold','completed','cancelled')
 *
 * 3. session_type
 *    - Valeur invalide retirée : "rehearsal" (n'existe pas dans l'enum SQL)
 *    - Valeurs ajoutées        : "editing", "meeting"
 *    - DB : ('recording','mixing','mastering','editing','meeting')
 *
 * 4. session_location
 *    - Valeur ajoutée : "on_site"
 *    - DB : ('studio','remote','on_site')
 *
 * 5. task_status
 *    - Valeur invalide retirée : "completed" (n'existe pas dans l'enum SQL)
 *    - Valeurs ajoutées        : "in_review", "done", "blocked"
 *    - DB : ('todo','in_progress','in_review','done','blocked')
 *
 * 6. task_priority → aucune incohérence
 *
 * 7. invoice_status → aucune incohérence (ordre différent uniquement)
 *
 * 8. user_role (non-enum SQL, colonne TEXT dans profiles)
 *    - Ajouté en tant que type TypeScript uniquement (pas de ENUM en DB)
 *    - Valeurs observées dans le seed : 'artist','client','admin','engineer'
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { Database } from '@/integrations/supabase/types';

// Raccourci vers le bloc Enums de la DB pour valider avec `satisfies`
type DbEnums = Database['public']['Enums'];

// ─────────────────────────────────────────────────────────────────────────────
// ClientStatus
// SQL : CREATE TYPE client_status AS ENUM ('active','inactive','prospect','vip')
// ─────────────────────────────────────────────────────────────────────────────

export const ClientStatus = {
  ACTIVE: 'active',       // Client actif
  INACTIVE: 'inactive',   // Client inactif / archivé
  PROSPECT: 'prospect',   // Prospect non encore converti
  VIP: 'vip',             // Client VIP (priorité maximale)
} as const satisfies Record<string, DbEnums['client_status']>;

export type ClientStatus = DbEnums['client_status'];

// ─────────────────────────────────────────────────────────────────────────────
// ProjectStatus
// SQL : CREATE TYPE project_status AS ENUM ('draft','in_progress','on_hold','completed','cancelled')
// ─────────────────────────────────────────────────────────────────────────────

export const ProjectStatus = {
  DRAFT: 'draft',             // Brouillon, non démarré
  IN_PROGRESS: 'in_progress', // En cours de production
  ON_HOLD: 'on_hold',         // En pause (attente client, budget…)
  COMPLETED: 'completed',     // Livré et finalisé
  CANCELLED: 'cancelled',     // Annulé
} as const satisfies Record<string, DbEnums['project_status']>;

export type ProjectStatus = DbEnums['project_status'];

// ─────────────────────────────────────────────────────────────────────────────
// SessionType
// SQL : CREATE TYPE session_type AS ENUM ('recording','mixing','mastering','editing','meeting')
// ─────────────────────────────────────────────────────────────────────────────

export const SessionType = {
  RECORDING: 'recording',   // Prise de son en studio
  MIXING: 'mixing',         // Mixage
  MASTERING: 'mastering',   // Mastering
  EDITING: 'editing',       // Montage / édition audio
  MEETING: 'meeting',       // Réunion client ou équipe
} as const satisfies Record<string, DbEnums['session_type']>;

export type SessionType = DbEnums['session_type'];

// ─────────────────────────────────────────────────────────────────────────────
// SessionLocation
// SQL : CREATE TYPE session_location AS ENUM ('studio','remote','on_site')
// ─────────────────────────────────────────────────────────────────────────────

export const SessionLocation = {
  STUDIO: 'studio',     // En studio (local de l'ingénieur)
  REMOTE: 'remote',     // À distance (session en ligne)
  ON_SITE: 'on_site',   // Sur site (chez le client)
} as const satisfies Record<string, DbEnums['session_location']>;

export type SessionLocation = DbEnums['session_location'];

// ─────────────────────────────────────────────────────────────────────────────
// TaskStatus
// SQL : CREATE TYPE task_status AS ENUM ('todo','in_progress','in_review','done','blocked')
// ─────────────────────────────────────────────────────────────────────────────

export const TaskStatus = {
  TODO: 'todo',             // À faire
  IN_PROGRESS: 'in_progress', // En cours
  IN_REVIEW: 'in_review',   // En attente de validation / relecture
  DONE: 'done',             // Terminée
  BLOCKED: 'blocked',       // Bloquée (dépendance ou problème externe)
} as const satisfies Record<string, DbEnums['task_status']>;

export type TaskStatus = DbEnums['task_status'];

// ─────────────────────────────────────────────────────────────────────────────
// TaskPriority
// SQL : CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent')
// Aucune incohérence avec types.ts
// ─────────────────────────────────────────────────────────────────────────────

export const TaskPriority = {
  LOW: 'low',       // Basse priorité
  MEDIUM: 'medium', // Priorité normale
  HIGH: 'high',     // Haute priorité
  URGENT: 'urgent', // Urgente (bloque la livraison)
} as const satisfies Record<string, DbEnums['task_priority']>;

export type TaskPriority = DbEnums['task_priority'];

// ─────────────────────────────────────────────────────────────────────────────
// InvoiceStatus
// SQL : CREATE TYPE invoice_status AS ENUM ('draft','sent','overdue','paid','cancelled')
// Aucune incohérence de valeurs avec types.ts (ordre différent uniquement)
// ─────────────────────────────────────────────────────────────────────────────

export const InvoiceStatus = {
  DRAFT: 'draft',         // Brouillon non envoyé
  SENT: 'sent',           // Envoyée au client
  OVERDUE: 'overdue',     // En retard de paiement
  PAID: 'paid',           // Payée
  CANCELLED: 'cancelled', // Annulée / avoir
} as const satisfies Record<string, DbEnums['invoice_status']>;

export type InvoiceStatus = DbEnums['invoice_status'];

// ─────────────────────────────────────────────────────────────────────────────
// UserRole
// PAS un enum SQL — colonne TEXT dans public.profiles.
// Type TypeScript uniquement, basé sur les valeurs observées dans le seed.
// ─────────────────────────────────────────────────────────────────────────────

export const UserRole = {
  ARTIST: 'artist',       // Artiste / musicien
  CLIENT: 'client',       // Client du studio
  ADMIN: 'admin',         // Administrateur
  ENGINEER: 'engineer',   // Ingénieur du son (rôle par défaut à l'inscription)
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
