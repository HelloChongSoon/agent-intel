import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import LeaderboardFilters from '@/components/LeaderboardFilters';
import LeaderboardAgentLink from '@/components/LeaderboardAgentLink';
import {
  getAgencies,
  getAvailableLeaderboardYears,
  getLeaderboard,
  getLeaderboardFilterOptions,
  getLatestLeaderboardYear,
} from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatLabel, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  searchParams: Promise<{ page?: string; year?: string; agency?: string; propertyType?: string; transactionType?: string }>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: 'Top Property Agent Leaderboard Singapore 2026',
    description: 'Ranked list of Singapore property agents by transaction volume. Filter by agency, property type, and deal type with yearly comparisons.',
    path: '/leaderboard',
  });
}

function TrophyIcon({ rank }: { rank: number }) {
  const color =
    rank === 1 ? '#EAB308' :
    rank === 2 ? '#93C5FD' :
    rank === 3 ? '#FB923C' :
    '#52525B';

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M8 4h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4Z" stroke={color} strokeWidth="1.7" />
      <path d="M9 17h6M10 20h4M12 11v6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 6H5a1 1 0 0 0-1 1c0 2.2 1.8 4 4 4M16 6h3a1 1 0 0 1 1 1c0 2.2-1.8 4-4 4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const requestedYear = params.year ? parseInt(params.year, 10) : undefined;
  const agency = params.agency || undefined;
  const propertyType = params.propertyType || undefined;
  const transactionType = params.transactionType || undefined;
  const pageSize = 25;
  const [availableYears, agencies] = await Promise.all([
    getAvailableLeaderboardYears(),
    getAgencies(),
  ]);
  const fallbackYear = availableYears[0] ?? await getLatestLeaderboardYear();
  const year = requestedYear && availableYears.includes(requestedYear) ? requestedYear : fallbackYear;
  const { propertyTypes, transactionTypes } = await getLeaderboardFilterOptions(year);
  const activePropertyType = propertyType && propertyTypes.includes(propertyType) ? propertyType : undefined;
  const activeTransactionType = transactionType && transactionTypes.includes(transactionType) ? transactionType : undefined;

  const { rows, hasMore, total: totalAgents } = await getLeaderboard({
    year,
    page,
    pageSize,
    agency,
    propertyType: activePropertyType,
    transactionType: activeTransactionType,
  });

  const filterParams: Record<string, string> = { year: String(year) };
  if (agency) filterParams.agency = agency;
  if (activePropertyType) filterParams.propertyType = activePropertyType;
  if (activeTransactionType) filterParams.transactionType = activeTransactionType;
  const showingFrom = rows.length === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const showingTo = rows.length === 0 ? 0 : ((page - 1) * pageSize) + rows.length;
  const homeUrl = await getRequestAbsoluteUrl('/');
  const leaderboardUrl = await getRequestAbsoluteUrl('/leaderboard');
  const url = await getRequestAbsoluteUrl(`/leaderboard?${new URLSearchParams(filterParams).toString()}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Agent Leaderboard ${year}`,
    url,
    description: 'Ranked Singapore property agents by transaction volume.',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Leaderboard', item: leaderboardUrl },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: rows.length,
      itemListElement: rows.map((agent, index) => ({
        '@type': 'ListItem',
        position: showingFrom + index,
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
    <div className="min-h-[calc(100vh-97px)] py-2 text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mb-8 grid gap-6 xl:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-start">
        <div className="max-w-2xl pt-1">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Leaderboard' }]} />
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
              Agent Leaderboard
          </h1>
          <p className="mt-2 text-base text-zinc-400 sm:text-lg">
            Top agents by transaction volume in Singapore
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-500 sm:mt-4">
            Start here for broad discovery, then switch to agency, property-type, or deal-type pages when you want a more relevant comparison.
          </p>
        </div>

        <LeaderboardFilters
          years={availableYears}
          agencies={agencies}
          propertyTypes={propertyTypes}
          transactionTypes={transactionTypes}
          selectedYear={year}
          selectedAgency={agency}
          selectedPropertyType={activePropertyType}
          selectedTransactionType={activeTransactionType}
        />
      </div>

      {/* ── Top 10 Chart ─────────────────────────────────── */}
      {page === 1 && (
        <section className="mb-6 overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-100">Top 10 Agents by Transaction Volume</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {year}{agency ? ` · ${agency}` : ''}{activePropertyType ? ` · ${formatLabel(activePropertyType)}` : ''}{activeTransactionType ? ` · ${formatLabel(activeTransactionType)}` : ''}
            </p>
          </div>
          {rows.length > 0 ? (
            <div className="space-y-2.5">
              {rows.slice(0, 10).map((agent, i) => {
                const maxTxn = rows[0].transactions;
                const pct = maxTxn > 0 ? Math.round((agent.transactions / maxTxn) * 100) : 0;
                return (
                  <div key={agent.cea_number} className="group flex items-center gap-3">
                    <div className="w-6 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-500">
                      {agent.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="relative h-8 overflow-hidden rounded-lg bg-zinc-800/40">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${i === 0 ? 'bg-gradient-to-r from-blue-600 to-cyan-400' : i < 3 ? 'bg-gradient-to-r from-blue-600/80 to-blue-400/60' : 'bg-blue-500/30'}`}
                          style={{ width: `${Math.max(8, pct)}%` }}
                        />
                        <div className="relative z-10 flex h-full items-center justify-between px-3">
                          <Link href={`/agent/${agent.cea_number}`} className="truncate text-xs font-medium text-zinc-100 transition hover:text-white">
                            {agent.name}
                          </Link>
                          <span className="ml-2 shrink-0 text-xs font-bold tabular-nums text-zinc-200">{agent.transactions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="mb-3 h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
              <p className="text-sm text-zinc-500">No matching transactions for this filter combination.</p>
              <p className="mt-1 text-xs text-zinc-600">Try removing a filter to broaden the results.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Agent Rankings Table ────────────────────────── */}
      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="border-b border-zinc-800 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">Agent Rankings</h2>
              <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">Top 1%</span>
            </div>
            <p className="text-base text-zinc-400">
              Top 1% of {totalAgents > 0 ? totalAgents.toLocaleString() : ''} agents ranked by transactions in {year}
              {rows.length > 0 && <span> — showing {showingFrom.toLocaleString()}-{showingTo.toLocaleString()}</span>}
              {agency && <span> for {agency}</span>}
              {activePropertyType && <span> matching {activePropertyType.replaceAll('_', ' ')}</span>}
              {activeTransactionType && <span> via {activeTransactionType.replaceAll('_', ' ')}</span>}
            </p>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="w-28 px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Rank</th>
                <th className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Name</th>
                <th className="w-64 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Agency</th>
                <th className="w-40 px-8 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((agent) => (
                <tr key={agent.cea_number} className="border-b border-zinc-900/80 transition hover:bg-zinc-900/70">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3 text-xl font-semibold text-white">
                      <TrophyIcon rank={agent.rank} />
                      <span>{agent.rank}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <LeaderboardAgentLink ceaNumber={agent.cea_number} name={agent.name} agency={agent.agency} rank={agent.rank} />
                    <div className="mt-1 text-sm text-zinc-500">{agent.cea_number}</div>
                  </td>
                  <td className="px-6 py-4 text-base text-zinc-400">
                    {agent.agency || 'Independent'}
                  </td>
                  <td className="px-8 py-4 text-right text-xl font-semibold text-white">
                    {agent.transactions}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-base text-zinc-500">
                    No agents found for this filter set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="divide-y divide-zinc-900 md:hidden">
          {rows.map((agent) => (
            <div key={agent.cea_number} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TrophyIcon rank={agent.rank} />
                    <span className="text-base font-semibold text-white">#{agent.rank}</span>
                  </div>
                  <div className="mt-2">
                    <LeaderboardAgentLink ceaNumber={agent.cea_number} name={agent.name} agency={agent.agency} rank={agent.rank} />
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{agent.cea_number}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-semibold text-white">{agent.transactions}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Txns</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-zinc-400">{agent.agency || 'Independent'}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="px-5 py-16 text-center text-base text-zinc-500">
              No agents found for this filter set.
            </div>
          )}
        </div>

        <div className="px-6 pb-8 pt-6 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/leaderboard?${new URLSearchParams({ ...filterParams, page: String(page - 1) }).toString()}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Previous
              </Link>
            )}
            <span className="px-3 py-2 text-sm text-zinc-500">Page {page}</span>
            {hasMore && (
              <Link
                href={`/leaderboard?${new URLSearchParams({ ...filterParams, page: String(page + 1) }).toString()}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Agency Pages + Ranking Slices ──────────────── */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Top agency pages</h2>
          <p className="mt-2 text-sm text-zinc-500">Compare individual leaders inside the biggest agencies instead of relying on brand alone.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {agencies.slice(0, 6).map((agencyOption) => (
              <Link
                key={agencyOption.name}
                href={`/agency/${slugifySegment(agencyOption.name)}`}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
              >
                {agencyOption.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Explore ranking slices</h2>
          <p className="mt-2 text-sm text-zinc-500">These pages are easier to compare when your transaction is already specific.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {propertyTypes.slice(0, 5).map((propertyTypeValue) => (
              <Link
                key={propertyTypeValue}
                href={`/property-type/${slugifySegment(propertyTypeValue)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(propertyTypeValue)}
              </Link>
            ))}
            {transactionTypes.slice(0, 4).map((transactionTypeValue) => (
              <Link
                key={transactionTypeValue}
                href={`/transaction-type/${slugifySegment(transactionTypeValue)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(transactionTypeValue)}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
