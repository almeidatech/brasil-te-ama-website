import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export const config = {
  matcher: ['/admin/:path*', '/:locale/admin/:path*'],
};

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/auth/callback'];

// Strip a leading /en|/es|/it|/fr so admin auth checks are locale-agnostic.
// (Admin is not a localized surface, but Next i18n still exposes /xx/admin.)
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|es|it|fr)(?=\/|$)/, '') || '/';
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = stripLocale(req.nextUrl.pathname);
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  if (!user && !isPublic) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', path);
    return NextResponse.redirect(loginUrl);
  }

  // Auto-redirect logged-in users from /admin/login to /admin,
  // but NOT when an error is being surfaced (avoids redirect loop if SSR rejects).
  if (user && path === '/admin/login' && !req.nextUrl.searchParams.has('error')) {
    const home = req.nextUrl.clone();
    home.pathname = '/admin';
    home.search = '';
    return NextResponse.redirect(home);
  }

  return res;
}
