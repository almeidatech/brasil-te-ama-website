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
  async headers() {
    const oneYearImmutable = 'public, max-age=31536000, immutable';
    const rules = [
      { source: '/assets/fonts/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/css/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/icons/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/img/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
    ];
    // Staging guard: when deploying to the temporary subdomain we block all
    // indexing so the staging URL never competes with the official domain.
    // The official-domain deploy simply omits NEXT_PUBLIC_NOINDEX → header gone.
    if (process.env.NEXT_PUBLIC_NOINDEX === 'true') {
      rules.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] });
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
