import { getCanonicalHost, getVariantForHost, normalizeHost } from '@/lib/hosts';

export function getSitemapContext(request: Request) {
  const url = new URL(request.url);
  const host = normalizeHost(request.headers.get('x-forwarded-host') || url.host);
  const variant = getVariantForHost(host);
  const siteUrl = `https://${getCanonicalHost(variant)}`;

  return { variant, siteUrl };
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export function buildUrlSet(urls: Array<{ loc: string; lastmod?: string }>) {
  const body = urls
    .map((url) => [
      '<url>',
      `<loc>${url.loc}</loc>`,
      url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : '',
      '</url>',
    ].filter(Boolean).join(''))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndex(urls: string[]) {
  const body = urls
    .map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
