import { getLeaderboardFilterOptions, getLatestLeaderboardYear } from '@/lib/queries';
import { slugifySegment } from '@/lib/format';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const year = await getLatestLeaderboardYear();
  const filters = await getLeaderboardFilterOptions(year);
  const lastmod = new Date().toISOString();
  const urls = [
    ...filters.propertyTypes.map((value) => ({
      loc: `${siteUrl}/property-type/${slugifySegment(value)}`,
      lastmod,
    })),
    ...filters.transactionTypes.map((value) => ({
      loc: `${siteUrl}/transaction-type/${slugifySegment(value)}`,
      lastmod,
    })),
  ];

  return xmlResponse(buildUrlSet(urls));
}
