// Chrome público (topbar + navbar) — Brasil te Ama. Markup fiel ao
// docs/uploads/fragment-{topbar,navbar}.html, com Link + active state por rota.
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

const NAV_HREFS = ['/', '/sobre', '/selo', '/projetos', '/conteudo', '/contato'] as const;

// Localized nav labels + CTA. "Selo Brasil Te Ama" stays as the program brand.
const NAV_LABELS: Record<Locale, Record<string, string>> = {
  pt: { '/': 'Início', '/sobre': 'Sobre', '/selo': 'Selo Brasil Te Ama', '/projetos': 'Projetos', '/conteudo': 'Conteúdo', '/contato': 'Contato' },
  en: { '/': 'Home', '/sobre': 'About', '/selo': 'Selo Brasil Te Ama', '/projetos': 'Projects', '/conteudo': 'Content', '/contato': 'Contact' },
  es: { '/': 'Inicio', '/sobre': 'Acerca', '/selo': 'Selo Brasil Te Ama', '/projetos': 'Proyectos', '/conteudo': 'Contenido', '/contato': 'Contacto' },
  it: { '/': 'Home', '/sobre': 'Chi siamo', '/selo': 'Selo Brasil Te Ama', '/projetos': 'Progetti', '/conteudo': 'Contenuti', '/contato': 'Contatti' },
  fr: { '/': 'Accueil', '/sobre': 'À propos', '/selo': 'Selo Brasil Te Ama', '/projetos': 'Projets', '/conteudo': 'Contenu', '/contato': 'Contact' },
};

const CTA_LABEL: Record<Locale, string> = {
  pt: 'Entrar em Contato →',
  en: 'Get in touch →',
  es: 'Entrar en contacto →',
  it: 'Contattaci →',
  fr: 'Nous contacter →',
};

export default function Navbar() {
  const { pathname, locale } = useRouter();
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const labels = NAV_LABELS[loc];
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ─────────── TOPBAR ─────────── */}
      <div className="topbar">
        <div className="container">
          <div className="topbar__inner">
            <div className="topbar__contacts">
              <a className="topbar__contact" href="tel:+556133222535" aria-label="Telefone">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 8.62 19.79 19.79 0 0 1 .01 4a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span>(61) 3322-2535</span>
              </a>
              <a className="topbar__contact" href="https://wa.me/5561984401100" aria-label="WhatsApp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                <span>(61) 98440-1100</span>
              </a>
            </div>
            <div className="topbar__right">
              <a className="topbar__contact topbar__email-hide" href="mailto:atendimento@institutobrasilteama.org">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <span>atendimento@institutobrasilteama.org</span>
              </a>
              <div className="topbar__socials">
                <a href="https://www.instagram.com/institutobrasilteama/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── NAVBAR ─────────── */}
      <nav className={`navbar${open ? ' open' : ''}`} id="navbar">
        <div className="container">
          <div className="navbar__inner">
            <Link href="/" className="navbar__logo" aria-label="Instituto Brasil Te Ama — Home">
              <img src="/assets/logo-principal.png" alt="Instituto Brasil Te Ama" className="navbar__logo-img" />
            </Link>
            <ul className="navbar__nav">
              {NAV_HREFS.map((href) => (
                <li key={href}>
                  <Link href={href} className={isActive(href) ? 'active' : undefined} onClick={() => setOpen(false)}>
                    {labels[href]}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/contato" className="btn btn--primary navbar__cta">{CTA_LABEL[loc]}</Link>
            <LanguageSwitcher />
            <button className="navbar__toggle" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
