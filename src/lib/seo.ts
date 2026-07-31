// SEO helpers — base URL canônica do site público (override via env no deploy).
import { LOCALES, DEFAULT_LOCALE, type Locale } from './i18n';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://institutobrasilteama.org').replace(/\/$/, '');
export const SITE_NAME = 'Instituto Brasil Te Ama';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/logo-principal.png`;

// hreflang por locale — pt-BR para o público brasileiro; demais em código simples.
const HREFLANG: Record<Locale, string> = { pt: 'pt-BR', en: 'en', es: 'es', it: 'it', fr: 'fr' };

/** Caminho → URL absoluta canônica (sem query/hash), na locale PT (default). */
export function canonicalUrl(asPath: string): string {
  return localizedUrl(asPath, DEFAULT_LOCALE);
}

/**
 * URL absoluta de um path numa locale. O Next serve PT na raiz e os demais
 * idiomas em subpasta (/en, /es, …); o `asPath` do router NÃO inclui o prefixo,
 * então o reintroduzimos aqui para o canonical/hreflang de cada idioma apontar
 * para a própria versão (senão toda tradução canoniza para o PT = duplicata).
 */
export function localizedUrl(asPath: string, locale: Locale): string {
  const path = asPath.split('?')[0].split('#')[0];
  const base = locale === DEFAULT_LOCALE ? SITE_URL : `${SITE_URL}/${locale}`;
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/** Alternates hreflang: todas as locales + x-default (= PT). */
export function hreflangAlternates(asPath: string): Array<{ hrefLang: string; href: string }> {
  const list = LOCALES.map((loc) => ({ hrefLang: HREFLANG[loc], href: localizedUrl(asPath, loc) }));
  list.push({ hrefLang: 'x-default', href: localizedUrl(asPath, DEFAULT_LOCALE) });
  return list;
}
