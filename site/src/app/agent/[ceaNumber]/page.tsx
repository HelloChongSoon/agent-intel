import { getAgent, getAgentTransactions } from '@/lib/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ ceaNumber: string }>;
}

export default async function AgentPage({ params }: Props) {
  const { ceaNumber } = await params;
  const agent = await getAgent(ceaNumber);
  if (!agent) notFound();

  const transactions = await getAgentTransactions(ceaNumber);

  // Group transaction stats
  const propertyTypes = new Map<string, number>();
  const transactionTypes = new Map<string, number>();
  for (const tx of transactions) {
    propertyTypes.set(tx.property_type, (propertyTypes.get(tx.property_type) || 0) + 1);
    transactionTypes.set(tx.transaction_type, (transactionTypes.get(tx.transaction_type) || 0) + 1);
  }

  return (
    <div>
      <Link href="/leaderboard" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; Back to Leaderboard
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{ceaNumber}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-gray-400 uppercase">Agency</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{agent.agency || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Phone</div>
            <div className="text-sm text-gray-900 mt-1">
              {agent.phone ? <a href={`tel:${agent.phone}`} className="text-blue-600 hover:underline">{agent.phone}</a> : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Email</div>
            <div className="text-sm text-gray-900 mt-1">
              {agent.email ? <a href={`mailto:${agent.email}`} className="text-blue-600 hover:underline">{agent.email}</a> : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Registration</div>
            <div className="text-sm text-gray-900 mt-1">
              {agent.registration_start || '—'} to {agent.registration_end || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{agent.total_transactions}</div>
          <div className="text-xs text-gray-400 uppercase mt-1">Total Transactions</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-900">Property Types</div>
          <div className="mt-2 space-y-1">
            {[...propertyTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-gray-600">{type}</span>
                <span className="text-gray-900 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-900">Transaction Types</div>
          <div className="mt-2 space-y-1">
            {[...transactionTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-gray-600">{type}</span>
                <span className="text-gray-900 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.slice(0, 100).map((tx, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-xs text-gray-600">{tx.date}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{tx.property_type}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{tx.transaction_type}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{tx.role}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{tx.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length > 100 && (
          <div className="px-4 py-3 text-xs text-gray-400 text-center border-t">
            Showing first 100 of {transactions.length} transactions
          </div>
        )}
      </div>
    </div>
  );
}
