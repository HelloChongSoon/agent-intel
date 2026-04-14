import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawPosthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

function normalizePosthogApiHost(host) {
  try {
    return new URL(host);
  } catch {
    return new URL('https://us.i.posthog.com');
  }
}

function getPosthogAssetsHost(apiHostUrl) {
  const match = apiHostUrl.hostname.match(/^([a-z0-9-]+)\.i\.posthog\.com$/i);
  if (match) {
    return `https://${match[1]}-assets.i.posthog.com`;
  }

  return apiHostUrl.origin;
}

const posthogApiHost = normalizePosthogApiHost(rawPosthogHost);
const posthogAssetsHost = getPosthogAssetsHost(posthogApiHost);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${posthogApiHost.origin}/:path*`,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
