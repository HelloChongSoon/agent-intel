import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getLeaderboard, getLatestLeaderboardYear, getPropertyTypeBySlug } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatLabel } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const propertyType = await getPropertyTypeBySlug(type);

  return createPageMetadata({
    title: propertyType ? `Top ${formatLabel(propertyType)} Property Agents in Singapore` : 'Property type',
    description: propertyType
      ? `Ranked list of Singapore's top ${formatLabel(propertyType).toLowerCase()} property agents by transaction volume with deal data and agent profiles.`
      : 'Property-type summary page',
    path: `/property-type/${type}`,
    noindex: !propertyType,
  });
}

export default async function PropertyTypePage({ params }: Props) {
  const { type } = await params;
  const propertyType = await getPropertyTypeBySlug(type);
  if (!propertyType) notFound();

  const year = await getLatestLeaderboardYear();
  const leaderboard = await getLeaderboard({ year, propertyType, pageSize: 25 });
  const url = await getRequestAbsoluteUrl(`/property-type/${type}`);
  const label = formatLabel(propertyType);
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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Property Type</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">Top {label} agents in Singapore</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          This page shows agents with visible transaction activity in the {label.toLowerCase()} segment, making it easier to compare like-for-like specialists instead of relying on one broad leaderboard.
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
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">What this means</div>
          <p className="mt-3 text-sm leading-7 text-zinc-400">Consumers should use property-type pages when the buying or selling journey is clearly tied to one housing segment.</p>
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">How rankings are computed</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Rankings are based on transaction volume within the selected year and property-type filter. The page is designed as a segment-specific discovery layer, not a guarantee of fit for every consumer.
          </p>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">FAQ</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-400">
            <p><span className="font-medium text-zinc-100">Why use a property-type page?</span> It narrows the comparison to agents active in the relevant housing segment.</p>
            <p><span className="font-medium text-zinc-100">Is this better than the main leaderboard?</span> It is better when you already know your transaction is segment-specific.</p>
          </div>
        </div>
      </section>

      <div className="text-sm text-zinc-400">
        Related pages: <Link href="/leaderboard" className="text-zinc-100 transition hover:text-white">Overall leaderboard</Link>,{' '}
        <Link href="/guides/top-condo-agents-vs-top-hdb-agents" className="text-zinc-100 transition hover:text-white">Segment guide</Link>
      </div>
    </div>
  );
}
