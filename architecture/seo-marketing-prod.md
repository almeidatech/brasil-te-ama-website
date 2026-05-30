# Brasil te Ama — SEO, Marketing & Go-Live (referência)

> Doc de referência por **@devops (Gage)** — 2026-05-30.
> Consultar **quando o site for para produção no domínio definitivo** (Fase 5).
> Cobre: (1) quais agentes AIOX cobrem SEO/Ads/GBP/Meta, (2) o "mito do React"
> e por que o nosso Next não cai nele, (3) checklist técnico de go-live.

---

## 1. Agentes AIOX para SEO / Ads / GBP / Meta

**Não existe um agente único** especialista em SEO/Ads/GBP/Meta. As competências
estão distribuídas pelos squads:

| Competência | Agente / Squad | O que cobre |
|---|---|---|
| **SEO técnico / on-page** | `/squad-design` | `squads/design/data/seo-rules.md`, `checklists/seo-meta-checklist.md`, workflow `page-composition` (meta tags, headings, estrutura) |
| **Ads / tráfego pago (copy)** | `/squad-copy` | `workflows/wf-2-paid-traffic.yaml`, metodologias native ads / YouTube ads / ad-copy (Eugene Schwartz) |
| **Estratégia / métricas / social** | `/marketing-opes` | agentes: `marketing-cmo`, `marketing-metrics`, `marketing-ideation-ig/li/yt`, `marketing-distribution`, `carousel-designer` |
| **Posicionamento / marca** | `/squad-brand` | brand strategy (Emily Heyward) |
| **Setup técnico de marketing** (GTM, Pixel, GA4, JSON-LD, GBP, sitemap) | **@devops (Gage)** ou **@dev (Dex)** | implementação no código/infra |

**Regra de bolso:** estratégia/criativo → squads de marketing; instrumentação
técnica no site → @devops/@dev.

---

## 2. "React/JS dificulta marketing do Google/Meta" — mito vs realidade

A preocupação é **verdadeira para SPA client-side** (React puro, Create React
App), onde o conteúdo só existe depois que o JS roda:

- Bots que **não executam JS** veem página vazia. O Google renderiza JS (2 ondas,
  com atraso e custo de crawl-budget), mas os **scrapers de preview de link**
  (WhatsApp, Facebook, LinkedIn, Twitter/X) **não rodam JS** — leem só o `<head>`
  estático. SPA puro = sem Open Graph, sem preview de link.
- Excesso de scripts terceiros derruba **Core Web Vitals** (LCP/INP/CLS), que é
  fator de ranking no Google **e** entra no Quality Score / Landing Page
  Experience dos Google Ads.

**O site Brasil te Ama NÃO cai nessa armadilha** — proposital:

| Risco do "React puro" (CSR) | Nosso caso (Next 15 SSG/SSR) |
|---|---|
| Conteúdo só após JS | ✅ HTML completo server-rendered (verificado via curl) |
| Sem OG p/ WhatsApp/Meta/LinkedIn | ✅ OG + Twitter + canonical no `<head>` server-rendered (`PublicLayout`, conteudo) |
| Sem mapa pro crawler | ✅ `public/robots.txt` + `src/pages/sitemap.xml.ts` (dinâmico) |
| Muitos scripts JS | ✅ hoje ~zero JS terceiro (só `useSiteEnhancements` leve) |

Conclusão: o problema relatado aplica-se a SPA; o Next SSR/SSG já contorna.

---

## 3. Checklist técnico de GO-LIVE (executar na Fase 5, com domínio de produção)

### 3.1 Domínio / URLs canônicas
- [ ] Definir domínio de produção (provável: `institutobrasilteama.org` — bate com
      e-mail/CNPJ no footer). Confirmar com o dono.
- [ ] Setar `NEXT_PUBLIC_SITE_URL=https://<dominio>` no ambiente de produção
      (usado por `src/lib/seo.ts` → canonical, OG, sitemap). Fallback atual já é
      `https://institutobrasilteama.org`.
- [ ] Atualizar a linha `Sitemap:` em `public/robots.txt` se o domínio for outro.
- [ ] Garantir redirect 301 de `www`→apex (ou vice-versa) e HTTPS forçado no
      Traefik (evita conteúdo duplicado / canonical split).

### 3.2 SEO on-page (ganhos pendentes)
- [ ] **JSON-LD structured data** no `<head>`: schema `NGO`/`Organization`
      (name, url, logo, sameAs[redes], address Brasília/DF, telefone, CNPJ via
      `identifier`). Ganho concreto para ONG. (não implementado ainda)
- [ ] Schema `BreadcrumbList` nas páginas internas e `Article` em
      `/conteudo/[slug]` (já temos OG `article:*` — falta o JSON-LD).
- [ ] `<meta name="robots" content="index,follow">` explícito (default já indexa).
- [ ] Imagem OG dedicada (1200×630) em vez do logo — melhora CTR de
      compartilhamento. Hoje usa `/assets/logo-principal.png`.

### 3.3 Tracking / Ads (instalar com disciplina)
- [ ] **Google Tag Manager** como container único; carregar via `next/script`
      `strategy="afterInteractive"`. Nada de scripts soltos.
- [ ] **GA4** dentro do GTM.
- [ ] **Meta Pixel** dentro do GTM + considerar **Conversions API** (server-side)
      — resiste a ad-blocker e tira peso do cliente.
- [ ] **Google Ads** tag/conversions via GTM.
- [ ] Consentimento (LGPD): banner de cookies + Consent Mode v2 antes de disparar
      pixels (a página Transparência já cita Política de Cookies "em breve").

