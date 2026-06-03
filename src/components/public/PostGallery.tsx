// Public image carousel for posts. Images keep their natural orientation and
// aspect ratio (object-fit: contain — never cropped). Clicking any image opens
// an in-page lightbox that enlarges it together with the whole carousel strip.
import { useCallback, useEffect, useState } from 'react';
import type { GalleryImage } from '@/lib/posts';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n';

const LABEL: Record<Locale, string> = {
  pt: 'Galeria', en: 'Gallery', es: 'Galería', it: 'Galleria', fr: 'Galerie',
};

function aspect(img: GalleryImage): number {
  if (img.width && img.height && img.height > 0) return img.width / img.height;
  return 4 / 3;
}

export default function PostGallery({ images, locale }: { images: GalleryImage[]; locale?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const open = index !== null;
  const count = images.length;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i === null ? i : (i + dir + count) % count)),
    [count],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  if (!count) return null;

  return (
    <section className="section section--white" aria-label={LABEL[loc]} style={{ paddingTop: 0 }}>
      <div className="container">
        <span className="eyebrow">{LABEL[loc]}</span>
        <hr className="divider" style={{ marginBottom: 24 }} />

        {/* Carousel strip — horizontal scroll, snap, natural aspect ratios */}
        <div
          className="postgallery__track"
          style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 10,
            scrollbarWidth: 'thin',
          }}
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${LABEL[loc]} — ${i + 1}/${count}`}
              style={{
                flex: '0 0 auto',
                height: 320,
                aspectRatio: String(aspect(img)),
                maxWidth: '88vw',
                borderRadius: 'var(--r-card)',
                overflow: 'hidden',
                background: 'var(--blush)',
                border: '1px solid var(--border)',
                cursor: 'zoom-in',
                scrollSnapAlign: 'start',
                padding: 0,
              }}
            >
              <img
                src={img.url}
                alt={img.alt ?? ''}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </button>
          ))}
        </div>
      </div>

      {open && index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={LABEL[loc]}
          onClick={() => setIndex(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(17,10,11,.94)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', color: 'rgba(255,255,255,.85)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.5px' }}>{index + 1} / {count}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIndex(null); }}
              aria-label="Fechar"
              style={{ color: '#fff', background: 'rgba(255,255,255,.12)', borderRadius: 999, width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Enlarged image + arrows */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 12px', minHeight: 0 }}>
            {count > 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Anterior" style={arrowStyle()}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <img
              src={images[index].url}
              alt={images[index].alt ?? ''}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}
            />
            {count > 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Próxima" style={arrowStyle()}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>

          {images[index].alt ? (
            <p style={{ color: 'rgba(255,255,255,.7)', textAlign: 'center', fontSize: 13, padding: '6px 20px 0' }}>{images[index].alt}</p>
          ) : null}

          {/* The whole carousel, enlarged with it (thumbnail strip) */}
          {count > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 20px', justifyContent: count <= 6 ? 'center' : 'flex-start' }}
            >
              {images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}`}
                  aria-current={i === index}
                  style={{
                    flex: '0 0 auto', height: 60, aspectRatio: String(aspect(img)),
                    borderRadius: 6, overflow: 'hidden', cursor: 'pointer', padding: 0,
                    background: 'rgba(255,255,255,.06)',
                    border: i === index ? '2px solid var(--dourado)' : '2px solid transparent',
                    opacity: i === index ? 1 : 0.6, transition: 'opacity .2s, border-color .2s',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function arrowStyle(): React.CSSProperties {
  return {
    flex: '0 0 auto', color: '#fff', background: 'rgba(255,255,255,.12)',
    borderRadius: 999, width: 46, height: 46, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  };
}
