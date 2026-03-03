/**
 * Script de création d'un compte développeur / admin.
 *
 * Utilise la clé service_role pour créer le compte en bypassant
 * la confirmation email — réservé au développement local.
 *
 * Usage :
 *   npx ts-node -r dotenv/config scripts/create-admin.ts
 *
 * Pour changer l'email/mot de passe, modifier les constantes ci-dessous.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes dans .env');
  process.exit(1);
}

// ── Identifiants du compte admin dev ──────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@resona.dev';
const ADMIN_PASSWORD = 'Admin1234!';
// ─────────────────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n🎵  Resona — Création du compte admin dev\n`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,   // Bypasse la vérification email
  });

  if (error) {
    // Déjà existant → pas bloquant
    if (
      error.message.toLowerCase().includes('already') ||
      error.message.toLowerCase().includes('duplicate')
    ) {
      console.log(`ℹ️   Le compte ${ADMIN_EMAIL} existe déjà.`);
      console.log(`    Connectez-vous directement avec ces identifiants.\n`);
    } else {
      console.error(`❌  Erreur Supabase : ${error.message}`);
      process.exit(1);
    }
    return;
  }

  console.log(`✅  Compte créé avec succès !\n`);
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(`    User ID  : ${data.user.id}`);
  console.log(`\n    → Rendez-vous sur http://localhost:3000/auth/login\n`);
}

main();
