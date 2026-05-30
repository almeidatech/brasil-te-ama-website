import Head from 'next/head';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { SITE_ID } from '@/lib/site';
import { FORM_LABELS, FORM_TYPES, formLabel } from '@/lib/forms';

type StatusFilter = 'all' | 'new' | 'read' | 'archived';

interface SubRow {
  id: string;
  form_type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

interface Props {
  user: AdminUser;
  rows: SubRow[];
  status: StatusFilter;
  formType: string;
  page: number;
  pageSize: number;
  total: number;
  counts: { new: number };
}

const PAGE_SIZE = 25;
const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'new', label: 'Novas' },
  { key: 'read', label: 'Lidas' },
  { key: 'archived', label: 'Arquivadas' },
];

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;

  const status = (typeof ctx.query.status === 'string' ? ctx.query.status : 'new') as StatusFilter;
  const formType = typeof ctx.query.form_type === 'string' && FORM_TYPES.includes(ctx.query.form_type) ? ctx.query.form_type : 'all';
  const page = Math.max(1, parseInt(typeof ctx.query.page === 'string' ? ctx.query.page : '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let qry = supabase
    .from('submissions')
    .select('id, form_type, name, email, phone, payload, status, created_at', { count: 'exact' })
    .eq('site_id', SITE_ID)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (status !== 'all') qry = qry.eq('status', status);
  if (formType !== 'all') qry = qry.eq('form_type', formType);

  const [{ data, count }, { count: newCount }] = await Promise.all([
    qry,
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID).eq('status', 'new'),
  ]);

  return {
    props: {
      user,
      rows: ((data ?? []) as unknown) as SubRow[],
      status, formType, page, pageSize: PAGE_SIZE,
      total: count ?? 0,
      counts: { new: newCount ?? 0 },
    },
  };
};

