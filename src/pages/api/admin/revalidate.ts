// Authenticated on-demand ISR for the public /conteudo pages.
//
// Unlike /api/revalidate (secret-gated, for Supabase DB webhooks), this route is
// for the admin UI: it trusts the logged-in admin/editor session (cookies) and
// re-validates without any client-visible secret. Called by revalidateConteudo()
// after saving/deleting posts or categories.
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // 1) Authenticated session?
  const supabase = createSupabaseServerClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'unauthenticated' });

  // 2) Authorized admin/editor? (service role bypasses RLS for the lookup)
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data } = await admin
    .from('app_users')
    .select('role, active')
    .eq('id', user.id)
    .maybeSingle();
  const row = data as { role: string; active: boolean } | null;
  if (!row || !row.active || (row.role !== 'admin' && row.role !== 'editor')) {
    return res.status(403).json({ error: 'forbidden' });
  }

  // 3) Revalidate the public content paths.
  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {};
  const slug = typeof body.slug === 'string' ? body.slug : null;
  const paths = new Set<string>(['/conteudo', '/sitemap.xml']);
  if (slug) paths.add(`/conteudo/${slug}`);

  const results: Record<string, 'ok' | string> = {};
  for (const p of paths) {
    try {
      await res.revalidate(p);
      results[p] = 'ok';
    } catch (e) {
      results[p] = (e as Error).message;
    }
  }
  return res.status(200).json({ revalidated: results });
}
