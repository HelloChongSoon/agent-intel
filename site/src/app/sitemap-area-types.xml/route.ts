import { getAreaPropertyTypeCombos } from '@/lib/queries';
import { slugifySegment } from '@/lib/format';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const combos = await getAreaPropertyTypeCombos(5);
  const lastmod = new Date().toISOString();
  const urls = combos.map((combo) => ({
    loc: `${siteUrl}/area/${slugifySegment(combo.area)}/${slugifySegment(combo.propertyType)}`,
    lastmod,
  }));

  return xmlResponse(buildUrlSet(urls));
}
