# Go-live — institutobrasilteama.org

Branch `chore/go-live-institutobrasilteama` (base: `feat/design-handoff-2026-07`). Contém o handoff de design + a config de domínio oficial. **Não mergear até DNS pronto + aprovação final do dono.**

## O que esta branch muda (código/infra)
- `Dockerfile` (ARG defaults) e `.github/workflows/build-deploy.yml` (build-args) → `NEXT_PUBLIC_SITE_URL=https://institutobrasilteama.org`, `NEXT_PUBLIC_NOINDEX=false` (permite indexação).
- `.github/workflows/build-deploy.yml` → healthcheck pós-deploy passa a checar `https://institutobrasilteama.org/`.
- `deploy/stack.yml`:
  - env runtime `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_NOINDEX` → oficial/false.
  - Traefik: router **oficial** (`institutobrasilteama.org`) serve o app com TLS Let's Encrypt; router **legacy** (`brasilteama.alcgestao.com.br`) faz **301 permanente** para o oficial (middleware `redirectregex`, preserva o path).

Já corretos (não mexer): `src/lib/seo.ts` (default já é oficial → canonical/OG corretos), `public/robots.txt` (Sitemap já aponta pro oficial), `next.config.js` (remove o header `X-Robots-Tag: noindex` quando a flag ≠ "true").

## Ordem do go-live (executar no dia)
1. **DNS** (você): apontar `institutobrasilteama.org` (registro A/CNAME) pro IP do servidor. Aguardar propagação. *(Opcional: `www` → apex, ou adicionar Host `www.institutobrasilteama.org` no stack.)*
2. **Aprovação do dono** no staging atual (design revisado).
3. **Merge** desta branch em `master` → dispara o build/deploy. O Traefik emite o cert do domínio oficial (precisa do passo 1 pronto) e o app passa a servir em `institutobrasilteama.org`; o provisório 301 → oficial.
4. **Verificar**: `curl -I https://brasilteama.alcgestao.com.br/` deve retornar `301` → `https://institutobrasilteama.org/`; o oficial responde `200` sem header `X-Robots-Tag: noindex`.

## Passos externos (fora desta branch)
- **E-mail (ZeptoMail)**: hoje `CONTACT_FROM_EMAIL=noreply@olmedapetstudio.com` (transitório). Verificar o domínio `institutobrasilteama.org` no ZeptoMail e trocar `CONTACT_FROM_EMAIL`/`CONTACT_TO_EMAIL` no `stack.yml` (não incluído aqui — depende da verificação de domínio).
- **Google Search Console**: verificar `institutobrasilteama.org`, submeter `https://institutobrasilteama.org/sitemap.xml`. Ver `architecture/seo-marketing-prod.md`.
- **SEO/marketing go-live**: seguir `architecture/seo-marketing-prod.md` (GBP, Meta, Ads, etc.).

## Rollback
Reverter o merge desta branch (ou redeploy da imagem anterior) volta ao provisório com `noindex`. O 301 é reversível, mas evite flip-flop de domínio por SEO.
