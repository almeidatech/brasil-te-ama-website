// getStaticProps factory for the static public pages.
// Each page imports its PT module + its generated _i18n cache and calls this:
//
//   export const getStaticProps = localizedStaticProps(pt, tr);
//
// PT is served at the root locale; other locales fall back to PT when a
// translation hasn't been generated yet (so the build never breaks).
import type { GetStaticProps } from 'next';
import { DEFAULT_LOCALE, type Locale, type LocalizedContent } from './i18n';

export type TranslationsMap = Partial<Record<Exclude<Locale, 'pt'>, LocalizedContent>>;

export interface LocalizedPageProps extends LocalizedContent {
  locale: Locale;
}

export function pickContent(
  pt: LocalizedContent,
  tr: TranslationsMap,
  locale: string | undefined,
): LocalizedContent {
  if (!locale || locale === DEFAULT_LOCALE) return pt;
  return (tr as Record<string, LocalizedContent>)[locale] ?? pt;
}

export function localizedStaticProps(
  pt: LocalizedContent,
  tr: TranslationsMap,
): GetStaticProps<LocalizedPageProps> {
  return async ({ locale }) => {
    const c = pickContent(pt, tr, locale);
    return {
      props: {
        locale: (locale as Locale) ?? DEFAULT_LOCALE,
        title: c.title,
        description: c.description,
        html: c.html,
      },
    };
  };
}
