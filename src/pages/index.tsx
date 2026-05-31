import type { GetStaticProps } from 'next';
import PublicLayout from '@/components/public/PublicLayout';
import page from '@/content/public/index';
import { getAllPublishedPosts } from '@/lib/posts';

interface NewsCard {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  coverUrl: string | null;
  dateLabel: string;
}
interface Props {
  title: string;
  description: string;
  html: string;
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A seção "Notícias" do corpo estático (auto-gerado de docs/index.html) é substituída
// em build/ISR pelos posts mais recentes do Supabase. Marcadores tolerantes à contagem de traços.
const NEWS_RE = /<!--[^>]*NOTÍCIAS[^>]*-->/;
const VALORES_RE = /<!--[^>]*VALORES[^>]*-->/;

function buildNewsSection(cards: NewsCard[]): string {
  const items = cards
    .map(
      (c, i) => `
      <article class="imgcard fade-up delay-${i + 1}">
        <div class="imgcard__media">
          ${
            c.coverUrl
              ? `<img src="${esc(c.coverUrl)}" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
              : `<div class="image-slot" style="position:absolute;inset:0;background:rgba(0,0,0,.04)"><span class="image-slot__ph">Sem imagem</span></div>`
          }
          ${c.category ? `<span class="imgcard__badge">${esc(c.category)}</span>` : ''}
        </div>
        <div class="imgcard__body">
          <h3 class="imgcard__title"><a href="/conteudo/${c.slug}" style="color:inherit;text-decoration:none;">${esc(c.title)}</a></h3>
          <p class="imgcard__desc">${esc(c.excerpt)}</p>
          <div class="imgcard__foot">
            <span class="imgcard__locale">${esc(c.dateLabel)}</span>
            <a href="/conteudo/${c.slug}" class="imgcard__cta">Ler →</a>
          </div>
        </div>
      </article>`
    )
    .join('');
  return `<section class="section section--alt">
  <div class="container">
    <div class="section-header fade-up" style="display:flex; align-items:flex-end; justify-content:space-between; gap:24px;">
      <div>
        <span class="eyebrow">Mantenha-se atualizado</span>
        <h2 class="section-title">O que a gente faz, aparece.</h2>
        <hr class="divider">
        <p class="section-sub" style="margin-top:14px;">Cada ação tem nome, data e resultado documentado.</p>
      </div>
      <a href="/conteudo" class="btn btn--secondary">Ver todas as notícias →</a>
    </div>
    <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 12px;">${items}
    </div>
  </div>
</section>

`;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = await getAllPublishedPosts();
  // As 3 mais recentes (getAllPublishedPosts já vem ordenado por published_at desc).
  const cards: NewsCard[] = posts.slice(0, 3).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    category: p.category?.name ?? '',
    coverUrl: p.cover_url ?? null,
    dateLabel: fmtDate(p.published_at),
  }));

  let html = page.html;
  const start = html.match(NEWS_RE);
  const end = html.match(VALORES_RE);
  if (cards.length && start?.index != null && end?.index != null && end.index > start.index) {
    html = html.slice(0, start.index) + buildNewsSection(cards) + html.slice(end.index);
  }

  return { props: { title: page.title, description: page.description, html }, revalidate: 60 };
};

export default function IndexPage(props: Props) {
  return <PublicLayout {...props} />;
}
