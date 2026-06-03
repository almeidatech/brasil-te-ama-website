// Layout das páginas públicas: <Head> (SEO completo) + chrome React (Navbar)
// + corpo fiel injetado (hero→footer). Enhancements rodam global no _app.
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Footer from './Footer';
import { SITE_NAME, DEFAULT_OG_IMAGE, canonicalUrl } from '@/lib/seo';
import { DEFAULT_LOCALE, isLocale, OG_LOCALE } from '@/lib/i18n';

export interface PublicPageContent {
  title: string;
  description: string;
  html: string;
}

export default function PublicLayout({ title, description, html }: PublicPageContent) {
  const { asPath, locale } = useRouter();
  const canonical = canonicalUrl(asPath);
  const ogLocale = OG_LOCALE[isLocale(locale) ? locale : DEFAULT_LOCALE];
  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="canonical" href={canonical} />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description ? <meta name="twitter:description" content={description} /> : null}
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Head>
      <Navbar />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Footer />
    </>
  );
}
