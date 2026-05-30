// Fase 0 smoke-test page. Proves: app boots, Supabase connects, multi-tenant
// scoping works (only brasil-te-ama posts surface). Replaced by the real Home in Fase 2.
import type { GetStaticProps } from 'next';
import { getAllPublishedPosts, type PublicPost } from '@/lib/posts';
import { SITE_ID } from '@/lib/site';

interface Props {
  posts: Pick<PublicPost, 'id' | 'slug' | 'title'>[];
  siteId: string;
  error: string | null;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const posts = await getAllPublishedPosts();
    return {
      props: {
        posts: posts.map((p) => ({ id: p.id, slug: p.slug, title: p.title })),
        siteId: SITE_ID,
        error: null,
      },
      revalidate: 60,
    };
  } catch (e) {
    return {
      props: { posts: [], siteId: SITE_ID, error: (e as Error).message },
      revalidate: 60,
    };
  }
};

export default function Home({ posts, siteId, error }: Props) {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Brasil te Ama — Fase 0 ✅</h1>
      <p>Scaffold Next 15 + Supabase compartilhado conectado.</p>
      <p>
        <strong>SITE_ID:</strong> <code>{siteId}</code>
      </p>
      {error ? (
        <p style={{ color: '#C62B2B' }}>
          <strong>Erro de conexão:</strong> {error}
        </p>
      ) : (
        <>
          <p>
            <strong>Posts publicados deste site:</strong> {posts.length}
          </p>
          <ul>
            {posts.map((p) => (
              <li key={p.id}>{p.title} <code>/{p.slug}</code></li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