export default function SubmissionsPage({ user, rows, status, formType, page, pageSize, total, counts }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState<SubRow | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildHref = (o: { status?: StatusFilter; form_type?: string; page?: number }) => {
    const params = new URLSearchParams();
    const st = o.status ?? status;
    const ft = o.form_type ?? formType;
    const pg = o.page ?? 1;
    if (st !== 'new') params.set('status', st);
    if (ft !== 'all') params.set('form_type', ft);
    if (pg > 1) params.set('page', String(pg));
    return `/admin/submissions${params.toString() ? '?' + params.toString() : ''}`;
  };

  const setStatus = async (row: SubRow, next: string) => {
    const { error } = await (supabase.from('submissions') as any).update({ status: next }).eq('id', row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next === 'read' ? 'Marcada como lida' : next === 'archived' ? 'Arquivada' : 'Reaberta');
    setOpen(null);
    router.replace(router.asPath);
  };

  const remove = async (row: SubRow) => {
    if (!confirm('Excluir esta mensagem permanentemente?')) return;
    const { error } = await supabase.from('submissions').delete().eq('id', row.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Mensagem excluída');
    setOpen(null);
    router.replace(router.asPath);
  };

  return (
    <>
      <Head><title>Mensagens · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Mensagens</h1>
          {counts.new > 0 && <span style={{ background: '#FFF4E5', color: '#A45200', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{counts.new} nova{counts.new === 1 ? '' : 's'}</span>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: '#fff', padding: 4, borderRadius: 10, border: '1px solid var(--border-subtle,#EEE)' }}>
            {STATUS_TABS.map((s) => (
              <button key={s.key} onClick={() => router.push(buildHref({ status: s.key, page: 1 }))}
                style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: status === s.key ? 'var(--orange,#FF6A1A)' : 'transparent', color: status === s.key ? 'white' : 'var(--fg-2,#333)', fontSize: 13, fontWeight: status === s.key ? 600 : 500 }}>
                {s.label}
              </button>
            ))}
          </div>
          <select value={formType} onChange={(e) => router.push(buildHref({ form_type: e.target.value, page: 1 }))}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle,#EEE)', fontSize: 14, fontFamily: 'inherit', background: '#fff' }}>
            <option value="all">Todos os formulários</option>
            {FORM_TYPES.map((t) => <option key={t} value={t}>{FORM_LABELS[t]}</option>)}
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border-subtle,#EEE)', overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3,#888)' }}>Nenhuma mensagem aqui.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--off-white,#FAF7F2)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Formulário</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>E-mail</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setOpen(r)} style={{ borderTop: '1px solid var(--border-subtle,#EEE)', cursor: 'pointer', fontWeight: r.status === 'new' ? 600 : 400 }}>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-3,#666)', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('pt-BR')} {new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px 16px' }}>{formLabel(r.form_type)}</td>
                    <td style={{ padding: '12px 16px' }}>{r.name || <span style={{ color: 'var(--fg-3,#aaa)' }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-2,#444)' }}>{r.email || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid var(--border-subtle,#EEE)' }}>
            <div style={{ fontSize: 13, color: 'var(--fg-3,#666)' }}>Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => router.push(buildHref({ page: page - 1 }))} disabled={page <= 1} style={pgBtn(page <= 1)}>← Anterior</button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--fg-2,#444)' }}>Página {page} / {totalPages}</span>
              <button onClick={() => router.push(buildHref({ page: page + 1 }))} disabled={page >= totalPages} style={pgBtn(page >= totalPages)}>Próxima →</button>
            </div>
          </div>
        )}

        {open && (
          <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, maxWidth: 640, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle,#EEE)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{formLabel(open.form_type)}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3,#888)' }}>{new Date(open.created_at).toLocaleString('pt-BR')}</div>
                </div>
                <button onClick={() => setOpen(null)} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, fontSize: 14 }}>
                  <div><div style={lbl}>Nome</div>{open.name || '—'}</div>
                  <div><div style={lbl}>E-mail</div>{open.email ? <a href={`mailto:${open.email}`} style={{ color: 'var(--orange,#FF6A1A)' }}>{open.email}</a> : '—'}</div>
                  <div><div style={lbl}>Telefone</div>{open.phone || '—'}</div>
                  <div><div style={lbl}>Status</div><StatusBadge status={open.status} /></div>
                </div>
                <div style={lbl}>Detalhes</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 4 }}>
                  <tbody>
                    {Object.entries(open.payload ?? {}).map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ padding: '6px 10px', border: '1px solid var(--border-subtle,#EEE)', fontWeight: 600, verticalAlign: 'top', width: '40%' }}>{k}</td>
                        <td style={{ padding: '6px 10px', border: '1px solid var(--border-subtle,#EEE)', whiteSpace: 'pre-wrap' }}>{Array.isArray(v) ? v.join(', ') : String(v)}</td>
                      </tr>
                    ))}
                    {(!open.payload || Object.keys(open.payload).length === 0) && (
                      <tr><td style={{ padding: 10, color: 'var(--fg-3,#aaa)' }}>Sem campos adicionais.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle,#EEE)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {open.status !== 'read' && <button onClick={() => setStatus(open, 'read')} style={btn('ghost')}>Marcar como lida</button>}
                {open.status !== 'archived' && <button onClick={() => setStatus(open, 'archived')} style={btn('ghost')}>Arquivar</button>}
                {open.status !== 'new' && <button onClick={() => setStatus(open, 'new')} style={btn('ghost')}>Reabrir</button>}
                <button onClick={() => remove(open)} style={{ ...btn('ghost'), color: '#A1240E', marginLeft: 'auto' }}>Excluir</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fg-3,#888)', marginBottom: 2 };
const pgBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 12px', background: disabled ? 'transparent' : '#fff', border: '1px solid var(--border-subtle,#DDD)',
  borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, color: 'var(--fg-2,#333)',
});
const btn = (kind: 'primary' | 'ghost'): React.CSSProperties => kind === 'primary'
  ? { padding: '8px 14px', background: 'var(--orange,#FF6A1A)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  : { padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-subtle,#DDD)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--fg-2,#333)' };

function StatusBadge({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string; label: string }> = {
    new: { bg: '#FFF4E5', fg: '#A45200', label: 'Nova' },
    read: { bg: '#E8F0FE', fg: '#1A4480', label: 'Lida' },
    archived: { bg: '#F0F0F0', fg: '#555', label: 'Arquivada' },
  };
  const c = palette[status] ?? { bg: '#F0F0F0', fg: '#555', label: status };
  return <span style={{ padding: '3px 8px', background: c.bg, color: c.fg, borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{c.label}</span>;
}
