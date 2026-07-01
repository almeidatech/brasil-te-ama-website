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

    // ── Filtro de categoria (.seg__item[data-cat]) + busca textual (#projSearch) sobre #grid ──
    // Usado por Conteúdo (só categorias) e Projetos (categorias + busca). Categoria e busca
    // são combinadas: um card só aparece se casar com AMBAS.
    const segHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
    const gridSearch = document.querySelector<HTMLInputElement>('#projSearch');
    let activeCat = 'Todos';
    const applyGridFilter = () => {
      const q = (gridSearch?.value || '').toLowerCase().trim();
      document.querySelectorAll<HTMLElement>('#grid > .imgcard').forEach((card) => {
        const catOk = activeCat === 'Todos' || card.dataset.cat === activeCat;
        const textOk = !q || (card.textContent || '').toLowerCase().includes(q);
        card.style.display = catOk && textOk ? '' : 'none';
      });
    };
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
        activeCat = btn.dataset.cat || 'Todos';
        applyGridFilter();
      };
      btn.addEventListener('click', fn);
      segHandlers.push({ el: btn, fn });
    });
    let gridSearchFn: (() => void) | null = null;
    if (gridSearch) {
      gridSearchFn = () => applyGridFilter();
      gridSearch.addEventListener('input', gridSearchFn);
    }

    // ── Contadores animados (.counter-value[data-target]) ─────────
    // Porta do <script> de Consumidor.dc.html. Anima ao entrar na viewport.
    let counterObs: IntersectionObserver | null = null;
    const animateCounter = (el: HTMLElement) => {
      const target = parseInt(el.getAttribute('data-target') || '', 10) || 0;
      const prefix = el.getAttribute('data-prefix') || '';
      if (prefersReduced) { el.textContent = prefix + target.toLocaleString('pt-BR'); return; }
      const dur = 1600;
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = prefix + Math.floor(p * target).toLocaleString('pt-BR');
        if (p < 1) window.requestAnimationFrame(step);
        else el.textContent = prefix + target.toLocaleString('pt-BR');
      };
      window.requestAnimationFrame(step);
    };
    const counters = Array.from(document.querySelectorAll<HTMLElement>('.counter-value'));
    if (counters.length && 'IntersectionObserver' in window) {
      counterObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCounter(e.target as HTMLElement); counterObs!.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach((c) => counterObs!.observe(c));
    } else {
      counters.forEach(animateCounter);
    }

    // ── Consumidor: filtro de parceiros (.filter-chip[data-filter]) ──
    const chipHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
    const filterChips = Array.from(document.querySelectorAll<HTMLElement>('.filter-chip'));
    const partnerCards = Array.from(document.querySelectorAll<HTMLElement>('.partner-card'));
    filterChips.forEach((chip) => {
      const fn = () => {
        filterChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const f = chip.getAttribute('data-filter');
        partnerCards.forEach((card) => {
          card.style.display = f === 'all' || card.getAttribute('data-category') === f ? '' : 'none';
        });
      };
      chip.addEventListener('click', fn);
      chipHandlers.push({ el: chip, fn });
    });

    // ── Contato: seg tabs + qa-grid atalhos + review ao vivo ──────
    // Porta fiel do <script> de Contato.dc.html. A barra `.seg__item[data-tab]`
    // é o seletor real dos forms; os cards `.qa-btn[data-jump]` são atalhos que
    // ativam a aba e rolam até o form; cada `[data-review]` espelha o valor de
    // um input (por id) no resumo do último passo. Contato é a única superfície
    // com esses marcadores, então o querySelectorAll global é seguro.
    const tabHandlers: Array<{ el: HTMLElement; fn: (e: Event) => void }> = [];
    const reviewHandlers: Array<{ el: HTMLElement; fn: () => void }> = [];
    const segTabs = Array.from(document.querySelectorAll<HTMLElement>('.seg__item[data-tab]'));
    const qaJump = Array.from(document.querySelectorAll<HTMLElement>('.qa-btn[data-jump]'));
    const cPanes = Array.from(document.querySelectorAll<HTMLElement>('.tab-pane[data-pane]'));
    if (segTabs.length && cPanes.length) {
      const setActiveTab = (tab: string) => {
        segTabs.forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
        qaJump.forEach((c) => c.classList.toggle('is-active', c.dataset.jump === tab));
        cPanes.forEach((p) => { p.style.display = p.dataset.pane === tab ? 'block' : 'none'; });
      };
      segTabs.forEach((b) => {
        const fn = () => setActiveTab(b.dataset.tab || '');
        b.addEventListener('click', fn);
        tabHandlers.push({ el: b, fn });
      });
      const jump = (tab: string) => {
        setActiveTab(tab);
        const f = document.getElementById('formulario') || document.querySelector<HTMLElement>('.contact-layout');
        if (f) window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
      };
      document.querySelectorAll<HTMLElement>('[data-jump]').forEach((b) => {
        const fn = (e: Event) => { e.preventDefault(); jump(b.dataset.jump || ''); };
        b.addEventListener('click', fn);
        tabHandlers.push({ el: b, fn });
      });
      // estado inicial coerente (aba is-active do markup, ou a 1ª)
      const initial = segTabs.find((b) => b.classList.contains('is-active')) || segTabs[0];
      if (initial) setActiveTab(initial.dataset.tab || '');
    }
    // review ao vivo: [data-review="id"] espelha o input #id
    document.querySelectorAll<HTMLElement>('[data-review]').forEach((span) => {
      const id = span.getAttribute('data-review');
      if (!id) return;
      const src = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (!src) return;
      const upd = () => {
        let v = '';
        if (src.tagName === 'SELECT') {
          const s = src as HTMLSelectElement;
          v = s.value ? s.options[s.selectedIndex].text : '';
        } else {
          v = (src as HTMLInputElement).value;
        }
        span.textContent = v.trim() || '—';
      };
      src.addEventListener('input', upd);
      src.addEventListener('change', upd);
      upd();
      reviewHandlers.push({ el: src, fn: upd });
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
      if (gridSearch && gridSearchFn) gridSearch.removeEventListener('input', gridSearchFn);
      chipHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      tabHandlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
      reviewHandlers.forEach(({ el, fn }) => {
        el.removeEventListener('input', fn);
        el.removeEventListener('change', fn);
      });
      if (counterObs) counterObs.disconnect();
    };
  }, [asPath, locale, enabled]);
}
