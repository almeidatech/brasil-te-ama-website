// Endpoint for on-demand ISR. Called by Supabase Database Webhook when posts change.
//
// Auth: ?secret=...  must match REVALIDATE_SECRET env var.
// Supabase webhook payload shape: { type, table, record, old_record, ... }
// We revalidate /conteudo, /conteudo/<old_slug>, /conteudo/<new_slug>, and /sitemap.xml.
//
// Manual call also supported: POST /api/revalidate?secret=...&path=/conteudo/foo

import type { NextApiRequest, NextApiResponse } from 'next';

type WebhookPayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: { slug?: string } | null;
  old_record?: { slug?: string } | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = req.query.secret;
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ error: 'invalid_secret' });
  }

  const paths = new Set<string>();

  // Explicit path via query (handy for manual ops).
  if (typeof req.query.path === 'string' && req.query.path.startsWith('/')) {
    paths.add(req.query.path);
  }

  // Supabase webhook payload.
  if (req.method === 'POST' && req.body) {
    const body: WebhookPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body.table === 'posts' || body.table === 'categories') {
      paths.add('/conteudo');
      paths.add('/sitemap.xml');
      const newSlug = body.record?.slug;
      const oldSlug = body.old_record?.slug;
      if (newSlug) paths.add(`/conteudo/${newSlug}`);
      if (oldSlug && oldSlug !== newSlug) paths.add(`/conteudo/${oldSlug}`);
    }
  }

  // Default: at least bust the index.
  if (paths.size === 0) {
    paths.add('/conteudo');
    paths.add('/sitemap.xml');
  }

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
