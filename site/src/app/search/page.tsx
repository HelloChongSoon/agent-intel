import Link from 'next/link';
import { searchAgents } from '@/lib/queries';
import SearchBar from '@/components/SearchBar';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || '';
  const results = query ? await searchAgents(query, 50) : [];

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">Search Agents</h1>
        <p className="mt-2 text-lg text-zinc-400">Find profiles by name or CEA number.</p>
      </div>
      <SearchBar />

      {query && (
        <p className="text-sm text-zinc-400">
          {results.length} results for &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/90">
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
                  <td className="px-6 py-4 text-right text-sm font-medium text-zinc-100">{agent.total_transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
