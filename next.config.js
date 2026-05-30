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
    return [
      { source: '/assets/fonts/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/css/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/icons/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/assets/img/:path*',   headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: oneYearImmutable }] },
    ];
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
