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
    <div className="space-y-6 py-2">
      <Link href="/leaderboard" className="inline-block text-sm text-zinc-400 transition hover:text-zinc-100">
        &larr; Back to Leaderboard
      </Link>

      <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">{agent.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{ceaNumber}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Agency</div>
            <div className="mt-1 text-sm font-medium text-zinc-100">{agent.agency || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Phone</div>
            <div className="mt-1 text-sm text-zinc-100">
              {agent.phone ? <a href={`tel:${agent.phone}`} className="text-zinc-100 transition hover:text-white">{agent.phone}</a> : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Email</div>
            <div className="mt-1 text-sm text-zinc-100">
              {agent.email ? <a href={`mailto:${agent.email}`} className="text-zinc-100 transition hover:text-white">{agent.email}</a> : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Registration</div>
            <div className="mt-1 text-sm text-zinc-100">
              {agent.registration_start || '—'} to {agent.registration_end || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-3xl font-semibold text-zinc-50">{agent.total_transactions}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Total Transactions</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Property Types</div>
          <div className="mt-3 space-y-2">
            {[...propertyTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-zinc-400">{type}</span>
                <span className="font-medium text-zinc-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Transaction Types</div>
          <div className="mt-3 space-y-2">
            {[...transactionTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-zinc-400">{type}</span>
                <span className="font-medium text-zinc-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Transaction History</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Property</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {transactions.slice(0, 100).map((tx, i) => (
              <tr key={i} className="transition hover:bg-zinc-900/60">
                <td className="px-6 py-3 text-xs text-zinc-400">{tx.date}</td>
                <td className="px-6 py-3 text-xs text-zinc-400">{tx.property_type}</td>
                <td className="px-6 py-3 text-xs text-zinc-400">{tx.transaction_type}</td>
                <td className="px-6 py-3 text-xs text-zinc-400">{tx.role}</td>
                <td className="px-6 py-3 text-xs text-zinc-400">{tx.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length > 100 && (
          <div className="border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-500">
            Showing first 100 of {transactions.length} transactions
          </div>
        )}
      </div>
    </div>
  );
}
