// i18n core — shared constants for the public site.
// Engine: Google Cloud Translation (build-time for static pages, on-demand for posts).
// PT is the source language and lives at the URL root; the others are subpath locales.

export const LOCALES = ['pt', 'en', 'es', 'it', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt';

export const TRANSLATABLE_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function isLocale(v: string | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

export interface LocaleInfo {
  code: Locale;
  label: string; // short code shown in the switcher
  flag: string; // emoji flag
  name: string; // native name
}

export const LOCALE_META: Record<Locale, LocaleInfo> = {
  pt: { code: 'pt', label: 'PT', flag: '🇧🇷', name: 'Português' },
  en: { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  es: { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
  it: { code: 'it', label: 'IT', flag: '🇮🇹', name: 'Italiano' },
  fr: { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
};

// og:locale value per language (used in <Head>)
export const OG_LOCALE: Record<Locale, string> = {
  pt: 'pt_BR',
  en: 'en_US',
  es: 'es_ES',
  it: 'it_IT',
  fr: 'fr_FR',
};

// Localized content shape for static pages.
export interface LocalizedContent {
  title: string;
  description: string;
  html: string;
}

// UI strings for the dynamically-rebuilt home news section (see pages/index.tsx).
// Hand-authored (short, brand-sensitive) so we don't round-trip them through the API.
export interface HomeNewsStrings {
  eyebrow: string;
  title: string;
  sub: string;
  all: string;
  read: string;
  noImage: string;
}

export const HOME_NEWS_I18N: Record<Locale, HomeNewsStrings> = {
  pt: {
    eyebrow: 'Notícias em destaque',
    title: 'Acompanhe nossas ações',
    sub: 'Compromisso documentado. Cada passo, cada parceria e cada resultado em campo são registrados com total rastreabilidade.',
    all: 'Ver todas as notícias →',
    read: 'Ler →',
    noImage: 'Sem imagem',
  },
  en: {
    eyebrow: 'Featured news',
    title: 'Follow our actions',
    sub: 'Documented commitment. Every step, every partnership and every result in the field is recorded with full traceability.',
    all: 'See all news →',
    read: 'Read →',
    noImage: 'No image',
  },
  es: {
    eyebrow: 'Noticias destacadas',
    title: 'Acompañe nuestras acciones',
    sub: 'Compromiso documentado. Cada paso, cada alianza y cada resultado en el campo se registran con total trazabilidad.',
    all: 'Ver todas las noticias →',
    read: 'Leer →',
    noImage: 'Sin imagen',
  },
  it: {
    eyebrow: 'Notizie in evidenza',
    title: 'Segui le nostre azioni',
    sub: 'Impegno documentato. Ogni passo, ogni partnership e ogni risultato sul campo sono registrati con piena tracciabilità.',
    all: 'Vedi tutte le notizie →',
    read: 'Leggi →',
    noImage: 'Nessuna immagine',
  },
  fr: {
    eyebrow: 'Actualités à la une',
    title: 'Suivez nos actions',
    sub: 'Engagement documenté. Chaque étape, chaque partenariat et chaque résultat sur le terrain sont enregistrés avec une traçabilité totale.',
    all: 'Voir toutes les actualités →',
    read: 'Lire →',
    noImage: 'Aucune image',
  },
};

export function homeNews(locale: string | undefined): HomeNewsStrings {
  return HOME_NEWS_I18N[isLocale(locale) ? locale : DEFAULT_LOCALE];
}
