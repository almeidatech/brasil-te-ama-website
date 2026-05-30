// /conteudo — lista dinâmica de posts (SSG + ISR) do site brasil-te-ama.
// Layout fiel à docs/conteudo.html: subhero + chips de categoria + grid .imgcard
// + newsletter. Chrome (prefooter+footer) injetado de _footer.ts.
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import footerHtml from '@/content/public/_footer';
import { getAllPublishedPosts, getAllCategories } from '@/lib/posts';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

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
}

const TITLE = 'Conteúdo — Instituto Brasil Te Ama';
const DESC =
  'Histórias reais, análises e bastidores de quem faz acontecer. Acompanhe projetos, parcerias e impacto documentado — sem filtro, com profundidade.';

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [posts, categories] = await Promise.all([getAllPublishedPosts(), getAllCategories()]);
  const counts = new Map<string, number>();
  for (const p of posts) {
    const c = p.category?.name ?? 'Sem categoria';
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const chips: Chip[] = categories
    .map((c) => ({ name: c.name, count: counts.get(c.name) ?? 0 }))
    .filter((c) => c.count > 0);
  const cards: Card[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    dateLabel: fmtDate(p.published_at),
    category: p.category?.name ?? 'Sem categoria',
    coverUrl: p.cover_url,
  }));
  return { props: { cards, chips, total: posts.length }, revalidate: 60 };
};

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bordo)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function ConteudoIndex({ cards, chips, total }: Props) {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESC} />
        <link rel="canonical" href={`${SITE_URL}/conteudo`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESC} />
        <meta property="og:url" content={`${SITE_URL}/conteudo`} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESC} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Head>
      <Navbar />

      <section className="subhero">
        <div className="container">
          <div className="subhero__inner fade-up">
            <span className="eyebrow eyebrow--bordo">Conteúdo</span>
            <h1 className="subhero__title">O que acontece <em>na rede.</em></h1>
            <p className="subhero__sub">{DESC}</p>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <section style={{ background: 'var(--marfim)', padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }} id="filterRow">
            <button className="seg__item is-active" data-cat="Todos" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--r-btn)', background: 'var(--bordo)', color: 'var(--white)' }}>
              TODOS <span style={{ background: 'rgba(255,255,255,.2)', color: 'var(--white)', fontSize: 11, padding: '1px 8px', borderRadius: 'var(--r-btn)', fontWeight: 700 }}>{total}</span>
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
              Em breve, novos conteúdos por aqui.
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
                        <span className="image-slot__ph">Sem imagem</span>
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
                        <span className="ghost-text">Ler artigo</span> →
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
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Newsletter</span>
            <h2 style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: 32, lineHeight: 1.2, margin: '14px 0 12px' }}>
              Receba o que importa —<br />direto no seu e-mail.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', lineHeight: 1.7, marginBottom: 28 }}>
              Uma newsletter mensal com histórias reais, novidades da rede e conteúdos em primeira mão.
            </p>
            <form style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
              <input type="email" className="form-control" placeholder="seu@email.com" required style={{ flex: 1 }} />
              <button type="submit" className="btn btn--primary">Assinar →</button>
            </form>
          </div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}
