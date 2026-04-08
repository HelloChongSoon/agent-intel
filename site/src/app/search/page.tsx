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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Agents</h1>
      <SearchBar />

      {query && (
        <p className="text-sm text-gray-500 mt-4 mb-4">
          {results.length} results for &ldquo;{query}&rdquo;
        </p>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CEA Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((agent) => (
                <tr key={agent.cea_number} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/agent/${agent.cea_number}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {agent.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{agent.cea_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{agent.agency || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{agent.total_transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
