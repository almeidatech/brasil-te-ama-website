import type { GetServerSideProps } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Magic-link redirects land here. Supabase JS (PKCE) needs to exchange ?code= for a session.
// We do that server-side, set the cookies, then redirect to ?next= (default /admin).
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createSupabaseServerClient(ctx);
  const code = typeof ctx.query.code === 'string' ? ctx.query.code : null;
  const next = typeof ctx.query.next === 'string' && ctx.query.next.startsWith('/')
    ? ctx.query.next
    : '/admin';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { redirect: { destination: `/admin/login?error=${encodeURIComponent(error.message)}`, permanent: false } };
    }
  }

  return { redirect: { destination: next, permanent: false } };
};

export default function AuthCallback() {
  return null;
}
