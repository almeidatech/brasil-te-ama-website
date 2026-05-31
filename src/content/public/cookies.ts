// Página legal — escrita à mão (sem fonte em docs/, não é tocada pelo convert-pages).
// Conteúdo fiel ao documento oficial: docs/legalDocs/politica_cookies_*.pdf (v1.0, abr/2026).
// NOTA: o documento original assume stack WordPress + Google Analytics + plugin CookieYes.
// O site real é Next.js e (até agora) sem GA/banner — conteúdo precisa ser reconciliado com a
// stack pela direção/jurídico. A Seção 9 ("Nota ao Desenvolvedor", interna/WordPress) foi omitida.
// O footer vem do componente <Footer/> renderizado pelo PublicLayout.
const page = {
  title: 'Política de Cookies — Instituto Brasil Te Ama',
  description:
    'O que são cookies, quais o site do Instituto Brasil Te Ama utiliza e como você pode gerenciá-los, em conformidade com a LGPD.',
  html: `
<section class="subhero">
  <div class="container">
    <div class="subhero__inner fade-up">
      <span class="eyebrow eyebrow--bordo">Cookies</span>
      <h1 class="subhero__title">Política de <em>Cookies</em></h1>
      <p class="subhero__sub" style="font-size:18px;">O que são cookies, quais utilizamos e como você controla suas preferências — em conformidade com a LGPD.</p>
    </div>
  </div>
</section>

<section class="section section--white">
  <div class="container">
    <div class="post-body">
      <p style="font-size:14px;color:var(--text-gray);">Razão Social: Instituto Brasil Te Ama · CNPJ: 49.458.362/0001-10 · Site: institutobrasilteama.org · Contato: <a href="mailto:atendimento@institutobrasilteama.org">atendimento@institutobrasilteama.org</a><br>Versão 1.0 · Última atualização: abril de 2026 · Vigência a partir da data de publicação do site.</p>

      <h2>1. O que são Cookies</h2>
      <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou celular) quando você acessa um site. Eles permitem que o site reconheça seu navegador em visitas futuras, melhore sua experiência de navegação e colete informações sobre o uso do site.</p>
      <p>Cookies não são programas, não podem executar ações no seu dispositivo e não acessam outros arquivos armazenados fora do navegador.</p>

      <h2>2. Tipos de Cookies Utilizados</h2>
      <h3>2.1 Cookies estritamente necessários</h3>
      <p>Indispensáveis para o funcionamento básico do site. Sem eles, funcionalidades essenciais — como os formulários de contato e o banner de consentimento de cookies — não funcionariam corretamente. Incluem cookies de sessão do painel administrativo, registro de consentimento de cookies (LGPD) e proteção contra CSRF. Não requerem consentimento prévio.</p>
      <h3>2.2 Cookies de desempenho e analytics</h3>
      <p>Coletam informações agregadas sobre como os visitantes usam o site — páginas mais acessadas, tempo de permanência, origem do acesso e dispositivo utilizado. Os dados são tratados de forma anônima e não permitem a identificação de visitantes individuais. Duração típica: até 13 meses. Requerem consentimento prévio — só são ativados após o visitante aceitar cookies de analytics no banner de consentimento.</p>
      <h3>2.3 Cookies funcionais</h3>
      <p>Permitem que o site lembre preferências do visitante — como idioma ou configurações de exibição. Requerem consentimento prévio.</p>
      <h3>2.4 Cookies de terceiros</h3>
      <p>O site pode carregar conteúdo de plataformas externas — como vídeos incorporados (YouTube), mapas ou botões de redes sociais (Instagram) — que podem instalar seus próprios cookies. O Instituto não controla o comportamento desses cookies de terceiros; consulte as políticas de privacidade das respectivas plataformas.</p>

      <h2>3. Finalidade de cada Cookie</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 18px;">
        <thead>
          <tr style="text-align:left;border-bottom:2px solid var(--border);">
            <th style="padding:8px 10px;">Cookie / Origem</th><th style="padding:8px 10px;">Tipo</th><th style="padding:8px 10px;">Finalidade</th><th style="padding:8px 10px;">Duração</th><th style="padding:8px 10px;">Consentimento</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;">Sessão (admin)</td><td style="padding:8px 10px;">Necessário</td><td style="padding:8px 10px;">Autenticação administrativa</td><td style="padding:8px 10px;">Sessão</td><td style="padding:8px 10px;">Não</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;">Consentimento (LGPD)</td><td style="padding:8px 10px;">Necessário</td><td style="padding:8px 10px;">Registro do consentimento</td><td style="padding:8px 10px;">1 ano</td><td style="padding:8px 10px;">Não</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;">_ga (Analytics)</td><td style="padding:8px 10px;">Analytics</td><td style="padding:8px 10px;">Identificação única de sessão</td><td style="padding:8px 10px;">2 anos</td><td style="padding:8px 10px;">Sim</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;">_gid (Analytics)</td><td style="padding:8px 10px;">Analytics</td><td style="padding:8px 10px;">Distinção de usuários</td><td style="padding:8px 10px;">24 horas</td><td style="padding:8px 10px;">Sim</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:8px 10px;">_gat (Analytics)</td><td style="padding:8px 10px;">Analytics</td><td style="padding:8px 10px;">Controle de taxa de requisições</td><td style="padding:8px 10px;">1 minuto</td><td style="padding:8px 10px;">Sim</td></tr>
          <tr><td style="padding:8px 10px;">Instagram / YouTube</td><td style="padding:8px 10px;">Terceiros</td><td style="padding:8px 10px;">Conteúdo incorporado</td><td style="padding:8px 10px;">Variável</td><td style="padding:8px 10px;">Sim</td></tr>
        </tbody>
      </table>
      <p style="font-size:14px;color:var(--text-gray);">Nota: a lista de cookies poderá ser atualizada conforme mudanças na plataforma ou nas ferramentas utilizadas. Consulte sempre a versão vigente desta Política no site.</p>

      <h2>4. Como Gerenciar os Cookies</h2>
      <h3>4.1 Banner de consentimento</h3>
      <p>Na primeira visita, é exibido um banner de consentimento. O visitante pode aceitar todos os cookies, configurar suas preferências por categoria ou rejeitar cookies não essenciais (mantendo apenas os estritamente necessários). O consentimento pode ser revogado a qualquer momento nas configurações de cookies no rodapé do site.</p>
      <h3>4.2 Configurações do navegador</h3>
      <p>Você pode configurar seu navegador para bloquear ou excluir cookies. Bloquear cookies estritamente necessários pode comprometer formulários e outras funcionalidades. Consulte a ajuda do seu navegador: Google Chrome (Configurações &gt; Privacidade e segurança &gt; Cookies), Firefox (Privacidade e Segurança &gt; Cookies e dados do site), Safari (Preferências &gt; Privacidade) e Microsoft Edge (Cookies e permissões do site).</p>
      <h3>4.3 Opt-out do Google Analytics</h3>
      <p>Para desativar especificamente o rastreamento do Google Analytics, instale o complemento de desativação disponível em <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">tools.google.com/dlpage/gaoptout</a>.</p>

      <h2>5. Cookies e Dados Pessoais</h2>
      <p>Alguns cookies coletam dados que, isoladamente ou em combinação com outras informações, podem ser considerados dados pessoais nos termos da LGPD. Nesses casos, o tratamento está sujeito à nossa <a href="/privacidade">Política de Privacidade</a>. O Instituto não utiliza cookies para identificar individualmente visitantes anônimos nem para fins publicitários ou de retargeting.</p>

      <h2>6. Retenção e Exclusão</h2>
      <p>Os cookies são armazenados pelo período indicado na tabela da Seção 3. Ao expirar, são automaticamente excluídos pelo navegador. O visitante pode excluí-los manualmente a qualquer momento pelas configurações do navegador ou pelo painel de consentimento do site.</p>

      <h2>7. Atualizações desta Política</h2>
      <p>Esta Política poderá ser atualizada periodicamente, especialmente em caso de mudanças na plataforma tecnológica, nas ferramentas utilizadas ou na legislação aplicável. A versão vigente estará sempre disponível no rodapé do site, com a data da última atualização.</p>

      <h2>8. Contato</h2>
      <p>E-mail: <a href="mailto:atendimento@institutobrasilteama.org">atendimento@institutobrasilteama.org</a><br>Telefones: (61) 3321-2535 · (61) 98498-1100<br>Horário: segunda a sexta, 9h às 18h (horário de Brasília).</p>
    </div>
  </div>
</section>
`,
};
export default page;
