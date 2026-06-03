// /conteudo — lista dinâmica de posts (SSG + ISR) do site brasil-te-ama.
// Layout fiel à docs/conteudo.html: subhero + chips de categoria + grid .imgcard
// + newsletter. Chrome (prefooter+footer) injetado de _footer.ts.
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { getAllPublishedPosts, getAllCategories } from '@/lib/posts';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';
import { DEFAULT_LOCALE, isLocale, OG_LOCALE, type Locale } from '@/lib/i18n';

interface Card {
  slug: string;
  title: string;
  excerpt: string;
  dateLabel: string;
  category: string;
  coverUrl: string | null;
}
interface Chip { name: string; count: number }
interface Props {
  cards: Card[];
  chips: Chip[];
  total: number;
  locale: Locale;
}

interface ConteudoStrings {
  title: string; desc: string; eyebrow: string; h1a: string; h1em: string;
  all: string; empty: string; noImage: string; noCat: string; read: string;
  nlEyebrow: string; nlTitleA: string; nlTitleB: string; nlText: string; nlPlaceholder: string; nlBtn: string;
}

const UI: Record<Locale, ConteudoStrings> = {
  pt: {
    title: 'Conteúdo — Instituto Brasil Te Ama',
    desc: 'Histórias reais, análises e bastidores de quem faz acontecer. Acompanhe projetos, parcerias e impacto documentado — sem filtro, com profundidade.',
    eyebrow: 'Conteúdo', h1a: 'O que acontece ', h1em: 'na rede.',
    all: 'TODOS', empty: 'Em breve, novos conteúdos por aqui.', noImage: 'Sem imagem', noCat: 'Sem categoria', read: 'Ler artigo',
    nlEyebrow: 'Newsletter', nlTitleA: 'Receba o que importa —', nlTitleB: 'direto no seu e-mail.',
    nlText: 'Uma newsletter mensal com histórias reais, novidades da rede e conteúdos em primeira mão.',
    nlPlaceholder: 'seu@email.com', nlBtn: 'Assinar →',
  },
  en: {
    title: 'Content — Instituto Brasil Te Ama',
    desc: 'Real stories, analysis and behind-the-scenes from those who make it happen. Follow projects, partnerships and documented impact — unfiltered, in depth.',
    eyebrow: 'Content', h1a: 'What happens ', h1em: 'in the network.',
    all: 'ALL', empty: 'New content coming soon.', noImage: 'No image', noCat: 'Uncategorized', read: 'Read article',
    nlEyebrow: 'Newsletter', nlTitleA: 'Get what matters —', nlTitleB: 'straight to your inbox.',
    nlText: 'A monthly newsletter with real stories, network news and first-hand content.',
    nlPlaceholder: 'you@email.com', nlBtn: 'Subscribe →',
  },
  es: {
    title: 'Contenido — Instituto Brasil Te Ama',
    desc: 'Historias reales, análisis y entre bastidores de quienes hacen que suceda. Siga proyectos, alianzas e impacto documentado — sin filtro, con profundidad.',
    eyebrow: 'Contenido', h1a: 'Lo que pasa ', h1em: 'en la red.',
    all: 'TODOS', empty: 'Pronto, nuevos contenidos por aquí.', noImage: 'Sin imagen', noCat: 'Sin categoría', read: 'Leer artículo',
    nlEyebrow: 'Newsletter', nlTitleA: 'Reciba lo que importa —', nlTitleB: 'directo en su correo.',
    nlText: 'Un boletín mensual con historias reales, novedades de la red y contenidos de primera mano.',
    nlPlaceholder: 'tu@email.com', nlBtn: 'Suscribirse →',
  },
  it: {
    title: 'Contenuti — Instituto Brasil Te Ama',
    desc: 'Storie vere, analisi e dietro le quinte di chi fa accadere le cose. Segui progetti, partnership e impatto documentato — senza filtri, in profondità.',
    eyebrow: 'Contenuti', h1a: 'Cosa succede ', h1em: 'nella rete.',
    all: 'TUTTI', empty: 'Presto, nuovi contenuti qui.', noImage: 'Nessuna immagine', noCat: 'Senza categoria', read: 'Leggi articolo',
    nlEyebrow: 'Newsletter', nlTitleA: 'Ricevi ciò che conta —', nlTitleB: 'direttamente nella tua email.',
    nlText: 'Una newsletter mensile con storie vere, novità della rete e contenuti in anteprima.',
    nlPlaceholder: 'tu@email.com', nlBtn: 'Iscriviti →',
  },
  fr: {
    title: 'Contenu — Instituto Brasil Te Ama',
    desc: 'Des histoires vraies, des analyses et les coulisses de ceux qui agissent. Suivez les projets, les partenariats et l’impact documenté — sans filtre, en profondeur.',
    eyebrow: 'Contenu', h1a: 'Ce qui se passe ', h1em: 'dans le réseau.',
    all: 'TOUS', empty: 'De nouveaux contenus bientôt ici.', noImage: 'Aucune image', noCat: 'Sans catégorie', read: 'Lire l’article',
    nlEyebrow: 'Newsletter', nlTitleA: 'Recevez l’essentiel —', nlTitleB: 'directement par e-mail.',
    nlText: 'Une newsletter mensuelle avec des histoires vraies, l’actualité du réseau et des contenus en avant-première.',
    nlPlaceholder: 'vous@email.com', nlBtn: 'S’abonner →',
  },
};

