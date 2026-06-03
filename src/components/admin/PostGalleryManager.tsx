// Admin gallery manager — upload, optimize (WebP, aspect preserved, no crop),
// reorder and remove carousel images for a post. Images live in post_images
// and render in the public <PostGallery> carousel.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MEDIA_BUCKET, MEDIA_PREFIX } from '@/lib/site';
import { resizeImage, formatBytes } from '@/lib/image-resize';

interface GalleryRow {
  id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  order_index: number;
}

async function readDimensions(file: File): Promise<{ w: number; h: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const d = { w: bmp.width, h: bmp.height };
    bmp.close?.();
    return d;
  } catch {
    return { w: 0, h: 0 };
  }
}

export default function PostGalleryManager({ postId }: { postId: string }) {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from('post_images')
      .select('id, url, storage_path, alt, width, height, order_index')
      .eq('post_id', postId)
      .order('order_index', { ascending: true });
    if (error) toast.error(`Galeria: ${error.message}`);
    setRows(((data ?? []) as unknown as GalleryRow[]));
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let nextOrder = rows.length ? Math.max(...rows.map((r) => r.order_index)) + 1 : 0;
    let savedBytes = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const optimized = await resizeImage(file);
        const { w, h } = await readDimensions(optimized);
        const ext = optimized.type === 'image/webp' ? 'webp' : (optimized.name.split('.').pop() || 'webp');
        const path = `${MEDIA_PREFIX}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
          cacheControl: '31536000', contentType: optimized.type, upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        const { error: insErr } = await (supabase.from('post_images') as any).insert({
          post_id: postId, url: pub.publicUrl, storage_path: path,
          alt: '', width: w || null, height: h || null, order_index: nextOrder++,
        });
        if (insErr) throw insErr;
        savedBytes += Math.max(0, file.size - optimized.size);
      }
      toast.success(`Imagens adicionadas${savedBytes ? ` (economia ${formatBytes(savedBytes)})` : ''}`);
      await load();
    } catch (e) {
      toast.error(`Falha no upload: ${(e as Error).message}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const remove = async (row: GalleryRow) => {
    const { error } = await supabase.from('post_images').delete().eq('id', row.id);
    if (error) { toast.error(error.message); return; }
    if (row.storage_path) await supabase.storage.from(MEDIA_BUCKET).remove([row.storage_path]).catch(() => {});
    setRows((rs) => rs.filter((r) => r.id !== row.id));
  };

  const updateAlt = async (id: string, alt: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, alt } : r)));
    await (supabase.from('post_images') as any).update({ alt }).eq('id', id);
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const a = rows[i];
    const b = rows[j];
    const next = [...rows];
    next[i] = b; next[j] = a;
    setRows(next);
    // Persist swapped order_index values.
    await Promise.all([
      (supabase.from('post_images') as any).update({ order_index: b.order_index }).eq('id', a.id),
      (supabase.from('post_images') as any).update({ order_index: a.order_index }).eq('id', b.id),
    ]);
  };

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--fg-3,#888)', margin: '0 0 10px' }}>
        Imagens do carrossel do post. Otimizadas para WebP e exibidas sem corte (proporção preservada).
      </p>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: '1px dashed var(--border-subtle,#CCC)', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--fg-2,#333)', marginBottom: 12 }}
      >
        {uploading ? 'Enviando…' : '+ Adicionar imagens'}
      </button>
      <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />

      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--fg-3,#aaa)' }}>Carregando…</p>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--fg-3,#aaa)' }}>Nenhuma imagem na galeria ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 8, padding: 8 }}>
              <div style={{ flex: '0 0 auto', width: 72, height: 72, borderRadius: 6, overflow: 'hidden', background: 'var(--off-white,#F4EEEF)', display: 'grid', placeItems: 'center' }}>
                <img src={row.url} alt={row.alt ?? ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  value={row.alt ?? ''}
                  onChange={(e) => setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, alt: e.target.value } : r)))}
                  onBlur={(e) => updateAlt(row.id, e.target.value)}
                  placeholder="Texto alternativo (acessibilidade)"
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-subtle,#EEE)', borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 11, color: 'var(--fg-3,#aaa)', marginTop: 4 }}>
                  {row.width && row.height ? `${row.width}×${row.height}` : '—'}
                </div>
              </div>
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir" style={miniBtn(i === 0)}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Descer" style={miniBtn(i === rows.length - 1)}>↓</button>
                <button type="button" onClick={() => remove(row)} aria-label="Remover" style={{ ...miniBtn(false), color: '#A1240E' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function miniBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 28, height: 24, border: '1px solid var(--border-subtle,#DDD)', borderRadius: 6,
    background: '#fff', cursor: disabled ? 'default' : 'pointer', fontSize: 12,
    opacity: disabled ? 0.4 : 1, lineHeight: 1,
  };
}
