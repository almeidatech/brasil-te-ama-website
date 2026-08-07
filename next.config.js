/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  // PT na raiz; demais idiomas em subpastas (/en, /es, /it, /fr). localeDetection
  // desligado para não redirecionar visitantes por header Accept-Language.
  i18n: {
    locales: ['pt', 'en', 'es', 'it', 'fr'],
    defaultLocale: 'pt',
    localeDetection: false,
  },
  async redirects() {
    // A página /lideranca foi descontinuada (redundante) — o conteúdo de
    // liderança vive na seção #lideranca da página Sobre. 301 preserva
    // qualquer link/bookmark antigo e a autoridade de SEO.
    return [
      { source: '/lideranca', destination: '/sobre#lideranca', permanent: true },
    ];
  },
  async headers() {
    const oneYearImmutable = 'public, max-age=31536000, immutable';
    const rules = [
      { source: '/assets/fonts/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/css/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/icons/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/img/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
    ];
    if (process.env.NODE_ENV === 'production') {
      const isStaging = process.env.NEXT_PUBLIC_SITE_URL?.includes('alcgestao.com.br');
      if (isStaging) {
        rules.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] });
      }
    }
    return rules;
  },
};

const sentryWebpackPluginOptions = {
  org: 'olmedatech-negocios-digitais',
  project: 'brasil-te-ama',
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
};

module.exports = withSentryConfig(withMDX(nextConfig), sentryWebpackPluginOptions);
