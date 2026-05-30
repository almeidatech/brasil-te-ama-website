# Templates de e-mail — Instituto Brasil te Ama

Templates transacionais no padrão do pet-studio: **hospedados no ZeptoMail** e
enviados via `POST /v1.1/email/template` com `template_key` + `merge_info`
(o app só passa as variáveis — o HTML/design vive no painel do ZeptoMail).

## Marca (paleta REAL — conferida em `src/styles/main.css`)

| Token | Hex | Uso no e-mail |
|---|---|---|
| Bordô | `#8E1F2D` | primária, títulos, botão, régua do topo |
| Vinho | `#A12836` | hover/variações |
| Dourado | `#B79A63` | acento (régua fina, links no rodapé) |
| Marfim | `#FBF9F9` | fundo da página |
| Branco | `#FFFFFF` | card |
| Grafite | `#222222` | texto |
| Cinza texto | `#7B726F` | texto secundário |
| Footer | `#3A3F47` | rodapé escuro |
| Borda | `#E5DDDE` | borda do card |

Tipografia: **Lora** (títulos) + **Inter** (corpo) no site → em e-mail usamos
fallbacks à prova de cliente: `Georgia, serif` (títulos) e `Arial, Helvetica, sans-serif` (corpo).

> ⚠️ A memória/briefing dizia "Floresta Verde #0E6B3B / Amor Vermelho #C62B2B / Playfair" — **incorreto/stale**. As categorias-semente criadas na Fase 4 usam essas cores off-brand; recomendo o @dev recolorir para tokens da marca (bordô/dourado/mauve) em `/admin/categories`.

## Mapa: caso → template_key → merge fields

Dois tipos por fluxo: **ACK** (confirmação ao remetente, voz acolhedora) e **NOTIFY** (aviso interno à equipe).

| form_type | ACK template_key | NOTIFY template_key | merge fields (ACK) |
|---|---|---|---|
| `contato` | `bta_ack_contato` | `bta_notify_interno` | `first_name` |
| `parceria` | `bta_ack_parceria` | `bta_notify_interno` | `first_name` |
| `imprensa` | `bta_ack_imprensa` | `bta_notify_interno` | `first_name` |
| `ong` | `bta_ack_ong` | `bta_notify_interno` | `first_name`, `org_name` |
| `voluntario` | `bta_ack_voluntario` | `bta_notify_interno` | `first_name` |

`first_name`: passar o primeiro nome do remetente; se vazio, o app deve mandar um fallback amigável (ex.: `"tudo bem"`) para não gerar "Olá, .". `org_name` (só `ong`): nome da organização (campo obrigatório no form → sempre presente).

> `duvidas` e `selo` (válidos no CHECK do banco, ainda sem form) podem reusar `bta_ack_contato` por enquanto.

### Merge fields do NOTIFY (um template para todos os casos)
`form_label`, `name`, `email`, `phone`, `submitted_at`, `details`

- `details` = string única com uma linha por campo do payload (ex.: `"Assunto: Parceria\nMensagem: ..."`). O template renderiza num bloco com `white-space:pre-line`, então os `\n` viram quebras de linha — resolve o payload dinâmico sem precisar de loop no template.

## Logo & URLs absolutas

Header de todos os templates usa a logo `https://institutobrasilteama.org/assets/logo-principal.png`
(arquivo `public/assets/logo-principal.png`, 671×549, servido também em staging
`https://brasilteama.alcgestao.com.br/assets/logo-principal.png` → HTTP 200). Tamanho pequeno:
`width:56px` nos ACK e `32px` no notify, com `alt="Instituto Brasil te Ama"` (e-mail bloqueia
imagem por padrão → o `alt` + o wordmark de texto garantem a marca mesmo com imagens off).

> ⚠️ Todas as URLs absolutas (links + logo) assumem o **domínio oficial** `institutobrasilteama.org`.
> Para testar os templates ANTES da migração de domínio, troque o host para
> `brasilteama.alcgestao.com.br` (staging, já no ar). Pós go-live, nada a mudar.

## Arquivos

- `ack-contato.html`, `ack-parceria.html`, `ack-imprensa.html`, `ack-ong.html`, `ack-voluntario.html` — confirmações ao remetente (1 por caso)
- `notify-interno.html` — aviso único à equipe (todos os casos)

## Como o @dev (Dex) liga isso (`lib/zeptomail.ts`)

Hoje o `lib/zeptomail.ts` manda HTML inline via `/v1.1/email`. Para o padrão pet-studio,
adicionar uma função `sendTemplate(templateKey, to, mergeInfo, replyTo?)` que chama
`/v1.1/email/template`. No `/api/contact`, após salvar a submission:

```ts
// 1) ACK ao remetente (template por caso)
await sendTemplate(ACK_TEMPLATE[form_type], email, {
  first_name: firstName(name), org_name: name, outlet: payload['Veículo de comunicação'],
});
// 2) NOTIFY interno (template único)
await sendTemplate('bta_notify_interno', process.env.CONTACT_TO_EMAIL, {
  form_label, name, email, phone, submitted_at, details: detailsText(payload),
}, { address: email, name });
```

Mantém a degradação graciosa: se `ZEPTO_API_TOKEN`/remetente não setados → pula.

## Como o dono carrega no ZeptoMail

1. ZeptoMail → **Mail Agents** → *Template Gallery* → **Add Template** (HTML).
2. Colar o HTML de cada arquivo, salvar e copiar o **template_key** gerado.
3. Conferir os merge fields (`{{first_name}}` etc.) no preview com dados de teste.
4. Garantir o remetente **verificado** (domínio/endereço) em `CONTACT_FROM_EMAIL`.
5. Passar os `template_key` ao @dev para mapear em `ACK_TEMPLATE`.
