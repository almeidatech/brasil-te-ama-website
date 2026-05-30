import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { requireAdminUser, isRedirect, type AdminUser } from '@/lib/admin-auth';
import { resizeImage, formatBytes } from '@/lib/image-resize';
import { MEDIA_BUCKET, MEDIA_PREFIX } from '@/lib/site';

interface MediaFile {
  name: string;        // full storage path inside bucket (always under MEDIA_PREFIX/)
  size: number;
  url: string;
  updated_at: string;
}

interface Props {
  user: AdminUser;
  files: MediaFile[];
  publicUrlBase: string;
}

// Tenant isolation: every path lives under `brasil-te-ama/`. We only ever list
// and write inside that prefix so olmeda-pet's media never leaks into this UI.
const SUBFOLDERS = ['posts', 'covers', 'uploads', 'slots'];

async function listAllFiles(supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>, baseUrl: string): Promise<MediaFile[]> {
  const collected: MediaFile[] = [];
  for (const sub of SUBFOLDERS) {
    const prefix = `${MEDIA_PREFIX}/${sub}`;
    const { data } = await supabase.storage.from(MEDIA_BUCKET).list(prefix, { limit: 200, sortBy: { column: 'updated_at', order: 'desc' } });
    for (const f of data ?? []) {
      if (f.id) {
        const path = `${prefix}/${f.name}`;
        collected.push({
          name: path,
          size: (f.metadata?.size as number) ?? 0,
          url: `${baseUrl}/${MEDIA_BUCKET}/${path}`,
          updated_at: f.updated_at ?? f.created_at ?? '',
        });
      }
    }
  }
  // also list any loose files directly under the tenant prefix
  const { data: rootFiles } = await supabase.storage.from(MEDIA_BUCKET).list(MEDIA_PREFIX, { limit: 200, sortBy: { column: 'updated_at', order: 'desc' } });
  for (const f of rootFiles ?? []) {
    if (f.id && !SUBFOLDERS.includes(f.name)) {
      const path = `${MEDIA_PREFIX}/${f.name}`;
      collected.push({
        name: path,
        size: (f.metadata?.size as number) ?? 0,
        url: `${baseUrl}/${MEDIA_BUCKET}/${path}`,
        updated_at: f.updated_at ?? f.created_at ?? '',
      });
    }
  }
  collected.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  return collected;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminUser(ctx);
  if (isRedirect(auth)) return auth;
  const { user, supabase } = auth;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrlBase = `${supabaseUrl}/storage/v1/object/public`;
  const files = await listAllFiles(supabase as any, publicUrlBase);
  return { props: { user, files, publicUrlBase } };
};

export default function MediaPage({ user, files: initialFiles, publicUrlBase }: Props) {
  const supabase = createSupabaseBrowserClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (raw: FileList | File[] | null) => {
    if (!raw || raw.length === 0) return;
    setUploading(true);
    const list = Array.from(raw);
    const uploaded: MediaFile[] = [];
    for (const original of list) {
      try {
        const optimized = await resizeImage(original);
        const ext = optimized.name.split('.').pop() || 'bin';
        const path = `${MEDIA_PREFIX}/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
          cacheControl: '31536000',
          contentType: optimized.type,
          upsert: false,
        });
        if (error) throw error;
        uploaded.push({
          name: path,
          size: optimized.size,
          url: `${publicUrlBase}/${MEDIA_BUCKET}/${path}`,
          updated_at: new Date().toISOString(),
        });
        const saved = original.size > optimized.size ? ` (${formatBytes(original.size)} → ${formatBytes(optimized.size)})` : '';
        toast.success(`Enviado ${original.name}${saved}`);
      } catch (e) {
        toast.error(`Falhou: ${original.name} — ${(e as Error).message}`);
      }
    }
    setFiles((prev) => [...uploaded, ...prev]);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Excluir este arquivo? Esta ação não pode ser desfeita.\n${file.name}`)) return;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([file.name]);
    if (error) { toast.error(error.message); return; }
    setFiles((prev) => prev.filter((f) => f.name !== file.name));
    if (selected?.name === file.name) setSelected(null);
    toast.success('Arquivo excluído');
  };

  const handleCopy = async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.url);
      toast.success('URL copiada');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <>
      <Head><title>Mídia · Brasil te Ama Admin</title><meta name="robots" content="noindex, nofollow" /></Head>
      <AdminLayout user={user}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Mídia</h1>
          <div style={{ fontSize: 13, color: 'var(--fg-3,#888)' }}>{files.length} arquivo{files.length === 1 ? '' : 's'}</div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInput.current?.click()}
          style={{
            padding: 32, marginBottom: 24, borderRadius: 12,
            border: `2px dashed ${dragOver ? 'var(--orange,#FF6A1A)' : 'var(--border-subtle,#DDD)'}`,
            background: dragOver ? 'rgba(255,106,26,0.05)' : '#fff',
            textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {uploading ? 'Enviando…' : 'Arraste imagens aqui ou clique para enviar'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3,#888)' }}>
            Redimensionado para no máx. 1920px de largura · convertido para WebP @ 85% de qualidade
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {files.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--fg-3,#888)', background: '#fff', borderRadius: 12, border: '1px solid var(--border-subtle,#EEE)' }}>
            Nenhum arquivo ainda. Envie um acima.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {files.map((f) => (
              <button
                key={f.name}
                onClick={() => setSelected(f)}
                style={{
                  position: 'relative', padding: 0, border: '1px solid var(--border-subtle,#EEE)', borderRadius: 10, overflow: 'hidden',
                  background: '#fff', cursor: 'pointer', aspectRatio: '1', textAlign: 'left',
                }}
              >
                <img src={f.url} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white', fontSize: 11 }}>
                  <div style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name.split('/').pop()}</div>
                  <div style={{ opacity: 0.8 }}>{formatBytes(f.size)}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 24 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 12, maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle,#EEE)' }}>
                <strong style={{ fontFamily: 'monospace', fontSize: 13 }}>{selected.name}</strong>
                <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ padding: 20, display: 'grid', placeItems: 'center', background: 'var(--off-white,#FAF7F2)' }}>
                <img src={selected.url} alt={selected.name} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 6 }} />
              </div>
              <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle,#EEE)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input readOnly value={selected.url} style={{ flex: 1, minWidth: 240, padding: '8px 10px', fontFamily: 'monospace', fontSize: 12, border: '1px solid var(--border-subtle,#DDD)', borderRadius: 6, background: 'var(--off-white,#FAF7F2)' }} />
                <button onClick={() => handleCopy(selected)} style={{ padding: '8px 14px', background: 'var(--orange,#FF6A1A)', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Copiar URL</button>
                <button onClick={() => handleDelete(selected)} style={{ padding: '8px 14px', background: 'transparent', color: '#A1240E', border: '1px solid #E5C7C2', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
                <span style={{ fontSize: 12, color: 'var(--fg-3,#888)' }}>{formatBytes(selected.size)}</span>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </>
  );
}
