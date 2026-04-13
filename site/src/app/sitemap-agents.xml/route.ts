import { getAllAgentRefs } from '@/lib/queries';
import { buildUrlSet, getSitemapContext, xmlResponse } from '@/lib/sitemap';

export async function GET(request: Request) {
  const { variant, siteUrl } = getSitemapContext(request);
  if (variant !== 'intel') {
    return xmlResponse(buildUrlSet([]));
  }

  const agents = await getAllAgentRefs();
  return xmlResponse(buildUrlSet(agents.map((agent) => ({
    loc: `${siteUrl}/agent/${agent.cea_number}`,
    lastmod: agent.updated_at || undefined,
  }))));
}