### 3.4 Google Business Profile (GBP) — é à parte do site
- [ ] GBP é uma **ficha** (Maps/local), não JS do site. Manter **NAP consistente**
      (nome/endereço/telefone) entre GBP e o footer do site (já temos Brasília/DF,
      telefone, CNPJ). Linkar o site na ficha.

### 3.5 Verificação / submissão (pós-deploy)
- [ ] Google Search Console: verificar propriedade + enviar `sitemap.xml`.
- [ ] Bing Webmaster Tools (opcional).
- [ ] Rich Results Test (validar JSON-LD).
- [ ] Facebook Sharing Debugger + LinkedIn Post Inspector (validar OG; forçar
      re-scrape).
- [ ] PageSpeed Insights / Lighthouse: conferir Core Web Vitals em produção.

### 3.6 Performance (proteger CWV ao adicionar marketing)
- [ ] Todo script terceiro via `next/script` deferido (`afterInteractive`/`lazyOnload`).
- [ ] Imagens: avaliar migrar `<img>` → `next/image` nas páginas pesadas (hero,
      cards) para lazy-load + responsivo (hoje o corpo é HTML injetado com `<img>`).
- [ ] Fontes self-hosted já com `font-display: swap` ✅.

---

## 4. Como ATIVAR — agentes e ferramentas

### 4.1 Ativar os agentes AIOX (slash commands)

| Quando | Comando | Para quê |
|---|---|---|
| SEO on-page (meta, headings, JSON-LD, estrutura) | `/squad-design` | aplicar `seo-rules.md` + `seo-meta-checklist.md` nas páginas |
| Ad copy / tráfego pago | `/squad-copy` | criar copy de anúncios (Meta/Google), landing pages, workflow `wf-2-paid-traffic` |
| Estratégia de marketing / social / métricas | `/marketing-opes` | CMO define plano; `marketing-metrics` lê GA4; ideação IG/LI/YT |
| Posicionamento / marca | `/squad-brand` | mensagem-chave, tom, diferenciação |
| **Instrumentação técnica** (instalar GTM/GA4/Pixel/JSON-LD, sitemap, deploy) | `/devops` (Gage) ou `/dev` (Dex) | escrever o código e configurar infra |

> Dica de token economy: ative **um** squad por sessão dedicada (`/clear` antes),
> não todos juntos. Comece pelo `/devops` para a instrumentação, depois marketing.

### 4.2 Ativar as ferramentas de marketing (passo a passo)

Para cada uma: criar conta/propriedade → obter o ID → o **@devops/@dev** insere no
código (preferência: tudo via **GTM**, não scripts soltos) → validar.

1. **Google Tag Manager (GTM)** — container guarda-chuva
   - Criar container em tagmanager.google.com → pegar `GTM-XXXXXXX`.
   - @devops: adicionar via `next/script` `strategy="afterInteractive"` no `_app`
     ou `_document` (id em `NEXT_PUBLIC_GTM_ID`).
2. **Google Analytics 4 (GA4)**
   - Criar propriedade em analytics.google.com → `G-XXXXXXX`.
   - Configurar **dentro do GTM** (tag GA4 Configuration). Não inserir gtag solto.
3. **Meta Pixel + Conversions API (CAPI)**
   - Meta Events Manager → criar Pixel → `id`.
   - Pixel via GTM (client-side) **e** CAPI server-side (endpoint Next API route)
     para resistir a ad-blocker.
4. **Google Ads**
   - Conta Google Ads → tag de conversão → configurar no GTM. Linkar GA4↔Ads.
5. **Consent Mode v2 (LGPD)** — pré-requisito antes de disparar pixels
   - Banner de cookies + Consent Mode no GTM (negar por padrão até consentir).
   - Publicar a Política de Cookies (hoje "em breve" na página Transparência).
6. **Google Search Console (GSC)**
   - search.google.com/search-console → verificar domínio (DNS TXT ou tag) →
     enviar `https://<dominio>/sitemap.xml`.
7. **Bing Webmaster Tools** (opcional) — importar do GSC.
8. **Google Business Profile (GBP)**
   - business.google.com → criar/reivindicar ficha do Instituto → NAP idêntico ao
     footer (Brasília/DF, telefone, CNPJ) → linkar o site. Não envolve código.
9. **Validadores pós-deploy**
   - Rich Results Test (JSON-LD), Facebook Sharing Debugger + LinkedIn Post
     Inspector (forçar re-scrape do OG), PageSpeed Insights (CWV).

### 4.3 Sequência recomendada no go-live

1. `/devops` (sessão dedicada) → setar `NEXT_PUBLIC_SITE_URL`, redirect www/HTTPS,
   JSON-LD, scaffolding GTM/GA4/Pixel/CAPI + Consent Mode → deploy (Fase 5).
2. Pós-deploy: verificar GSC + enviar sitemap; validar OG nos debuggers; checar CWV.
3. `/marketing-opes` → estratégia + métricas (já lendo GA4).
4. `/squad-copy` + `/squad-design` → campanhas de Ads + SEO on-page contínuo.
5. GBP em paralelo (não depende de deploy).

### 4.4 Variáveis de ambiente a criar (produção)

```bash
NEXT_PUBLIC_SITE_URL=https://<dominio-producao>
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
# GA4/Ads/Pixel ficam DENTRO do GTM (sem env próprio), exceto CAPI:
META_CAPI_ACCESS_TOKEN=<token server-side, gitignored>
META_PIXEL_ID=<id>
```

---

## Estado atual (commit `ba57e1d`, master)
Já entregue na Fase 2: SSR/SSG, title/description únicos, canonical, OG+Twitter,
`robots.txt`, `sitemap.xml` dinâmico, `lang=pt-BR`, NAP no footer.
Pendente para go-live: itens 3.1–3.6 acima.

— Gage, deployando com confiança 🚀
