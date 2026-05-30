import type { GetServerSidePropsContext } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// Server-only client using service_role — bypasses RLS for trusted admin lookups.
// Never expose this to the browser.
function serviceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'editor';
}

const NOT_AUTH_REDIRECT = { redirect: { destination: '/admin/login', permanent: false } } as const;
const NOT_ADMIN_REDIRECT = {
  redirect: { destination: '/admin/login?error=not_authorized', permanent: false },
} as const;

export async function requireAdminUser(ctx: GetServerSidePropsContext): Promise<
  | { user: AdminUser; supabase: ReturnType<typeof createSupabaseServerClient> }
  | typeof NOT_AUTH_REDIRECT
  | typeof NOT_ADMIN_REDIRECT
> {
  const supabase = createSupabaseServerClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NOT_AUTH_REDIRECT;

  // Admin profile lookup bypasses RLS via service role (trusted server-side path).
  const admin = serviceRoleClient();
  const { data } = await admin
    .from('app_users')
    .select('id, email, name, role, active')
    .eq('id', user.id)
    .maybeSingle();

  const row = data as { id: string; email: string; name: string | null; role: string; active: boolean } | null;
  if (!row || !row.active || (row.role !== 'admin' && row.role !== 'editor')) {
    return NOT_ADMIN_REDIRECT;
  }

  return {
    user: { id: row.id, email: row.email, name: row.name, role: row.role as 'admin' | 'editor' },
    supabase,
  };
}

export function isRedirect(
  result: Awaited<ReturnType<typeof requireAdminUser>>,
): result is typeof NOT_AUTH_REDIRECT | typeof NOT_ADMIN_REDIRECT {
  return 'redirect' in result;
}
