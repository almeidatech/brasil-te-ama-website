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
  const { data } = await supabase.from('categories').select('id, name').eq('site_id', SITE_ID).order('order_index').order('name');
  return {
    props: {
      user,
      categories: ((data ?? []) as unknown) as CategoryOption[],
      initial: {
        title: '', slug: '', excerpt: '', body_md: '',
        status: 'draft', published_at: null, category_id: null,
        tags: [], seo_title: '', seo_description: '', reading_time_min: null,
        cover_image_id: null, cover_url: null,
      },
    },
  };
};

export default function NewPost({ user, categories, initial }: Props) {
  return (
    <>
      <Head><title>Novo conteúdo · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <div style={{ marginBottom: 16 }}>
          <a href="/admin/posts" style={{ fontSize: 13, color: 'var(--fg-3,#888)', textDecoration: 'none' }}>← Voltar para conteúdo</a>
        </div>
        <PostForm initial={initial} categories={categories} mode="create" />
      </AdminLayout>
    </>
  );
}
