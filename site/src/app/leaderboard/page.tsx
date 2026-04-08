import Link from 'next/link';
import LeaderboardFilters from '@/components/LeaderboardFilters';
import LeaderboardPagination from '@/components/LeaderboardPagination';
import {
  getAgencies,
  getAvailableLeaderboardYears,
  getLeaderboard,
  getLeaderboardFilterOptions,
  getLatestLeaderboardYear,
} from '@/lib/queries';

interface Props {
  searchParams: Promise<{ page?: string; year?: string; agency?: string; propertyType?: string; transactionType?: string }>;
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

  const { rows, total } = await getLeaderboard({
    year,
    page,
    pageSize,
    agency,
    propertyType: activePropertyType,
    transactionType: activeTransactionType,
  });
  const totalPages = Math.ceil(total / pageSize);

  const filterParams: Record<string, string> = { year: String(year) };
  if (agency) filterParams.agency = agency;
  if (activePropertyType) filterParams.propertyType = activePropertyType;
  if (activeTransactionType) filterParams.transactionType = activeTransactionType;
  const showingFrom = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="min-h-[calc(100vh-97px)] py-2 text-zinc-100">
      <div className="mb-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-start">
        <div className="max-w-2xl pt-1">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Agent Leaderboard
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            Top agents by transaction volume in Singapore
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

      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="border-b border-zinc-800 px-6 py-6 md:px-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-semibold text-white">Agent Rankings</h2>
            <p className="text-base text-zinc-400">
              Showing {showingFrom.toLocaleString()}-{showingTo.toLocaleString()} of {total.toLocaleString()} agents in {year}
              {agency && <span> for {agency}</span>}
              {activePropertyType && <span> matching {activePropertyType.replaceAll('_', ' ')}</span>}
              {activeTransactionType && <span> via {activeTransactionType.replaceAll('_', ' ')}</span>}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="w-28 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 md:px-8">Rank</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 md:px-8">Name</th>
                <th className="w-64 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Agency</th>
                <th className="w-40 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 md:px-8">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((agent) => (
                <tr key={agent.cea_number} className="border-b border-zinc-900/80 transition hover:bg-zinc-900/70">
                  <td className="px-6 py-4 md:px-8">
                    <div className="flex items-center gap-3 text-xl font-semibold text-white">
                      <TrophyIcon rank={agent.rank} />
                      <span>{agent.rank}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 md:px-8">
                    <Link href={`/agent/${agent.cea_number}`} className="block text-base font-medium text-zinc-100 transition hover:text-white md:text-lg">
                      {agent.name}
                    </Link>
                    <div className="mt-1 text-sm text-zinc-500">{agent.cea_number}</div>
                  </td>
                  <td className="px-6 py-4 text-base text-zinc-400">
                    {agent.agency || 'Independent'}
                  </td>
                  <td className="px-6 py-4 text-right text-xl font-semibold text-white md:px-8">
                    {agent.transactions}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-base text-zinc-500 md:px-8">
                    No agents found for this filter set.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 pb-8 pt-6 md:px-8">
          <LeaderboardPagination currentPage={page} totalPages={totalPages} searchParams={filterParams} />
        </div>
      </section>
    </div>
  );
}
