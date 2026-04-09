import { getAgent, getAgentTransactions } from '@/lib/queries';
import { getAbsoluteUrl } from '@/lib/site';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ ceaNumber: string }>;
}

const MONTH_INDEX: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

function formatLocation(location: string | null | undefined): string {
  if (!location) return '—';

  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== '-');

  return parts.length > 0 ? parts.join(', ') : '—';
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return '—';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (periodMatch) {
    const [, month, year] = periodMatch;
    return `${month.charAt(0)}${month.slice(1).toLowerCase()} ${year}`;
  }

  return value;
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function getTransactionSortKey(value: string): number {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (periodMatch) {
    const month = MONTH_INDEX[periodMatch[1]] ?? -1;
    return Number(periodMatch[2]) * 12 + month;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? -1 : parsed;
}

export default async function AgentPage({ params }: Props) {
  const { ceaNumber } = await params;
  const agent = await getAgent(ceaNumber);
  if (!agent) notFound();

  const transactions = await getAgentTransactions(ceaNumber);
  const totalTransactions = Math.max(agent.total_transactions || 0, transactions.length);

  // Group transaction stats
  const propertyTypes = new Map<string, number>();
  const transactionTypes = new Map<string, number>();
  const roles = new Map<string, number>();
  for (const tx of transactions) {
    propertyTypes.set(tx.property_type, (propertyTypes.get(tx.property_type) || 0) + 1);
    transactionTypes.set(tx.transaction_type, (transactionTypes.get(tx.transaction_type) || 0) + 1);
    roles.set(tx.role, (roles.get(tx.role) || 0) + 1);
  }

  const latestTransaction = transactions.reduce<string | null>((latest, tx) => {
    if (!latest) return tx.date;
    return getTransactionSortKey(tx.date) > getTransactionSortKey(latest) ? tx.date : latest;
  }, null);

  const topPropertyTypes = [...propertyTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topTransactionTypes = [...transactionTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topRoles = [...roles.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const profileUrl = getAbsoluteUrl(`/agent/${ceaNumber}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: agent.name,
    url: profileUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Leaderboard', item: getAbsoluteUrl('/leaderboard') },
        { '@type': 'ListItem', position: 3, name: agent.name, item: profileUrl },
      ],
    },
    mainEntity: {
      '@type': 'Person',
      name: agent.name,
      identifier: agent.cea_number,
      telephone: agent.phone || undefined,
      email: agent.email || undefined,
      worksFor: agent.agency ? { '@type': 'Organization', name: agent.agency } : undefined,
    },
  };

  return (
    <div className="space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Link href="/leaderboard" className="inline-block text-sm text-zinc-400 transition hover:text-zinc-100">
        &larr; Back to Leaderboard
      </Link>

      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-6 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Agent Profile</div>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
                {agent.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
                  CEA {ceaNumber}
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
                  {agent.agency || 'Independent'}
                </span>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-3 text-right">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Verified Transactions</div>
                <div className="mt-1 text-3xl font-semibold text-zinc-50">{formatCount(totalTransactions)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Latest Activity</div>
                <div className="mt-1 text-sm font-medium text-zinc-200">{formatDateLabel(latestTransaction)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-6 md:grid-cols-4">
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
              {formatDateLabel(agent.registration_start)} to {formatDateLabel(agent.registration_end)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-100">Transaction Snapshot</div>
              <div className="mt-1 text-sm text-zinc-500">How this agent&apos;s verified records break down.</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold text-zinc-50">{formatCount(totalTransactions)}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Total Records</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {topTransactionTypes.map(([type, count]) => (
              <div key={type} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{formatLabel(type)}</div>
                <div className="mt-2 text-xl font-semibold text-zinc-50">{formatCount(count)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Property Mix</div>
          <div className="mt-1 text-sm text-zinc-500">Top property types by transaction count.</div>
          <div className="mt-3 space-y-2">
            {topPropertyTypes.map(([type, count]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{formatLabel(type)}</span>
                  <span className="font-medium text-zinc-100">{formatCount(count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-zinc-200"
                    style={{ width: `${Math.max(8, Math.round((count / totalTransactions) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Representation</div>
          <div className="mt-1 text-sm text-zinc-500">Most common roles across completed deals.</div>
          <div className="mt-3 space-y-2">
            {topRoles.map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
                <span className="text-zinc-300">{formatLabel(role)}</span>
                <span className="font-medium text-zinc-100">{formatCount(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Transaction History</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Showing the latest {Math.min(100, transactions.length)} verified records for this agent.
              </p>
            </div>
            <div className="text-sm text-zinc-400">
              Total on page: <span className="font-medium text-zinc-100">{formatCount(transactions.length)}</span>
            </div>
          </div>
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
                <td className="px-6 py-3 text-xs text-zinc-300">{formatDateLabel(tx.date)}</td>
                <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.property_type)}</td>
                <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.transaction_type)}</td>
                <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.role)}</td>
                <td className="px-6 py-3 text-xs text-zinc-400">{formatLocation(tx.location)}</td>
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
