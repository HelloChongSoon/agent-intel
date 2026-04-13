import { buildSitemapIndex, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);

  if (variant === 'cats') {
    return xmlResponse(buildSitemapIndex([]));
  }

  const sitemapUrls = variant === 'root'
    ? [`${siteUrl}/sitemap-core.xml`]
    : [
        `${siteUrl}/sitemap-core.xml`,
        `${siteUrl}/sitemap-guides.xml`,
        `${siteUrl}/sitemap-taxonomies.xml`,
        `${siteUrl}/sitemap-agencies.xml`,
        `${siteUrl}/sitemap-agents.xml`,
      ];

  return xmlResponse(buildSitemapIndex(sitemapUrls));
}
