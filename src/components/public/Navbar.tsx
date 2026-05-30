// Chrome público (topbar + navbar) — Brasil te Ama. Markup fiel ao
// docs/uploads/fragment-{topbar,navbar}.html, com Link + active state por rota.
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/selo', label: 'Selo Brasil Te Ama' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/conteudo', label: 'Conteúdo' },
  { href: '/contato', label: 'Contato' },
];

export default function Navbar() {
  const { pathname } = useRouter();
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
                <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z" /></svg></a>
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
                <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19c1.71.46 8.59.46 8.59.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27z" /></svg></a>
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
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={isActive(item.href) ? 'active' : undefined} onClick={() => setOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/contato" className="btn btn--primary navbar__cta">Entrar em Contato →</Link>
            <button className="navbar__toggle" aria-label="Abrir menu" onClick={() => setOpen((v) => !v)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
