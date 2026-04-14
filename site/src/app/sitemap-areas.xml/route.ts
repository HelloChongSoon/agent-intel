import { getAreas } from '@/lib/queries';
import { slugifySegment } from '@/lib/format';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const areas = await getAreas(3);
  const lastmod = new Date().toISOString();
  const urls = areas.map((area) => ({
    loc: `${siteUrl}/area/${slugifySegment(area.name)}`,
    lastmod,
  }));

  return xmlResponse(buildUrlSet(urls));
}
