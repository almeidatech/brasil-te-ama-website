import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { SITE_ID } from '@/lib/site';
import { revalidateConteudo } from '@/lib/revalidate-client';

type Status = 'all' | 'draft' | 'scheduled' | 'published' | 'archived';

interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  updated_at: string;
  category_id: string | null;
  categories: { name: string; color: string | null } | null;
}

interface Props {
  user: AdminUser;
  posts: PostRow[];
  status: Status;
  q: string;
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<Status, string> = {
  all: 'Todos', draft: 'Rascunho', scheduled: 'Agendado', published: 'Publicado', archived: 'Arquivado',
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;
  const status = (typeof ctx.query.status === 'string' ? ctx.query.status : 'all') as Status;
  const q = typeof ctx.query.q === 'string' ? ctx.query.q : '';
  const page = Math.max(1, parseInt(typeof ctx.query.page === 'string' ? ctx.query.page : '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let qry = supabase
    .from('posts')
    .select('id, slug, title, status, published_at, updated_at, category_id, categories(name,color)', { count: 'exact' })
    .eq('site_id', SITE_ID)
    .order('updated_at', { ascending: false })
    .range(from, to);
  if (status !== 'all') qry = qry.eq('status', status);
  if (q) qry = qry.ilike('title', `%${q}%`);

  const { data, count } = await qry;
  return {
    props: {
      user,
      posts: ((data ?? []) as unknown) as PostRow[],
      status, q, page, pageSize: PAGE_SIZE,
      total: count ?? 0,
    },
  };
};

export default function PostsList({ user, posts, status, q, page, pageSize, total }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [search, setSearch] = useState(q);

  const buildHref = (overrides: { status?: Status; q?: string; page?: number }) => {
    const params = new URLSearchParams();
    const st = overrides.status ?? status;
    const ss = overrides.q ?? search;
    const pg = overrides.page ?? 1; // any filter change resets to page 1
    if (st !== 'all') params.set('status', st);
    if (ss) params.set('q', ss);
    if (pg > 1) params.set('page', String(pg));
    return `/admin/posts${params.toString() ? '?' + params.toString() : ''}`;
  };
  const handleFilter = (newStatus: Status) => router.push(buildHref({ status: newStatus, page: 1 }));
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); router.push(buildHref({ page: 1 })); };
  const goToPage = (n: number) => router.push(buildHref({ page: n }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleDelete = async (p: PostRow) => {
    if (!confirm(`Excluir "${p.title}" permanentemente?`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    void revalidateConteudo(p.slug);
    toast.success(`Excluído: "${p.title}"`);
    router.replace(router.asPath);
  };

  return (
    <>
      <Head><title>Conteúdo · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Conteúdo</h1>
          <Link href="/admin/posts/new" style={{ padding: '10px 16px', background: 'var(--orange,#FF6A1A)', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>+ Novo conteúdo</Link>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle,#EEE)' }}>
            {(['all', 'draft', 'scheduled', 'published', 'archived'] as Status[]).map((s) => (
              <button key={s} onClick={() => handleFilter(s)}
                style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: status === s ? 'var(--orange,#FF6A1A)' : 'transparent', color: status === s ? 'white' : 'var(--fg-2,#333)', fontSize: 13, fontWeight: status === s ? 600 : 500 }}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} style={{ flex: 1 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pelo título…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-subtle,#EEE)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </form>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border-subtle,#EEE)', overflow: 'hidden' }}>
          {posts.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3,#888)' }}>
              Nenhum conteúdo. <Link href="/admin/posts/new" style={{ color: 'var(--orange,#FF6A1A)' }}>Crie o primeiro →</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--off-white,#FAF7F2)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Título</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Categoria</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Atualizado</th>
                  <th style={{ padding: '12px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border-subtle,#EEE)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/admin/posts/${p.id}/edit`} style={{ color: 'var(--fg-1,#1A1A1A)', textDecoration: 'none', fontWeight: 500 }}>{p.title || '(sem título)'}</Link>
                      <div style={{ fontSize: 12, color: 'var(--fg-3,#888)', fontFamily: 'monospace', marginTop: 2 }}>/conteudo/{p.slug}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-2,#444)' }}>
                      {p.categories ? (
                        <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.categories.color || '#ccc', marginRight: 6, verticalAlign: 'middle' }} />{p.categories.name}</>
                      ) : <span style={{ color: 'var(--fg-3,#aaa)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-3,#666)' }}>{new Date(p.updated_at).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href={`/admin/posts/${p.id}/edit`} style={{ padding: '6px 10px', background: 'transparent', borderRadius: 6, fontSize: 13, textDecoration: 'none', color: 'var(--fg-2,#333)' }}>Editar</Link>
                      <button onClick={() => handleDelete(p)} style={{ padding: '6px 10px', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#A1240E', marginLeft: 4 }}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid var(--border-subtle,#EEE)' }}>
            <div style={{ fontSize: 13, color: 'var(--fg-3,#666)' }}>
              Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} style={pgBtn(page <= 1)}>← Anterior</button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--fg-2,#444)' }}>Página {page} / {totalPages}</span>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} style={pgBtn(page >= totalPages)}>Próxima →</button>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}

const pgBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  background: disabled ? 'transparent' : '#fff',
  border: '1px solid var(--border-subtle,#DDD)',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
  color: 'var(--fg-2,#333)',
});

function StatusBadge({ status }: { status: PostRow['status'] }) {
  const palette: Record<PostRow['status'], { bg: string; fg: string; label: string }> = {
    draft:      { bg: '#F0F0F0', fg: '#555', label: 'Rascunho' },
    scheduled:  { bg: '#FFF4E5', fg: '#A45200', label: 'Agendado' },
    published:  { bg: '#E8F7EE', fg: '#0B5C2A', label: 'Publicado' },
    archived:   { bg: '#F5E9E9', fg: '#8B2A2A', label: 'Arquivado' },
  };
  const c = palette[status];
  return <span style={{ padding: '3px 8px', background: c.bg, color: c.fg, borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{c.label}</span>;
}
