// Accordion-style language selector for the public chrome.
// Shows the active locale (flag + code) and expands to the full list.
// Switching keeps the current route via router locale (subpath URLs).
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_META, DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current: Locale = isLocale(router.locale) ? router.locale : DEFAULT_LOCALE;
  const active = LOCALE_META[current];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (loc: Locale) => {
    setOpen(false);
    if (loc === current) return;
    // Keep the same path/params, only swap the locale subpath.
    router.push(router.asPath, router.asPath, { locale: loc, scroll: false });
  };

  return (
    <div ref={ref} className="lang-switch" style={{ position: 'relative' }}>
      <button
        type="button"
        className="lang-switch__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Idioma: ${active.name}`}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 11px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'var(--white)',
          fontFamily: 'var(--font-inter)',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '.3px',
          color: 'var(--grafite)',
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 15 }} aria-hidden="true">{active.flag}</span>
        <span>{active.label}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transition: 'transform .2s var(--ease)', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="lang-switch__menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 180,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow)',
            zIndex: 1200,
          }}
        >
          {LOCALES.map((loc) => {
            const m = LOCALE_META[loc];
            const isCurrent = loc === current;
            return (
              <li key={loc} role="option" aria-selected={isCurrent}>
                <button
                  type="button"
                  onClick={() => choose(loc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: isCurrent ? 'var(--blush)' : 'transparent',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 14,
                    fontWeight: isCurrent ? 700 : 500,
                    color: 'var(--grafite)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 17 }} aria-hidden="true">{m.flag}</span>
                  <span style={{ flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', color: 'var(--dourado)' }}>
                    {m.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
