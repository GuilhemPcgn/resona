import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes accessibles sans session active.
 * Toute autre route est considérée protégée.
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/callback',
];

/**
 * Routes d'auth depuis lesquelles un utilisateur connecté
 * doit être redirigé vers /dashboard.
 */
const AUTH_ONLY_ROUTES = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  // Crée la réponse de base — sera potentiellement remplacée si des cookies
  // sont mis à jour (rafraîchissement de token)
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propage les nouveaux cookies vers la requête puis vers la réponse
          // pour que le token rafraîchi soit disponible dans les Server Components
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valide le JWT auprès des serveurs Supabase (plus sécurisé que
  // getSession() qui se contente de lire le cookie sans vérification serveur)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);

  // Utilisateur non connecté tentant d'accéder à une route protégée
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Utilisateur connecté tentant d'accéder à login ou register
  if (user && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Retourne la réponse avec les cookies potentiellement mis à jour
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Applique le middleware à toutes les routes SAUF :
     * - _next/static  : assets statiques Next.js
     * - _next/image   : optimisation d'images Next.js
     * - favicon.ico   : favicon
     * - fichiers avec extension image (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
