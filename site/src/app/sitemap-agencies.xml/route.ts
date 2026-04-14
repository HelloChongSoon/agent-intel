import { getAgencies, getAreas, getLeaderboardFilterOptions, getLatestLeaderboardYear } from '@/lib/queries';
import { slugifySegment } from '@/lib/format';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const [agencies, areas, year] = await Promise.all([
    getAgencies(),
    getAreas(3),
    getLatestLeaderboardYear(),
  ]);
  const filters = await getLeaderboardFilterOptions(year);
  const lastmod = new Date().toISOString();

  // Top 30 agencies get area and property-type sub-pages
  const topAgencies = agencies.slice(0, 30);
  const topAreas = areas.slice(0, 20);

  const urls = agencies.flatMap((agency) => {
    const agencySlug = slugifySegment(agency.name);
    const base = [
      { loc: `${siteUrl}/agency/${agencySlug}`, lastmod },
      { loc: `${siteUrl}/agency/${agencySlug}/leaderboard`, lastmod },
    ];

    if (!topAgencies.includes(agency)) return base;

    const areaUrls = topAreas.map((area) => ({
      loc: `${siteUrl}/agency/${agencySlug}/area/${slugifySegment(area.name)}`,
      lastmod,
    }));

    const typeUrls = filters.propertyTypes.map((pt) => ({
      loc: `${siteUrl}/agency/${agencySlug}/property-type/${slugifySegment(pt)}`,
      lastmod,
    }));

    return [...base, ...areaUrls, ...typeUrls];
  });

  return xmlResponse(buildUrlSet(urls));
}
