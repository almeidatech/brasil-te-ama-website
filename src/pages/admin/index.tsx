import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { SITE_ID } from '@/lib/site';

interface DashboardProps {
  user: AdminUser;
  stats: { posts: number; drafts: number; published: number; categories: number };
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;

  const [{ count: total }, { count: drafts }, { count: published }, { count: categories }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID).eq('status', 'draft'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID).eq('status', 'published'),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID),
  ]);

  return {
    props: {
      user,
      stats: {
        posts: total ?? 0,
        drafts: drafts ?? 0,
        published: published ?? 0,
        categories: categories ?? 0,
      },
    },
  };
};

export default function AdminDashboard({ user, stats }: DashboardProps) {
  return (
    <>
      <Head>
        <title>Painel · Brasil te Ama Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout user={user}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 8 }}>Painel</h1>
        <p style={{ color: 'var(--fg-3, #666)', marginTop: 0, marginBottom: 32 }}>Bem-vindo de volta, {user.name || user.email}.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <Stat label="Todos os conteúdos" value={stats.posts} />
          <Stat label="Rascunhos" value={stats.drafts} />
          <Stat label="Publicados" value={stats.published} />
          <Stat label="Categorias" value={stats.categories} />
        </div>

        <div style={{ marginTop: 48, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid var(--border-subtle,#EEE)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 8 }}>Próximos passos</h2>
          <p style={{ color: 'var(--fg-3, #666)', margin: 0, fontSize: 14 }}>
            Crie sua primeira categoria e depois escreva seu primeiro conteúdo. A página pública /conteudo lê direto do Supabase assim que os posts forem publicados.
          </p>
        </div>
      </AdminLayout>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border-subtle,#EEE)' }}>
      <div style={{ fontSize: 12, color: 'var(--fg-3,#888)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
