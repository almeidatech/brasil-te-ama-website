import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useEffect, useRef } from 'react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { resizeImage } from '@/lib/image-resize';
import { MEDIA_BUCKET, MEDIA_PREFIX } from '@/lib/site';

interface Props {
  /** Initial markdown (loaded from posts.body_md). Use empty string for new posts. */
  initialMarkdown: string;
  /** Called whenever the doc changes — receives markdown string. Debounce upstream if needed. */
  onChange: (markdown: string) => void;
}

async function uploadImage(file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const optimized = await resizeImage(file);
  const ext = optimized.name.split('.').pop() || 'bin';
  const path = `${MEDIA_PREFIX}/posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
    cacheControl: '31536000',
    contentType: optimized.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export default function PostEditor({ initialMarkdown, onChange }: Props) {
  const editor = useCreateBlockNote({
    uploadFile: uploadImage,
  });
  const loadedRef = useRef(false);

  // Load initial markdown once after editor is ready.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      if (initialMarkdown && initialMarkdown.trim()) {
        const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
        editor.replaceBlocks(editor.document, blocks);
      }
    })();
  }, [editor, initialMarkdown]);

  return (
    <div style={{ border: '1px solid var(--border-subtle,#EEE)', borderRadius: 12, background: '#fff', minHeight: 480 }}>
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={async () => {
          const md = await editor.blocksToMarkdownLossy(editor.document);
          onChange(md);
        }}
      />
    </div>
  );
}
