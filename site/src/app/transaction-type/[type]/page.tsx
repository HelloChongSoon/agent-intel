import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getLeaderboard, getLatestLeaderboardYear, getTransactionTypeBySlug } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatLabel } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const transactionType = await getTransactionTypeBySlug(type);

  return createPageMetadata({
    title: transactionType ? `Top ${formatLabel(transactionType)} Agents in Singapore — Rankings` : 'Transaction type',
    description: transactionType
      ? `Ranked list of Singapore's top ${formatLabel(transactionType).toLowerCase()} property agents by volume with transaction data and agent profiles.`
      : 'Transaction-type summary page',
    path: `/transaction-type/${type}`,
    noindex: !transactionType,
  });
}

export default async function TransactionTypePage({ params }: Props) {
  const { type } = await params;
  const transactionType = await getTransactionTypeBySlug(type);
  if (!transactionType) notFound();

  const year = await getLatestLeaderboardYear();
  const leaderboard = await getLeaderboard({ year, transactionType, pageSize: 25 });
  const label = formatLabel(transactionType);
  const url = await getRequestAbsoluteUrl(`/transaction-type/${type}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Top ${label} agents`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Leaderboard', href: '/leaderboard' }, { label }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Deal Type</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Top {label} agents in Singapore</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          Use this page to compare agents based on the deal type you actually need, such as resale, rental, or new sale activity.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Coverage Year</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{year}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Matched Agents</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{formatCount(leaderboard.total)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Key Takeaway</div>
          <p className="mt-3 text-sm leading-7 text-zinc-400">Deal-type pages help consumers find agents whose public record matches the exact transaction journey they are entering.</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Top agents</h2>
        <div className="mt-5 space-y-3">
          {leaderboard.rows.slice(0, 10).map((agent) => (
            <Link key={agent.cea_number} href={`/agent/${agent.cea_number}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 transition hover:border-zinc-700">
              <div>
                <div className="text-sm font-medium text-zinc-100">{agent.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{agent.agency || 'Independent'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-100">#{agent.rank}</div>
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} transactions</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
