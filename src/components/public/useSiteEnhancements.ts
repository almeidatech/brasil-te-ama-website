// Porta de docs/enhancements.js para React + resolve os <image-slot> (agora
// <div data-slot-id>) lendo a imagem do Supabase Storage. Roda a cada rota.
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const SHAPE_RADIUS: Record<string, string> = {
  rect: '0',
  rounded: '12px',
  circle: '50%',
  pill: '9999px',
};

function slotUrl(id: string): string | null {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}/storage/v1/object/public/blog-media/brasil-te-ama/slots/${id}.webp`;
}

function resolveImageSlots() {
  document.querySelectorAll<HTMLElement>('.image-slot[data-slot-id]').forEach((el) => {
    if (el.dataset.resolved) return;
    const id = el.dataset.slotId;
    if (!id) return;
    const url = slotUrl(id);
    const shape = el.dataset.shape || 'rect';
    el.style.borderRadius = SHAPE_RADIUS[shape] ?? '0';
    if (!url) return;
    const probe = new Image();
    probe.onload = () => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.style.cssText =
        `position:absolute;inset:0;width:100%;height:100%;object-fit:${el.dataset.fit || 'cover'};`;
      el.appendChild(img);
      const ph = el.querySelector<HTMLElement>('.image-slot__ph');
      if (ph) ph.style.display = 'none';
      el.dataset.resolved = '1';
    };
    probe.onerror = () => {
      el.dataset.resolved = '0';
    };
    probe.src = url;
  });
}

export function useSiteEnhancements(enabled = true) {
  // `locale` is part of the dep array because switching language re-renders the
  // injected HTML (new .fade-up nodes) without changing asPath — Next keeps the
  // locale in router.locale, not in asPath. Without it the effect wouldn't re-run
  // and the fresh nodes would stay at opacity:0 (html.js-ready hides them).
  const { asPath, locale } = useRouter();

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('js-ready');
    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Scroll reveal ──────────────────────────────────────────
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>('.fade-up, .fade-in')
    );
    const isOnScreen = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    revealEls.forEach((el) => {
      if (isOnScreen(el)) el.classList.add('is-visible');
    });

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io!.unobserve(e.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      revealEls.forEach((el) => {
        if (!el.classList.contains('is-visible')) io!.observe(el);
      });
    } else {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // safety net: força exibição depois de 1.5s
    const safety = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>('.fade-up:not(.is-visible), .fade-in:not(.is-visible)')
        .forEach((el) => el.classList.add('is-visible'));
    }, 1500);

    // ── Parallax ───────────────────────────────────────────────
    let onScroll: (() => void) | null = null;
    let onResize: (() => void) | null = null;
    if (!prefersReduced) {
      const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
      if (targets.length) {
        let ticking = false;
        const update = () => {
          const sy = window.scrollY || window.pageYOffset;
          targets.forEach((el) => {
            const speed = parseFloat(el.getAttribute('data-parallax') || '') || 0.3;
            const rect = el.getBoundingClientRect();
            const elTop = rect.top + sy;
            const rel = sy - elTop + window.innerHeight;
            if (rel < 0 || rect.top > window.innerHeight) {
              el.style.transform = '';
              return;
            }
            el.style.transform = 'translate3d(0,' + sy * speed + 'px,0)';
          });
          ticking = false;
        };
        onScroll = () => {
          if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
          }
        };
        onResize = update;
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        update();
      }
    }

    // ── Flip cards (tap em touch) ──────────────────────────────
    const flipHandlers: Array<{ el: HTMLElement; click: (e: Event) => void; key: (e: KeyboardEvent) => void }> = [];
    document.querySelectorAll<HTMLElement>('.flip-card').forEach((card) => {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      const click = (e: Event) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        card.classList.toggle('is-flipped');
      };
      const key = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.classList.toggle('is-flipped');
        }
      };
      card.addEventListener('click', click);
      card.addEventListener('keydown', key);
      flipHandlers.push({ el: card, click, key });
    });

    // ── Conteúdo: filtros de categoria (chips .seg__item) ──────
    const segHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
    document.querySelectorAll<HTMLElement>('.seg__item[data-cat]').forEach((btn) => {
      const fn = () => {
        document.querySelectorAll<HTMLElement>('.seg__item[data-cat]').forEach((b) => {
          b.classList.remove('is-active');
          b.style.background = 'var(--white)';
          b.style.color = 'var(--text-gray)';
          const badge = b.querySelector<HTMLElement>('span');
          if (badge) { badge.style.background = 'var(--blush)'; badge.style.color = 'var(--bordo)'; }
        });
        btn.classList.add('is-active');
        btn.style.background = 'var(--bordo)';
        btn.style.color = 'var(--white)';
        const badge = btn.querySelector<HTMLElement>('span');
        if (badge) { badge.style.background = 'rgba(255,255,255,.2)'; badge.style.color = 'var(--white)'; }
        const cat = btn.dataset.cat;
        document.querySelectorAll<HTMLElement>('#grid > .imgcard').forEach((card) => {
          card.style.display = cat === 'Todos' || card.dataset.cat === cat ? '' : 'none';
        });
      };
      btn.addEventListener('click', fn);
      segHandlers.push({ el: btn, fn });
    });

    // ── Image slots → Supabase Storage ─────────────────────────
    resolveImageSlots();

    return () => {
      window.clearTimeout(safety);
      if (io) io.disconnect();
      if (onScroll) window.removeEventListener('scroll', onScroll);
      if (onResize) window.removeEventListener('resize', onResize);
      flipHandlers.forEach(({ el, click, key }) => {
        el.removeEventListener('click', click);
        el.removeEventListener('keydown', key as EventListener);
      });
      segHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    };
  }, [asPath, locale, enabled]);
}
