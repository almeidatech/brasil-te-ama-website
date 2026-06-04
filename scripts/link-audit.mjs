import fs from 'node:fs';
import path from 'node:path';

const cdir = 'src/content/public';
const files = fs.readdirSync(cdir).filter((f) => f.endsWith('.ts')).map((f) => path.join(cdir, f));

const hrefRe = /href=\\?"#([^"\\]+)\\?"/g; // âncoras #xxx (ignora href="#")
const idRe = /\bid=\\?"([^"\\]+)\\?"/g;

console.log('=== ÂNCORAS SEM ALVO (id ausente na MESMA página) ===');
let any = false;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ids = new Set();
  let m;
  while ((m = idRe.exec(src))) ids.add(m[1]);
  const anchors = new Set();
  while ((m = hrefRe.exec(src))) anchors.add(m[1]);
  const missing = [...anchors].filter((a) => !ids.has(a));
  if (missing.length) {
    any = true;
    console.log(`  ${path.basename(file)}:`);
    missing.forEach((a) => console.log(`     #${a}  (ids na página: ${[...ids].join(', ') || '—'})`));
  }
}
if (!any) console.log('  ok: toda âncora tem alvo na própria página');

console.log('\n=== href="#" (placeholders / dead links) por página ===');
const deadRe = /href=\\?"#\\?"/g;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const n = (src.match(deadRe) || []).length;
  if (n) console.log(`  ${path.basename(file)}: ${n}x href="#"`);
}
