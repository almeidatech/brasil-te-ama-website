// Language selector for the public chrome.
//  · Desktop (>880px): a horizontal row of glossy circular country flags.
//  · Mobile  (≤880px): a compact dropdown showing the active flag that expands
//    into a vertical list of flag options.
// Flags use a glossy "sphere" treatment (highlight + inner shadow + lift) to
// match the reference design (docs/assets/images/circleFlagsModel.png).
// Both variants are always rendered; CSS (.lang-switch__row / __dropdown) toggles
// which is visible at the 880px navbar breakpoint — avoids a hydration mismatch.
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_META, DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

// Locale → circular flag SVG (public/assets/flags). PT uses the Brazilian flag,
// EN the UK flag — mirrors the existing LOCALE_META emoji choices.
const FLAG_FILE: Record<Locale, string> = {
  pt: 'br',
  en: 'gb',
  es: 'es',
  it: 'it',
  fr: 'fr',
};

const SIZE = 24; // circle diameter (px) — elegante como o protótipo (~20px), sem dominar o header

function flagSrc(loc: Locale): string {
  return `/assets/flags/${FLAG_FILE[loc]}.svg`;
}

// Glossy-sphere overlay: a top-left highlight + bottom darkening + inset rim,
// laid over the flat flag so it reads as a 3D button (per the reference set).
const GLOSS_BG =
  'radial-gradient(circle at 32% 24%, rgba(255,255,255,.6) 0%, rgba(255,255,255,.18) 16%, rgba(255,255,255,0) 42%),' +
  'radial-gradient(circle at 50% 120%, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 55%)';

// A glossy circular flag that fills its (square) container.
function GlossFlag({ loc, size }: { loc: Locale; size: number }) {
  return (
    <>
      <img
        src={flagSrc(loc)}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          pointerEvents: 'none',
          background: GLOSS_BG,
          boxShadow: 'inset 0 -2px 5px rgba(0,0,0,.28), inset 0 2px 3px rgba(255,255,255,.3)',
        }}
      />
    </>
  );
}

export default function LanguageSwitcher() {
  const router = useRouter();
  const current: Locale = isLocale(router.locale) ? router.locale : DEFAULT_LOCALE;
  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);

  // Close the mobile dropdown on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false);
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
    <div className="lang-switch">
      {/* ── Desktop: horizontal glossy flag row ── */}
      <div className="lang-switch__row" role="group" aria-label="Selecionar idioma">
        {LOCALES.map((loc) => {
          const m = LOCALE_META[loc];
          const isCurrent = loc === current;
          return (
            <button
              key={loc}
              type="button"
              className="lang-switch__flag"
              onClick={() => choose(loc)}
              aria-label={m.name}
              aria-pressed={isCurrent}
              title={m.name}
              style={{
                position: 'relative',
                width: SIZE,
                height: SIZE,
                padding: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                flex: '0 0 auto',
                cursor: isCurrent ? 'default' : 'pointer',
                background: 'none',
                border: isCurrent ? '2px solid var(--dourado)' : '2px solid rgba(0,0,0,.08)',
                boxShadow: isCurrent
                  ? '0 4px 10px rgba(0,0,0,.3)'
                  : '0 2px 5px rgba(0,0,0,.25)',
                opacity: isCurrent ? 1 : 0.78,
                transform: isCurrent ? 'scale(1.1)' : 'none',
                transition:
                  'opacity .2s var(--ease), transform .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease)',
              }}
              onMouseEnter={(e) => {
                if (isCurrent) return;
                const b = e.currentTarget;
                b.style.opacity = '1';
                b.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                if (isCurrent) return;
                const b = e.currentTarget;
                b.style.opacity = '0.78';
                b.style.transform = 'none';
              }}
            >
              <GlossFlag loc={loc} size={SIZE} />
            </button>
          );
        })}
      </div>

      {/* ── Mobile: dropdown with glossy flag options ── */}
      <div ref={ddRef} className="lang-switch__dropdown" style={{ position: 'relative' }}>
        <button
          type="button"
          className="lang-switch__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Idioma: ${LOCALE_META[current].name}`}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px 3px 3px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--white)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              position: 'relative',
              width: 30,
              height: 30,
              borderRadius: '50%',
              overflow: 'hidden',
              display: 'block',
              flex: '0 0 auto',
              border: '2px solid var(--dourado)',
              boxShadow: '0 2px 5px rgba(0,0,0,.25)',
            }}
          >
            <GlossFlag loc={current} size={30} />
          </span>
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--grafite)"
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
              minWidth: 190,
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
                      gap: 12,
                      width: '100%',
                      padding: '8px 12px',
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
                    <span
                      style={{
                        position: 'relative',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        display: 'block',
                        flex: '0 0 auto',
                        border: isCurrent ? '2px solid var(--dourado)' : '1px solid var(--border)',
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }}
                    >
                      <GlossFlag loc={loc} size={28} />
                    </span>
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
    </div>
  );
}
