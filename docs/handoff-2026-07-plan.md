# Plano de Ação — Handoff de Design (2026-07)

Fonte: `tmp/design_handoff_site_update/` (protótipos `.dc.html` = referência de design, NÃO copiar).
Branch: `feat/design-handoff-2026-07`. Deploy: push em `master` publica staging automático → só mergear após `npm run build` verde.

## PROGRESSO
- ✅ **Fase 0** (commit `164cc8f`) — logo, engine multi-step de forms, counters+filtro, ~90 classes CSS. tsc+build verdes.
- ✅ **Fase 1** (commit `d168616`) — página `/consumidor` nova, Projetos removido do nav, footer +Para Consumidores, sitemap. tsc+build verdes.
- ✅ **Fase 2** (commit `d249694`) — reescritas de Home, Sobre, Selo (form multi-step), Transparência (links legais preservados). tsc+build verdes.
- ✅ **Fase 3** (commit `05bb90e`) — Empresas, ParaOngs, Voluntarios, Contato (5 abas+aside), Projetos. + fix CSS `.faq-answer` + hook de abas reconhece `.qa-btn`. tsc+build verdes.
- ⏳ **Fase 4** (go-live) — `i18n:build` (precisa GOOGLE_TRANSLATE_API_KEY), smoke test visual (`next dev`), aprovação do dono, merge em master (dispara deploy staging).

### Débitos técnicos conhecidos (não bloqueiam; anotar)
- `review-box` (preview ao vivo dos dados) dos forms multi-step fica estático — dependia de script do runtime DC; o hook não popula. Forms enviam normal.
- Busca por texto em Projetos (`#projSearch`) fica inerte — hook só filtra por categoria.
- Links sociais placeholder (`href="#"`) em CTAs (Consumidor, etc.).
- Números/estatísticas vieram dos protótipos — confirmar se reais antes do go-live.

### Itens p/ dono confirmar antes do go-live (flags dos agentes)
- Números da Consumidor ("R$ 2.847.000", "15.000 pessoas", "42 projetos", "+2.500 mulheres") vieram do protótipo — confirmar se são reais.
- Links sociais placeholder (`href="#"`) no CTA da Consumidor.
- Âncora `/para-ongs#criterios` — confirmar que `#criterios` existe nessa página.

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
