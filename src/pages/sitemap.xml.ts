// /sitemap.xml — gerado on-demand (SSR): rotas estáticas públicas + posts
// publicados do site brasil-te-ama (site_id=2222). Crawlers usam via robots.txt.
// Busca os slugs via REST do Supabase com fetch nativo (sem importar o SDK
// @supabase/supabase-js nem posts.ts — ambos são ESM async e quebram o
// runtime de módulo do webpack numa rota SSR `/sitemap.xml`).
import type { GetServerSideProps } from 'next';
import { SITE_ID } from '@/lib/site';
import { SITE_URL } from '@/lib/seo';

const STATIC_PATHS = [
  '/', '/sobre', '/selo', '/projetos', '/conteudo', '/contato',
  '/empresas', '/transparencia', '/para-ongs', '/voluntarios',
  '/consumidor',
];

interface Entry { loc: string; lastmod?: string; priority: string }

async function fetchPosts(): Promise<{ slug: string; published_at: string | null }[]> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return [];
  const now = new Date().toISOString();
  const qs = new URLSearchParams({
    select: 'slug,published_at',
    site_id: `eq.${SITE_ID}`,
    status: 'eq.published',
    published_at: `lte.${now}`,
    order: 'published_at.desc',
  });
  try {
    const r = await fetch(`${base}/rest/v1/posts?${qs.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) {
      console.error('[sitemap] fetchPosts HTTP', r.status);
      return [];
    }
    return (await r.json()) as { slug: string; published_at: string | null }[];
  } catch (e) {
    console.error('[sitemap] fetchPosts:', (e as Error).message);
    return [];
  }
}

function buildXml(entries: Entry[]): string {
  const items = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n` +
        (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
        `    <priority>${e.priority}</priority>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await fetchPosts();
  const entries: Entry[] = [
    ...STATIC_PATHS.map((p) => ({ loc: `${SITE_URL}${p}`, priority: p === '/' ? '1.0' : '0.8' })),
    ...posts.map((p) => ({
      loc: `${SITE_URL}/conteudo/${p.slug}`,
      lastmod: p.published_at ?? undefined,
      priority: '0.7',
    })),
  ];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.write(buildXml(entries));
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