const INTL_LOCALE: Record<Locale, string> = {
  pt: 'pt-BR', en: 'en-US', es: 'es-ES', it: 'it-IT', fr: 'fr-FR',
};

const fmtDate = (iso: string | null, loc: Locale): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[loc], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const noCat = UI[loc].noCat;
  const [posts, categories] = await Promise.all([getAllPublishedPosts(loc), getAllCategories()]);
  const counts = new Map<string, number>();
  for (const p of posts) {
    const c = p.category?.name ?? noCat;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const chips: Chip[] = categories
    .map((c) => ({ name: c.name, count: counts.get(c.name) ?? 0 }))
    .filter((c) => c.count > 0);
  const cards: Card[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    dateLabel: fmtDate(p.published_at, loc),
    category: p.category?.name ?? noCat,
    coverUrl: p.cover_url,
  }));
  return { props: { cards, chips, total: posts.length, locale: loc }, revalidate: 60 };
};

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bordo)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function ConteudoIndex({ cards, chips, total, locale }: Props) {
  const ui = UI[locale];
  return (
    <>
      <Head>
        <title>{ui.title}</title>
        <meta name="description" content={ui.desc} />
        <link rel="canonical" href={`${SITE_URL}/conteudo`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content={OG_LOCALE[locale]} />
        <meta property="og:title" content={ui.title} />
        <meta property="og:description" content={ui.desc} />
        <meta property="og:url" content={`${SITE_URL}/conteudo`} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ui.title} />
        <meta name="twitter:description" content={ui.desc} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Head>
      <Navbar />

      <section className="subhero">
        <div className="container">
          <div className="subhero__inner fade-up">
            <span className="eyebrow eyebrow--bordo">{ui.eyebrow}</span>
            <h1 className="subhero__title">{ui.h1a}<em>{ui.h1em}</em></h1>
            <p className="subhero__sub">{ui.desc}</p>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <section style={{ background: 'var(--marfim)', padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }} id="filterRow">
            <button className="seg__item is-active" data-cat="Todos" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--r-btn)', background: 'var(--bordo)', color: 'var(--white)' }}>
              {ui.all} <span style={{ background: 'rgba(255,255,255,.2)', color: 'var(--white)', fontSize: 11, padding: '1px 8px', borderRadius: 'var(--r-btn)', fontWeight: 700 }}>{total}</span>
            </button>
            {chips.map((c) => (
              <button key={c.name} className="seg__item" data-cat={c.name} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--r-btn)', background: 'var(--white)', color: 'var(--text-gray)' }}>
                {c.name.toUpperCase()} <span style={{ background: 'var(--blush)', color: 'var(--bordo)', fontSize: 11, padding: '1px 8px', borderRadius: 'var(--r-btn)', fontWeight: 700 }}>{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLES GRID */}
      <section className="section section--white" id="articles">
        <div className="container">
          {cards.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '40px 0' }}>
              {ui.empty}
            </p>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} id="grid">
              {cards.map((card, i) => (
                <article key={card.slug} className={`imgcard fade-up delay-${(i % 4) + 1}`} data-cat={card.category}>
                  <div className="imgcard__media">
                    {card.coverUrl ? (
                      <img src={card.coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="image-slot" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,.04)' }}>
                        <span className="image-slot__ph">{ui.noImage}</span>
                      </div>
                    )}
                    <div className="imgcard__badge">{card.category}</div>
                  </div>
                  <div className="imgcard__body">
                    <h3 className="imgcard__title">{card.title}</h3>
                    <p className="imgcard__desc">{card.excerpt}</p>
                    <div className="imgcard__foot">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <ClockIcon />{card.dateLabel}
                      </span>
                      <Link href={`/conteudo/${card.slug}`} className="imgcard__cta">
                        <span className="ghost-text">{ui.read}</span> →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER (UI apenas — backend na Fase 4) */}
      <section className="section section--alt">
        <div className="container">
          <div className="form-card fade-up" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 48 }}>
            <span className="eyebrow" style={{ justifyContent: 'center' }}>{ui.nlEyebrow}</span>
            <h2 style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: 32, lineHeight: 1.2, margin: '14px 0 12px' }}>
              {ui.nlTitleA}<br />{ui.nlTitleB}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', lineHeight: 1.7, marginBottom: 28 }}>
              {ui.nlText}
            </p>
            <form style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
              <input type="email" className="form-control" placeholder={ui.nlPlaceholder} required style={{ flex: 1 }} />
              <button type="submit" className="btn btn--primary">{ui.nlBtn}</button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
