import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAgencySummary } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatDateLabel, formatLabel, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const summary = await getAgencySummary(slug);

  return createPageMetadata({
    title: summary ? `${summary.agency.name} agents` : 'Agency',
    description: summary
      ? `Explore ${summary.agency.name} on PropNext Intel: top agents, recent movements, and property mix context.`
      : 'Agency page',
    path: `/agency/${slug}`,
    noindex: !summary,
  });
}

export default async function AgencyPage({ params }: Props) {
  const { slug } = await params;
  const summary = await getAgencySummary(slug);
  if (!summary) notFound();

  const url = await getRequestAbsoluteUrl(`/agency/${slug}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${summary.agency.name} on PropNext Intel`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Agency</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">{summary.agency.name}</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          See how large {summary.agency.name} is, which agents lead within the agency, and what recent movement and property-mix signals say about its current footprint.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Total Agents</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{formatCount(summary.agency.count)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ranking Year</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{summary.year}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent Movements</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{formatCount(summary.recentMovements.length)}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-zinc-100">Top agents in {summary.agency.name}</h2>
            <Link href={`/agency/${slug}/leaderboard`} className="text-sm text-zinc-400 transition hover:text-zinc-100">Full agency leaderboard</Link>
          </div>
          <div className="mt-5 space-y-3">
            {summary.leaderboard.rows.slice(0, 8).map((agent) => (
              <Link key={agent.cea_number} href={`/agent/${agent.cea_number}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 transition hover:border-zinc-700">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{agent.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">#{agent.rank} in {summary.year}</div>
                </div>
                <div className="text-sm font-semibold text-zinc-100">{formatCount(agent.transactions)}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
          <h2 className="text-xl font-semibold text-zinc-100">Property mix</h2>
          {summary.propertyMix.length > 0 ? (
            <div className="mt-5 space-y-3">
              {summary.propertyMix.slice(0, 6).map((item) => (
                <Link key={item.propertyType} href={`/property-type/${slugifySegment(item.propertyType)}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700">
                  <span className="text-sm text-zinc-300">{formatLabel(item.propertyType)}</span>
                  <span className="text-sm font-medium text-zinc-100">{formatCount(item.count)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-zinc-500">
              Property-type mix will appear here when we can match this agency&apos;s agents to live transaction records.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Latest activity</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {summary.recentMovements.map((movement) => (
            <Link key={movement.id} href={`/agent/${movement.cea_number}`} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700">
              <div className="text-sm font-medium text-zinc-100">{movement.agent_name}</div>
              <div className="mt-1 text-xs text-zinc-500">{formatLabel(movement.type)} · {formatDateLabel(movement.date)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
