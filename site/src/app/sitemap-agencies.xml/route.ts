import { getAgencies } from '@/lib/queries';
import { slugifySegment } from '@/lib/format';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const agencies = await getAgencies();
  const lastmod = new Date().toISOString();
  const urls = agencies.flatMap((agency) => ([
    { loc: `${siteUrl}/agency/${slugifySegment(agency.name)}`, lastmod },
    { loc: `${siteUrl}/agency/${slugifySegment(agency.name)}/leaderboard`, lastmod },
  ]));

  return xmlResponse(buildUrlSet(urls));
}
