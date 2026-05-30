import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { SITE_ID } from '@/lib/site';
import { revalidateConteudo } from '@/lib/revalidate-client';

interface Cat {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
  order_index: number;
}

interface Props { user: AdminUser; initial: Cat[] }

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;
  const { data } = await supabase.from('categories').select('*').eq('site_id', SITE_ID).order('order_index').order('name');
  return { props: { user, initial: ((data ?? []) as unknown) as Cat[] } };
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export default function CategoriesPage({ user, initial }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [list, setList] = useState<Cat[]>(initial);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: '#C62B2B', order_index: 100 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugTouched = useRef(false);

  const startNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', color: '#C62B2B', order_index: 100 });
    slugTouched.current = false;
  };
  const startEdit = (c: Cat) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', color: c.color ?? '#C62B2B', order_index: c.order_index });
    slugTouched.current = true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    const payload = {
      site_id: SITE_ID,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      color: form.color || null,
      order_index: Number(form.order_index) || 100,
    };
    const table = supabase.from('categories') as any;
    const op = editing
      ? table.update(payload).eq('id', editing.id).select().single()
      : table.insert(payload).select().single();
    const { data, error: err } = await op;
    setSaving(false);
    if (err) { setError(err.message); toast.error(`Não foi possível salvar: ${err.message}`); return; }
    const row = data as unknown as Cat;
    setList((prev) => {
      const next = prev.filter((c) => c.id !== row.id);
      next.push(row);
      next.sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name));
      return next;
    });
    void revalidateConteudo();
    toast.success(editing ? `Atualizada: "${row.name}"` : `Criada: "${row.name}"`);
    startNew();
  };

  const handleDelete = async (c: Cat) => {
    if (!confirm(`Excluir a categoria "${c.name}"? Os conteúdos manterão category_id como nulo.`)) return;
    const { error: err } = await supabase.from('categories').delete().eq('id', c.id);
    if (err) { toast.error(err.message); return; }
    setList((prev) => prev.filter((x) => x.id !== c.id));
    if (editing?.id === c.id) startNew();
    void revalidateConteudo();
    toast.success(`Excluída: "${c.name}"`);
  };

  return (
    <>
      <Head><title>Categorias · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 24 }}>Categorias</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 12, overflow: 'hidden' }}>
            {list.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3,#888)' }}>Nenhuma categoria ainda. Crie uma →</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--off-white,#FAF7F2)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nome</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Slug</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Ordem</th>
                    <th style={{ padding: '12px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--border-subtle,#EEE)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color || '#ccc', marginRight: 8, verticalAlign: 'middle' }} />
                        {c.name}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--fg-3,#666)', fontFamily: 'monospace', fontSize: 13 }}>{c.slug}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{c.order_index}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => startEdit(c)} style={btn('ghost')}>Editar</button>
                        <button onClick={() => handleDelete(c)} style={{ ...btn('ghost'), color: '#A1240E', marginLeft: 6 }}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 16 }}>{editing ? `Editar "${editing.name}"` : 'Nova categoria'}</h2>
            <Field label="Nome" required>
              <input value={form.name} onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched.current ? f.slug : slugify(name) }));
              }} required style={input()} />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => { slugTouched.current = true; setForm({ ...form, slug: e.target.value }); }} placeholder="gerado a partir do nome" style={{ ...input(), fontFamily: 'monospace', fontSize: 13 }} />
            </Field>
            <Field label="Descrição">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={input()} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Cor">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: '100%', height: 38, border: '1px solid var(--border-subtle,#DDD)', borderRadius: 8, cursor: 'pointer' }} />
              </Field>
              <Field label="Ordem">
                <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} style={input()} />
              </Field>
            </div>
            {error && <div style={{ background: '#FDECEA', color: '#A1240E', padding: 10, borderRadius: 6, fontSize: 13, marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" disabled={saving} style={btn('primary')}>{saving ? 'Salvando…' : editing ? 'Atualizar' : 'Criar'}</button>
              {editing && <button type="button" onClick={startNew} style={btn('ghost')}>Cancelar</button>}
            </div>
          </form>
        </div>
      </AdminLayout>
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--fg-2,#333)' }}>{label}{required && <span style={{ color: '#A1240E' }}> *</span>}</label>
      {children}
    </div>
  );
}
const input = () => ({ width: '100%', padding: '8px 10px', border: '1px solid var(--border-subtle,#DDD)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' as const });
const btn = (kind: 'primary' | 'ghost') => kind === 'primary'
  ? { padding: '10px 16px', background: 'var(--orange,#FF6A1A)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }
  : { padding: '6px 10px', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: 'var(--fg-2,#333)' };
