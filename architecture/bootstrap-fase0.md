# Brasil te Ama — Bootstrap Fase 0 (Blueprint)

> Artefato de arquitetura por **Aria (@architect)** — 2026-05-30.
> Decisões travadas vêm do plano de ativação (sessão anterior). Este doc é o **handoff executável** para **@dev**.
> Escopo: SOMENTE Fase 0 (scaffold `src/` + deps + reuso da camada base). Fases 2–5 ficam em docs próprios.

---

## Objetivo da Fase 0

Transformar o site estático (`docs/` HTML/CSS, sem `src/`) na base de uma app **Next 15 (pages router) + React 18 + TypeScript + Mantine + Supabase compartilhado**, replicando a estrutura do `olmeda-pet`, SEM ainda converter páginas públicas (Fase 2) nem CMS (Fase 3).

**Resultado esperado ao fim da Fase 0:** `npm run dev` sobe a app, conecta no Supabase compartilhado com `SITE_ID=2222…`, e a camada base (supabase client/server, auth, site, revalidate, types) compila sem erro.

---

## Estrutura-alvo `src/` (replica olmeda-pet)

Confirmado no `olmeda-pet/src` (existe de fato):

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← COPIAR as-is
│   │   └── server.ts        ← COPIAR as-is
│   ├── admin-auth.ts        ← COPIAR as-is
│   ├── site.ts              ← COPIAR + TROCAR SITE_ID p/ 2222…
│   ├── image-resize.ts      ← COPIAR as-is
│   ├── posts.ts             ← COPIAR (já deve filtrar por site_id — VERIFICAR)
│   └── newsletter.ts        ← OPCIONAL (ver ponto de decisão #3)
├── types/
│   └── database.ts          ← COPIAR as-is (schema compartilhado, multi-tenant)
├── middleware.ts            ← COPIAR as-is (auth admin)
├── pages/
│   └── api/
│       └── revalidate.ts    ← COPIAR as-is
├── instrumentation.ts       ← COPIAR (Sentry)
├── sentry.client.config.ts  ← COPIAR + trocar DSN
├── sentry.server.config.ts  ← COPIAR + trocar DSN
├── sentry.edge.config.ts    ← COPIAR + trocar DSN
└── styles/
    └── (ver Fase 2 — main.css virá dos design tokens do brasil)
```

**NÃO copiar na Fase 0** (vêm depois):
- `src/pages/admin/*`, `src/components/admin/*` → **Fase 3** (CMS)
- `src/components/{Navbar,Footer,Card,...}.tsx` → são **olmeda-branded**, NÃO reusar. Público sai da conversão do `docs/` HTML (Fase 2).
- `src/layouts/`, `src/content/` → avaliar na Fase 2.

---

## Arquivos de config (raiz) — COPIAR + adaptar

| Arquivo | Ação |
|---------|------|
| `next.config.js` | Copiar; revisar domínios de imagem (Supabase Storage) e MDX |
| `tsconfig.json` | Copiar as-is |
| `eslint.config.js` | Copiar as-is |
| `next-env.d.ts` | Copiar as-is |
| `Dockerfile` | Copiar; ajustar nome da imagem → `brasil-te-ama` (Fase 5) |
| `.github/workflows/build-deploy.yml` | **NÃO na Fase 0** — Fase 5 (GHCR `brasil-te-ama`) |
| `deploy/stack.yml` | **NÃO na Fase 0** — Fase 5 (novo serviço Traefik) |

> ⚠️ `brasilteama` **não é repositório git** (greenfield). Antes de CI/CD (Fase 5), inicializar git + remote → trabalho de **@devops (Gage)**, autoridade exclusiva.

---

## Dependências (`package.json`)

Base = deps do olmeda-pet. **Copiar todas**, exceto avaliar `@olmeda/design-system` (ponto de decisão #2).

```jsonc
"dependencies": {
  "@blocknote/core": "^0.51.2",      // CMS editor (Fase 3)
  "@blocknote/mantine": "^0.51.2",
  "@blocknote/react": "^0.51.2",
  "@mantine/core": "^8.3.18",        // ADMIN UI (Fase 3)
  "@mantine/hooks": "^8.3.18",
  "@mdx-js/loader": "^3.1.1",
  "@mdx-js/react": "^3.1.1",
  "@next/mdx": "^16.2.6",
  "@sentry/nextjs": "^10.54.0",
  "@supabase/ssr": "^0.10.3",        // base
  "@supabase/supabase-js": "^2.106.2", // base
  "gray-matter": "^4.0.3",
  "marked": "^18.0.4",
  "next": "^15.5.18",
  "next-mdx-remote": "^6.0.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "sonner": "^2.0.7"
  // @olmeda/design-system → ver decisão #2 (NÃO copiar por default)
},
"devDependencies": {
  "@types/node": "^20", "@types/react": "^18", "@types/react-dom": "^18",
  "eslint": "^9.39.4", "eslint-config-next": "^15.5.18",
  "prettier": "^3", "typescript": "^5", "http-server": "^14.1.0"
}
```

**Scripts:** copiar `dev/build/start/lint/format`. **Remover** `postinstall: setup-assets.js` e `serve:design` por default (são do pipeline de assets do olmeda) — ver decisão #4.

---

## Variáveis de ambiente (`.env.local`)

```bash
NEXT_PUBLIC_SITE_ID=22222222-2222-2222-2222-222222222222   # brasil-te-ama
NEXT_PUBLIC_SUPABASE_URL=<mesma do olmeda — DB compartilhado>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<mesma>
SUPABASE_SERVICE_ROLE_KEY=<mesma>
# Storage: mídia → prefixo "brasil-te-ama/" no bucket blog-media
# ZeptoMail token → Fase 4 (forms)
# Sentry DSN → próprio do projeto brasil (criar)
```

---

## Passos de execução (ordem para @dev)

1. `mkdir src` e subpastas conforme estrutura-alvo.
2. Escrever `package.json` (deps acima) → `npm install`.
3. Copiar configs de raiz (next/tsconfig/eslint).
4. Copiar camada base `lib/supabase/*`, `lib/admin-auth.ts`, `lib/image-resize.ts`, `types/database.ts`, `middleware.ts`, `pages/api/revalidate.ts`, `instrumentation.ts`, `sentry.*`.
5. Copiar `lib/site.ts` e **trocar o SITE_ID** para `2222…`. **Verificar** que `lib/posts.ts` filtra por `site_id` (multi-tenant) antes de copiar.
6. Criar `.env.local` (valores acima).
7. Criar uma `pages/index.tsx` mínima de smoke-test (ex.: renderiza "Brasil te Ama" + um fetch de `posts` filtrado por site_id) só pra validar conexão.
8. `npm run dev` → confirmar boot + conexão Supabase. `npm run build` → confirmar typecheck.

**Critério de aceite Fase 0:** `dev` sobe, `build` passa typecheck, smoke-test lê `posts` do site 2222 sem vazar dados do site olmeda.

---

## ✅ Pontos de decisão — RESOLVIDOS (dono, 2026-05-30)

1. **Páginas extras no `docs/`** (`case-study.html`, `diagnostico.html`, `services.html`) → **ENTRAM na conversão** (Fase 2). Tratar como páginas públicas normais.
2. **`@olmeda/design-system`** → **opção (a): NÃO incluir na Fase 0.** Adicionar só na Fase 3 se o admin CMS exigir. Mantém Fase 0 limpa.
3. **`lib/newsletter.ts` + `pages/api/newsletter/`** → **FORA da Fase 0.** Adicionar só se virar requisito futuro.
4. **`postinstall: setup-assets.js` / `serve:design`** → **REMOVER.** Brasil tem `design-assets/` próprio.

---

## Handoff

- **Decisão arquitetural:** travada (este doc).
- **Próximo dono:** **@dev (Dex)** — executar passos 1–8 numa sessão dedicada (`/clear` antes p/ cache quente).
- **Bloqueios:** confirmar os 4 pontos de decisão acima com o dono antes do @dev começar (ou @dev segue as recomendações default).
- **Conectividade:** esta máquina NÃO aplica DDL no Supabase (usar Dashboard SQL Editor). DB já está multi-tenant — Fase 0 não toca schema.

— Aria, arquitetando o futuro 🏗️
