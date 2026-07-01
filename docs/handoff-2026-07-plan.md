# Plano de Ação — Handoff de Design (2026-07)

Fonte: `tmp/design_handoff_site_update/` (protótipos `.dc.html` = referência de design, NÃO copiar).
Branch: `feat/design-handoff-2026-07`. Deploy: push em `master` publica staging automático → só mergear após `npm run build` verde.

## Natureza do handoff
Reposicionamento **comercial/conversão**: remove mood-bands, adota checklists/prova social/"sem custo", e converte forms flat → **multi-step**. Home/Sobre/Selo/Transparência são praticamente reescritas.

## DECISÕES DO DONO (travadas 2026-07)
- Remoções em massa: **SIM, seguir o protótipo** (aplicar cortes de mood-bands/seções institucionais).
- Navbar: **REMOVER "Projetos"** do menu (página segue acessível por link direto).
- Arranque: **Fase 0 (fundação)**.

## FASE 0 — Fundação (bloqueia o resto)
- [ ] Substituir `public/assets/logo-white.png` (único asset com delta real).
- [ ] Mergear ~86 classes CSS novas em `src/styles/main.css` (cred-bar, stories-grid, cta-card--check, form multi-step, contact-aside, filter-chip, hero--consumer etc.). Tokens `:root` já idênticos — não tocar.
- [ ] Portar motor **multi-step de forms** (`forms.js` → `usePublicForms.ts`): progress bar, validação por step, máscaras CNPJ/telefone, `validCNPJ`, char-counter, consent, review box, success screen. Ajustar `collect()` p/ varrer steps ocultos + `FORM_TYPES_BY_PATH`.
- [ ] `useSiteEnhancements.ts`: contadores animados (stat counters) + filtro `data-category` (Consumidor).

## FASE 1 — Página nova
- [ ] **Consumidor** (NÃO existe): criar `src/pages/consumidor.tsx` + `src/content/public/consumidor.ts` (+ `_i18n/`). 9 seções. Rota, sitemap, filtro de categoria por chips.
- [ ] Footer: adicionar link "Para Consumidores" (col "Vias de acesso") em `footer.ts`.
- [ ] Navbar: decidir com dono se remove "Projetos" do menu (protótipo não tem).

## FASE 2 — Reescritas ALTAS (conteúdo + componentes)
- [ ] **Home** (`index.ts`): +credibility-bar, +stories-grid; remove Apresentação/Notícias/Mood band/Três caminhos; cta-checklist.
- [ ] **Sobre** (`sobre.ts`): pills flow, MVV flip→estático, liderança card horizontal, +Próximos passos; remove 6 seções.
- [ ] **Selo** (`selo.ts`): hero blush, form multi-step, +Por que confiar, +Parceiros, timeline→cards, diff-grid→cards, FAQ novo.
- [ ] **Transparência** (`transparencia.ts`): +Impacto atual, +Como verificamos, +Fiscalização coletiva, +Primeiro relatório. ⚠️ PRESERVAR links legais reais `/termos` `/privacidade` `/cookies` (protótipo usa `#`).

## FASE 3 — MÉDIO
- [ ] **Empresas** (`empresas.ts`): 5 cards, step-cards, +Como garantimos transparência, form multi-step, FAQ.
- [ ] **ParaOngs** (`para-ongs.ts`): +mood band "A rede", form multi-step, copy.
- [ ] **Voluntarios** (`voluntarios.ts`): reorder, +Intro, +Mood band, +Por que ser voluntário, form multi-step.
- [ ] **Contato** (`contato.ts`): 5 forms (4 multi-step), aside contextual 2-col, success 4 fases.
- [ ] **Projetos** (`projetos.ts`): copy hero, +`data-cat` nos cards (alinhar filtro), remove impact-bar/cta-band. ⚠️ MANTER fotos reais (não voltar a image-slot).

## SEM AÇÃO (repo já é superset)
- Lideranca, Conteudo — protótipo é subconjunto. Não regredir.

## FASE 4 — Fechamento
- [ ] `npm run i18n:build` (hash-guarded; precisa `GOOGLE_TRANSLATE_API_KEY` no runtime).
- [ ] `npm run lint && npm run build`.
- [ ] Revisar `git diff`; commit por fase; merge em master só com build verde.

## Guard-rails (não regredir)
1. Transparência: manter links legais reais.
2. Projetos/Lideranca: manter fotos reais (protótipo tem placeholders).
3. Confirmar com dono remoções em massa (mood-bands, seções) — são decisão de conteúdo, não porta 1:1.
