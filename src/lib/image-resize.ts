// Client-side image resize using Canvas — no deps, runs in the browser.
// Goal: keep storage/bandwidth low without losing visual quality for blog use.
//
// - Caps width at MAX_WIDTH (1920 by default) keeping aspect ratio.
// - Preserves SVG/GIF as-is (no canvas re-encode — would break vector or animation).
// - Re-encodes JPEG/PNG/WebP/AVIF to WebP at QUALITY (smaller than JPEG, fewer artifacts).

export interface ResizeOptions {
  maxWidth?: number;
  quality?: number;       // 0..1, WebP encoder quality
  outputType?: string;    // override output mime; default 'image/webp'
}

const PASSTHROUGH_MIMES = new Set(['image/svg+xml', 'image/gif']);

export async function resizeImage(file: File, opts: ResizeOptions = {}): Promise<File> {
  const { maxWidth = 1920, quality = 0.85, outputType = 'image/webp' } = opts;

  if (PASSTHROUGH_MIMES.has(file.type)) return file;
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await loadBitmap(file);
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  // No resize AND already WebP → keep original.
  if (scale === 1 && file.type === outputType) return file;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), outputType, quality),
  );
  if (!blob) return file;

  const ext = outputType === 'image/webp' ? 'webp' : outputType.split('/')[1];
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${baseName}.${ext}`, { type: outputType, lastModified: Date.now() });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallthrough
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
