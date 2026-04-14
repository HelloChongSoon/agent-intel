import Link from 'next/link';
import { getAgentTransactionSummaries, searchAgents } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';
import SearchBar from '@/components/SearchBar';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: 'Search agents',
    description: 'Search PropNext Intel for Singapore property agents by name or CEA number.',
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
          <table className="w-full">
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
                    <Link href={`/agent/${agent.cea_number}`} className="text-sm font-medium text-zinc-100 transition hover:text-white">
                      {agent.name}
                    </Link>
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
      )}
    </div>
  );
}
