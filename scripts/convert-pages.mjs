/**
 * Fase 2 — Conversor docs/*.html → src/content/public/*.ts
 *
 * Estratégia: preservar o markup/CSS do site estático VERBATIM. Para cada
 * página extraímos o corpo (do fim da <nav> até </body>), removemos scripts,
 * e reescrevemos:
 *   - caminhos de asset  assets/...      → /assets/...
 *   - links internos     pagina.html     → /pagina  (index.html → /)
 *   - <image-slot>       web-component    → <div data-slot-id> religável ao
 *                                           Supabase Storage em runtime (_app)
 * O chrome do topo (topbar + navbar) NÃO entra no corpo — é renderizado por
 * componentes React (Topbar/Navbar) com Link + active state. Prefooter e
 * footer ficam no corpo, fiéis ao original.
 *
 * Conteúdo (conteudo.html) é EXCLUÍDO daqui — vira página dinâmica em JSX.
 *
 * Uso: node scripts/convert-pages.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = 'docs';
const OUT = 'src/content/public';

// páginas que NÃO convertemos por aqui (chrome/fragmentos/dinâmica)
const SKIP = new Set(['conteudo.html']);

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** extrai conteúdo de uma tag de atributo simples: attr="valor" */
function attr(tagInner, name) {
  const m = tagInner.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : '';
}

function rewriteLinks(html) {
  // href/action="pagina.html(#frag|?query)?" → /pagina(...)  (index.html → /)
  return html.replace(
    /(href|action)="([\w./-]+)\.html((?:#|\?)[^"]*)?"/gi,
    (full, a, page, tail) => {
      const base = page.split('/').pop(); // ignora prefixos relativos
      tail = tail || '';
      if (base === 'index') return `${a}="/${tail}"`;
      return `${a}="/${base}${tail}"`;
    }
  );
}

function rewriteAssets(html) {
  // src="assets/..."  e  url('assets/...')  e  url(assets/...)
  return html
    .replace(/(src|href)="assets\//gi, '$1="/assets/')
    .replace(/url\((['"]?)assets\//gi, 'url($1/assets/');
}

function replaceImageSlots(html) {
  return html.replace(/<image-slot\b([^>]*)>\s*<\/image-slot>/gi, (full, inner) => {
    const id = attr(inner, 'id');
    const shape = attr(inner, 'shape') || 'rect';
    const fit = attr(inner, 'fit') || 'cover';
    const ph = decodeEntities(attr(inner, 'placeholder') || '');
    const style = attr(inner, 'style') || 'width:100%;height:100%;';
    // placeholder fiel ao empty-state do web-component original
    return (
      `<div class="image-slot" data-slot-id="${id}" data-shape="${shape}" data-fit="${fit}" ` +
      `style="${style};position:relative;overflow:hidden;background:rgba(0,0,0,.04)">` +
      `<span class="image-slot__ph">${ph}</span></div>`
    );
  });
}

function extractBody(html) {
  // remove todos os <script>...</script> e <script .../>
  let h = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  // corpo = do fim da navbar até </body>
  const navEnd = h.indexOf('</nav>');
  const bodyEnd = h.lastIndexOf('</body>');
  if (navEnd === -1 || bodyEnd === -1) throw new Error('marcadores </nav> ou </body> não encontrados');
  let body = h.slice(navEnd + '</nav>'.length, bodyEnd);
  // prefooter + footer NÃO entram no corpo — são renderizados pelo componente
  // único <Footer/> (PublicLayout). Cortamos no início do prefooter (ou do footer).
  const candidates = [body.indexOf('<section class="prefooter">'), body.indexOf('<footer')]
    .filter((i) => i !== -1);
  if (candidates.length) {
    let cut = Math.min(...candidates);
    // também descarta um comentário "<!-- ... PRE-FOOTER ... -->" imediatamente antes
    const before = body.lastIndexOf('<!--', cut);
    if (before !== -1 && body.slice(before, cut).trim().endsWith('-->')) cut = before;
    body = body.slice(0, cut);
  }
  return body.trim();
}

function metaOf(html) {
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  const d = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return {
    title: t ? decodeEntities(t[1].trim()) : 'Instituto Brasil Te Ama',
    description: d ? decodeEntities(d[1].trim()) : '',
  };
}

const files = readdirSync(DOCS).filter((f) => f.endsWith('.html') && !SKIP.has(f));
const index = [];

for (const file of files) {
  const raw = readFileSync(join(DOCS, file), 'utf8');
  const { title, description } = metaOf(raw);
  let body = extractBody(raw);
  body = rewriteAssets(body);
  body = rewriteLinks(body);
  body = replaceImageSlots(body);

  const name = file.replace(/\.html$/, '');
  const out = `// AUTO-GERADO por scripts/convert-pages.mjs — corpo fiel de docs/${file}\n` +
    `// Não editar à mão; reexecute o conversor.\n` +
    `const page = {\n` +
    `  title: ${JSON.stringify(title)},\n` +
    `  description: ${JSON.stringify(description)},\n` +
    `  html: ${JSON.stringify(body)},\n` +
    `};\nexport default page;\n`;
  writeFileSync(join(OUT, `${name}.ts`), out);
  index.push({ file, name, title, bytes: body.length });
}

// Footer/prefooter NÃO são mais gerados aqui — viraram o componente único
// src/components/public/Footer.tsx (fonte única, editável à mão).

console.log('Convertidas', index.length, 'páginas:');
for (const i of index) console.log(`  ${i.file.padEnd(20)} → src/content/public/${i.name}.ts  (${i.bytes} bytes)`);
