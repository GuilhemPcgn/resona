import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Client Supabase côté navigateur.
 * Utilise createBrowserClient (@supabase/ssr) qui stocke la session dans
 * les cookies HTTP — indispensable pour que le middleware Next.js puisse
 * lire la session via createServerClient et autoriser les routes protégées.
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);