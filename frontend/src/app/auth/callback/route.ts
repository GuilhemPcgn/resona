import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Échange le code PKCE contre une session.
    // Note : sans @supabase/ssr, les cookies de session ne sont pas persistés
    // côté serveur. La session sera établie côté client via detectSessionInUrl.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirection vers login avec indicateur d'erreur en cas d'échec
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
