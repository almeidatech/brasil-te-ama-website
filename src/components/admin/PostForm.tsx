import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { SITE_ID, MEDIA_BUCKET, MEDIA_PREFIX } from '@/lib/site';
import { resizeImage, formatBytes } from '@/lib/image-resize';
import { revalidateConteudo } from '@/lib/revalidate-client';
import { TRANSLATABLE_LOCALES, LOCALE_META } from '@/lib/i18n';
import PostGalleryManager from './PostGalleryManager';

const PostEditor = dynamic(() => import('./PostEditor'), { ssr: false });

export interface PostFormInitial {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  category_id: string | null;
  tags: string[];
  seo_title: string;
  seo_description: string;
  reading_time_min: number | null;
  cover_image_id: string | null;
  cover_url: string | null;
}

export interface CategoryOption { id: string; name: string; }

interface Props {
  initial: PostFormInitial;
  categories: CategoryOption[];
  mode: 'create' | 'edit';
}

const empty: PostFormInitial = {
  title: '', slug: '', excerpt: '', body_md: '',
  status: 'draft', published_at: null, category_id: null,
  tags: [], seo_title: '', seo_description: '', reading_time_min: null,
  cover_image_id: null, cover_url: null,
};

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

function estimateReadingTime(md: string) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function PostForm({ initial, categories, mode }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [form, setForm] = useState<PostFormInitial>({ ...empty, ...initial });
  const [saving, setSaving] = useState<null | 'draft' | 'publish'>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const slugTouched = useRef(initial.slug !== '');

  // Auto-slug from title until user touches slug field.
  useEffect(() => {
    if (!slugTouched.current && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title]);

  const handleEditorChange = (md: string) => {
    setForm((f) => ({ ...f, body_md: md, reading_time_min: estimateReadingTime(md) }));
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const optimized = await resizeImage(file);
      const ext = optimized.name.split('.').pop() || 'webp';
      const path = `${MEDIA_PREFIX}/covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
        cacheControl: '31536000', contentType: optimized.type, upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

      // NOTE: the shared `media` table has NO site_id column — tenant isolation
      // is by storage path prefix (brasil-te-ama/). Do not insert site_id here.
      const { data: mediaRow, error: mErr } = await (supabase.from('media') as any)
        .insert({ storage_path: path, public_url: pub.publicUrl, mime: optimized.type, size_bytes: optimized.size })
        .select('id')
        .single();
      if (mErr) throw mErr;

      setForm((f) => ({ ...f, cover_image_id: (mediaRow as { id: string }).id, cover_url: pub.publicUrl }));
      const saved = file.size > optimized.size ? ` (${formatBytes(file.size)} → ${formatBytes(optimized.size)})` : '';
      toast.success(`Capa enviada${saved}`);
    } catch (e) {
      toast.error(`Falha no upload da capa: ${(e as Error).message}`);
    } finally {
      setUploadingCover(false);
      if (coverInput.current) coverInput.current.value = '';
    }
  };

  const handleSave = async (publish: boolean) => {
    const title = form.title.trim();
    if (!title) {
      toast.error('O título é obrigatório');
      return;
    }

    setSaving(publish ? 'publish' : 'draft');
    setError(null);

    const slug = form.slug.trim() || slugify(title);
    const payload = {
      site_id: SITE_ID,
      title,
      slug,
      excerpt: form.excerpt.trim() || null,
      body_md: form.body_md || null,
      category_id: form.category_id || null,
      cover_image_id: form.cover_image_id,
      tags: form.tags,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      reading_time_min: form.reading_time_min,
      status: publish ? 'published' : form.status,
      published_at: publish && !form.published_at ? new Date().toISOString() : form.published_at,
    };

    const table = supabase.from('posts') as any;
    const op = mode === 'create'
      ? table.insert(payload).select('id').single()
      : table.update(payload).eq('id', initial.id!).select('id').single();

    const { data, error: err } = await op;
    setSaving(null);
    if (err) {
      setError(err.message);
      toast.error(err.message.includes('duplicate') ? `O slug "${payload.slug}" já existe` : err.message);
      return;
    }
    // Best-effort on-demand ISR so the public /conteudo reflects the change now.
    void revalidateConteudo(slug);
    const newId = (data as { id: string } | null)?.id;
    const verb = publish ? 'Publicado' : mode === 'create' ? 'Criado' : 'Salvo';
    toast.success(`${verb}: "${title}"`);
    if (mode === 'create' && newId) router.push(`/admin/posts/${newId}/edit?saved=1`);
    else router.replace(router.asPath);
  };

  const translatePost = async (locale: string) => {
    if (!initial.id) {
      toast.error('Salve o post antes de traduzir.');
      return;
    }
    setTranslating(locale);
    try {
      const r = await fetch('/api/admin/translate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: initial.id, locale }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
      toast.success(`Tradução ${LOCALE_META[locale as keyof typeof LOCALE_META].label} gerada e salva.`);
    } catch (e) {
      toast.error(`Falha ao traduzir (${locale.toUpperCase()}): ${(e as Error).message}`);
    } finally {
      setTranslating(null);
    }
  };

  const tagsStr = useMemo(() => form.tags.join(', '), [form.tags]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-3,#666)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Título do conteúdo <span style={{ color: '#A1240E' }}>*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Digite o título aqui…"
          required
          autoFocus={mode === 'create'}
          style={{
            width: '100%', fontSize: 28, fontWeight: 700, lineHeight: 1.2,
            border: '1px solid var(--border-subtle,#DDD)', background: '#fff',
            padding: '14px 16px', fontFamily: 'inherit', boxSizing: 'border-box',
            borderRadius: 10, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-3,#888)', marginTop: 8, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500 }}>URL:</label>
          <span style={{ fontFamily: 'monospace' }}>/conteudo/</span>
          <input
            value={form.slug}
            onChange={(e) => { slugTouched.current = true; setForm((f) => ({ ...f, slug: e.target.value })); }}
            placeholder="gerado a partir do título"
            style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
        </div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg-3,#666)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
          Corpo
        </label>

        <PostEditor initialMarkdown={initial.body_md || ''} onChange={handleEditorChange} />

        {error && <div style={{ marginTop: 12, background: '#FDECEA', color: '#A1240E', padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}
        {router.query.saved && <div style={{ marginTop: 12, background: '#E8F7EE', color: '#0B5C2A', padding: 12, borderRadius: 8, fontSize: 13 }}>✓ Salvo.</div>}
      </div>

      <aside style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card title="Publicação">
          <Row label="Status">
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PostFormInitial['status'] }))} style={input()}>
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </Row>
          {(form.status === 'scheduled' || form.status === 'published') && (
            <Row label={form.status === 'scheduled' ? 'Publicar em' : 'Publicado em'}>
              <input type="datetime-local" value={form.published_at ? form.published_at.slice(0, 16) : ''}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                style={input()} />
            </Row>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => handleSave(false)} disabled={saving !== null} style={btn('ghost')}>{saving === 'draft' ? 'Salvando…' : 'Salvar'}</button>
            <button onClick={() => handleSave(true)} disabled={saving !== null} style={btn('primary')}>{saving === 'publish' ? 'Publicando…' : form.status === 'published' ? 'Atualizar' : 'Publicar'}</button>
          </div>
        </Card>

        <Card title="Taxonomia">
          <Row label="Categoria">
            <select value={form.category_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))} style={input()}>
              <option value="">— Nenhuma —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Row>
          <Row label="Tags (separadas por vírgula)">
            <input value={tagsStr} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))} placeholder="impacto, voluntários, parcerias" style={input()} />
          </Row>
        </Card>

        <Card title="Imagem de capa">
          {form.cover_url ? (
            <div style={{ marginBottom: 8 }}>
              <img src={form.cover_url} alt="Capa" style={{ width: '100%', borderRadius: 8, display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ aspectRatio: '16/9', background: 'var(--off-white,#FAF7F2)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--fg-3,#aaa)', fontSize: 12, marginBottom: 8 }}>
              Sem imagem de capa
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" disabled={uploadingCover} onClick={() => coverInput.current?.click()} style={{ ...btn('ghost'), flex: 1 }}>
              {uploadingCover ? 'Enviando…' : form.cover_url ? 'Trocar' : 'Enviar capa'}
            </button>
            {form.cover_url && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, cover_image_id: null, cover_url: null }))} style={{ ...btn('ghost'), color: '#A1240E', flex: '0 0 auto' }}>
                Remover
              </button>
            )}
          </div>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
          />
          <div style={{ fontSize: 11, color: 'var(--fg-3,#aaa)', marginTop: 6 }}>
            Usada como destaque na página e imagem de compartilhamento. Redimensionada para WebP automaticamente.
          </div>
        </Card>

        <Card title="Resumo">
          <textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} rows={3} placeholder="Resumo curto para cards e feeds…" style={input()} />
        </Card>

        <Card title="SEO">
          <Row label="Título (padrão = título do post)">
            <input value={form.seo_title} onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))} placeholder={form.title} style={input()} />
          </Row>
          <Row label="Descrição">
            <textarea value={form.seo_description} onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))} rows={2} maxLength={160} placeholder="≤160 caracteres" style={input()} />
            <div style={{ fontSize: 11, color: 'var(--fg-3,#aaa)', textAlign: 'right' }}>{form.seo_description.length}/160</div>
          </Row>
        </Card>

        {mode === 'edit' && initial.id && (
          <Card title="Galeria (carrossel)">
            <PostGalleryManager postId={initial.id} />
          </Card>
        )}

        {mode === 'edit' && (
          <Card title="Traduções">
            <p style={{ fontSize: 12, color: 'var(--fg-3,#888)', margin: '0 0 10px' }}>
              Traduz o conteúdo salvo (título, resumo, corpo e SEO) e grava por idioma.
              Salve as alterações antes de gerar.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TRANSLATABLE_LOCALES.map((loc) => {
                const m = LOCALE_META[loc];
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => translatePost(loc)}
                    disabled={translating !== null}
                    style={{ ...btn('ghost'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <span aria-hidden="true">{m.flag}</span>
                    {translating === loc ? 'Traduzindo…' : `Traduzir ${m.label}`}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div style={{ fontSize: 12, color: 'var(--fg-3,#aaa)' }}>
          {form.reading_time_min ? `~${form.reading_time_min} min de leitura` : ''}
        </div>
      </aside>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 10, padding: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--fg-3,#666)', margin: 0, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--fg-2,#333)' }}>{label}</label>
      {children}
    </div>
  );
}
const input = () => ({ width: '100%', padding: '7px 10px', border: '1px solid var(--border-subtle,#DDD)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const });
const btn = (kind: 'primary' | 'ghost') => kind === 'primary'
  ? { flex: 1, padding: '10px 12px', background: 'var(--orange,#FF6A1A)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  : { flex: 1, padding: '10px 12px', background: 'transparent', border: '1px solid var(--border-subtle,#DDD)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--fg-2,#333)' };
