// /conteudo/[slug] — post único (SSG + ISR) do site brasil-te-ama.
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import footerHtml from '@/content/public/_footer';
import { getAllPublishedSlugs, getPublishedPostBySlug, type PublicPost } from '@/lib/posts';
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

interface Props {
  post: PublicPost;
  dateLabel: string;
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return '';
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllPublishedSlugs();
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { notFound: true, revalidate: 60 };
  return { props: { post, dateLabel: fmtDate(post.published_at) }, revalidate: 60 };
};

export default function PostPage({ post, dateLabel }: Props) {
  const title = post.seo_title || `${post.title} — Instituto Brasil Te Ama`;
  const description = post.seo_description || post.excerpt || '';
  const canonical = `${SITE_URL}/conteudo/${post.slug}`;
  const ogImage = post.og_image_url || post.cover_url || DEFAULT_OG_IMAGE;
  return (
    <>
      <Head>
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        {post.published_at ? <meta property="article:published_time" content={post.published_at} /> : null}
        {post.category ? <meta property="article:section" content={post.category.name} /> : null}
        {post.tags.map((t) => (
          <meta key={t} property="article:tag" content={t} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description ? <meta name="twitter:description" content={description} /> : null}
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <Navbar />

      <section className="subhero">
        <div className="container">
          <div className="subhero__inner fade-up" style={{ maxWidth: 820 }}>
            {post.category ? <span className="eyebrow eyebrow--bordo">{post.category.name}</span> : null}
            <h1 className="subhero__title">{post.title}</h1>
            <p className="subhero__sub" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14 }}>
              {dateLabel ? <span>{dateLabel}</span> : null}
              {post.reading_time_min ? <span>· {post.reading_time_min} min de leitura</span> : null}
            </p>
          </div>
        </div>
      </section>

      <article className="section section--white">
        <div className="container">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              style={{ width: '100%', maxWidth: 920, margin: '0 auto 40px', borderRadius: 'var(--r-card)', display: 'block' }}
            />
          ) : null}
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
          <p style={{ maxWidth: 760, margin: '48px auto 0' }}>
            <Link href="/conteudo" className="btn btn--outline-bordo">← Voltar para Conteúdo</Link>
          </p>
        </div>
      </article>

      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </>
  );
}
