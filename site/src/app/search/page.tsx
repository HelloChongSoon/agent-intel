import { getAgentTransactionSummaries, searchAgents } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';
import Breadcrumbs from '@/components/Breadcrumbs';
import SearchBar from '@/components/SearchBar';
import SearchResultLink from '@/components/SearchResultLink';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: 'Search Singapore Property Agents by Name or CEA Number',
    description: 'Find any registered Singapore property agent by name or CEA registration number. View transaction history, agency details, and rankings.',
    path: '/search',
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || '';
  const results = query ? await searchAgents(query, 50) : [];
  const transactionSummaries = results.length
    ? await getAgentTransactionSummaries(results.map((agent) => agent.cea_number))
    : {};
  const homeUrl = await getRequestAbsoluteUrl('/');
  const searchUrl = await getRequestAbsoluteUrl('/search');
  const url = await getRequestAbsoluteUrl(`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: query ? `Search results for ${query}` : 'Search Agents',
    url,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Search', item: searchUrl },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: results.length,
      itemListElement: results.map((agent, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${homeUrl.replace(/\/$/, '')}/agent/${agent.cea_number}`,
        item: {
          '@type': 'Person',
          name: agent.name,
          identifier: agent.cea_number,
          worksFor: agent.agency ? { '@type': 'Organization', name: agent.agency } : undefined,
        },
      })),
    },
  };

  return (
    <div className="space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">Search Agents</h1>
        <p className="mt-2 text-lg text-zinc-400">Find profiles by name or CEA number.</p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500">
          Use search when you already know an agent&apos;s name, spelling, or CEA number. For discovery, use the leaderboard or property-type pages instead.
        </p>
      </div>
      <SearchBar />

      {query && (
        <p className="text-sm text-zinc-400">
          {results.length} results for &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">CEA Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Agency</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {results.map((agent) => (
                    <tr key={agent.cea_number} className="transition hover:bg-zinc-900/60">
                      <td className="px-6 py-4">
                        <SearchResultLink ceaNumber={agent.cea_number} name={agent.name} agency={agent.agency} query={query} />
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{agent.cea_number}</td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{agent.agency || '—'}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-zinc-100">
                        {transactionSummaries[agent.cea_number]?.count ?? agent.total_transactions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="divide-y divide-zinc-900 md:hidden">
            {results.map((agent) => (
              <div key={agent.cea_number} className="space-y-4 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <SearchResultLink ceaNumber={agent.cea_number} name={agent.name} agency={agent.agency} query={query} />
                    <div className="mt-1 text-xs text-zinc-500">{agent.cea_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Transactions</div>
                    <div className="mt-1 text-base font-semibold text-zinc-100">
                      {transactionSummaries[agent.cea_number]?.count ?? agent.total_transactions}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Agency</div>
                  <div className="mt-1 text-sm text-zinc-300">{agent.agency || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
