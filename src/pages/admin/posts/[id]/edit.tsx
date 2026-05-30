import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import PostForm, { type CategoryOption, type PostFormInitial } from '@/components/admin/PostForm';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { SITE_ID } from '@/lib/site';

interface Props { user: AdminUser; categories: CategoryOption[]; initial: PostFormInitial }

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;
  const id = ctx.params?.id as string;

  const [{ data: postData }, { data: catsData }] = await Promise.all([
    supabase.from('posts').select('id, title, slug, excerpt, body_md, status, published_at, category_id, tags, seo_title, seo_description, reading_time_min, cover_image_id, cover_image:cover_image_id(public_url, storage_path)').eq('id', id).eq('site_id', SITE_ID).single(),
    supabase.from('categories').select('id, name').eq('site_id', SITE_ID).order('order_index').order('name'),
  ]);

  const post = postData as null | {
    id: string; title: string; slug: string; excerpt: string | null; body_md: string | null;
    status: PostFormInitial['status']; published_at: string | null; category_id: string | null;
    tags: string[]; seo_title: string | null; seo_description: string | null; reading_time_min: number | null;
    cover_image_id: string | null;
    cover_image: { public_url: string | null; storage_path: string | null } | null;
  };

  if (!post) return { notFound: true };

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  const coverUrl = post.cover_image?.public_url
    ?? (post.cover_image?.storage_path ? `${supabaseUrl}/storage/v1/object/public/blog-media/${post.cover_image.storage_path}` : null);

  return {
    props: {
      user,
      categories: ((catsData ?? []) as unknown) as CategoryOption[],
      initial: {
        id: post.id, title: post.title, slug: post.slug,
        excerpt: post.excerpt ?? '', body_md: post.body_md ?? '',
        status: post.status, published_at: post.published_at, category_id: post.category_id,
        tags: post.tags ?? [],
        seo_title: post.seo_title ?? '', seo_description: post.seo_description ?? '',
        reading_time_min: post.reading_time_min,
        cover_image_id: post.cover_image_id,
        cover_url: coverUrl,
      },
    },
  };
};

export default function EditPost({ user, categories, initial }: Props) {
  return (
    <>
      <Head><title>Editar: {initial.title} · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <div style={{ marginBottom: 16 }}>
          <a href="/admin/posts" style={{ fontSize: 13, color: 'var(--fg-3,#888)', textDecoration: 'none' }}>← Voltar para conteúdo</a>
        </div>
        <PostForm initial={initial} categories={categories} mode="edit" />
      </AdminLayout>
    </>
  );
}
