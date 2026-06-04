// Footer único do site (prefooter + footer) — renderizado 1× pelo PublicLayout
// (páginas estáticas) e pelas páginas do blog. O markup vive em
// src/content/public/footer.ts e é localizado pelo pipeline de i18n
// (src/content/public/_i18n/footer.ts), caindo para PT quando não traduzido.
import { useRouter } from 'next/router';
import ptFooter from '@/content/public/footer';
import footerTr from '@/content/public/_i18n/footer';
import { pickContent } from '@/lib/i18n-page';

export default function Footer() {
  const { locale } = useRouter();
  const { html } = pickContent(ptFooter, footerTr, locale);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
