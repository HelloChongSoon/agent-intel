import { guides } from '@/lib/content';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const lastmod = new Date().toISOString();
  return xmlResponse(buildUrlSet(guides.map((guide) => ({
    loc: `${siteUrl}/guides/${guide.slug}`,
    lastmod,
  }))));
}
