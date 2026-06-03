// Server-side Google Cloud Translation (v2) helper.
// Used by the admin "translate post" API route. Static pages use the build
// script (scripts/i18n-build.mjs) which mirrors this logic in plain JS.
//
// Requires GOOGLE_TRANSLATE_API_KEY. The v2 endpoint accepts multiple `q`
// segments per request; we chunk by segment count and total payload size.

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

const MAX_SEGMENTS = 100; // API hard limit is 128
const MAX_CHARS = 28000; // API hard limit is ~30k codepoints per request

export type TranslateFormat = 'text' | 'html';

interface Chunk {
  start: number;
  items: string[];
}

function chunk(texts: string[]): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: string[] = [];
  let curChars = 0;
  let start = 0;
  texts.forEach((t, i) => {
    const len = t.length;
    if (cur.length && (cur.length >= MAX_SEGMENTS || curChars + len > MAX_CHARS)) {
      chunks.push({ start, items: cur });
      cur = [];
      curChars = 0;
      start = i;
    }
    cur.push(t);
    curChars += len;
  });
  if (cur.length) chunks.push({ start, items: cur });
  return chunks;
}

/**
 * Translate an array of strings from PT to `target`. Empty strings pass
 * through untouched. Returns an array aligned 1:1 with the input.
 */
export async function translateBatch(
  texts: string[],
  target: string,
  format: TranslateFormat = 'text',
  source = 'pt',
): Promise<string[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');

  // Track which indices actually need translation (non-blank).
  const out = [...texts];
  const idx: number[] = [];
  const payload: string[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim()) {
      idx.push(i);
      payload.push(t);
    }
  });
  if (!payload.length) return out;

  for (const c of chunk(payload)) {
    const body = new URLSearchParams();
    body.set('target', target);
    body.set('source', source);
    body.set('format', format);
    for (const q of c.items) body.append('q', q);

    const r = await fetch(`${ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Cloud Translation ${r.status}: ${txt.slice(0, 200)}`);
    }
    const json = (await r.json()) as {
      data?: { translations?: { translatedText: string }[] };
    };
    const translations = json.data?.translations ?? [];
    translations.forEach((tr, j) => {
      out[idx[c.start + j]] = tr.translatedText;
    });
  }
  return out;
}

export async function translateOne(
  text: string,
  target: string,
  format: TranslateFormat = 'text',
): Promise<string> {
  const [res] = await translateBatch([text], target, format);
  return res ?? text;
}
