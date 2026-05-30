// SEO helpers — base URL canônica do site público (override via env no deploy).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://institutobrasilteama.org').replace(/\/$/, '');
export const SITE_NAME = 'Instituto Brasil Te Ama';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/logo-principal.png`;

/** Caminho → URL absoluta canônica (sem query/hash). */
export function canonicalUrl(asPath: string): string {
  const path = asPath.split('?')[0].split('#')[0];
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
