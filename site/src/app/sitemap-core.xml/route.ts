import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  const lastmod = new Date().toISOString();

  if (variant === 'cats') {
    return xmlResponse(buildUrlSet([]));
  }

  const paths = variant === 'root'
    ? ['/', '/about', '/contact', '/methodology', '/products/intel']
    : ['/', '/leaderboard', '/movements', '/search', '/methodology', '/data-sources', '/contact', '/privacy-policy', '/terms-of-use', '/disclaimer'];

  return xmlResponse(buildUrlSet(paths.map((path) => ({
    loc: `${siteUrl}${path}`,
    lastmod,
  }))));
}
