import Link from 'next/link';
import { getLeaderboard } from '@/lib/queries';
import Pagination from '@/components/Pagination';

interface Props {
  searchParams: Promise<{ page?: string; year?: string; agency?: string }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const year = parseInt(params.year || '2026');
  const agency = params.agency || undefined;
  const pageSize = 25;

  const { rows, total } = await getLeaderboard({ page, pageSize, agency });
  const totalPages = Math.ceil(total / pageSize);

  const filterParams: Record<string, string> = { year: String(year) };
  if (agency) filterParams.agency = agency;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString()} agents ranked for {year}
            {agency && <span> — filtered by {agency}</span>}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((agent) => (
              <tr key={agent.cea_number} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 w-16">{agent.rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/agent/${agent.cea_number}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {agent.name}
                  </Link>
                  <div className="text-xs text-gray-400">{agent.cea_number}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{agent.agency}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{agent.transactions}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No agents found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/leaderboard" searchParams={filterParams} />

      <p className="text-xs text-gray-400 text-center mt-4">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} agents
      </p>
    </div>
  );
}
