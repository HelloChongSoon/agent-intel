import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAreaBySlug, getAreaLeaderboard, getAreaPropertyTypeCombos, getLatestLeaderboardYear } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatLabel, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ area: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: slug } = await params;
  const area = await getAreaBySlug(slug);

  return createPageMetadata({
    title: area ? `Top Property Agents in ${area}, Singapore` : 'Area',
    description: area
      ? `Ranked list of Singapore property agents most active in ${area} by transaction volume with profiles and deal data.`
      : 'Area page',
    path: `/area/${slug}`,
    noindex: !area,
  });
}

export default async function AreaPage({ params }: Props) {
  const { area: slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const year = await getLatestLeaderboardYear();
  const [leaderboard, allCombos] = await Promise.all([
    getAreaLeaderboard({ area, year, pageSize: 25 }),
    getAreaPropertyTypeCombos(3),
  ]);
  const areaCombos = allCombos.filter((c) => c.area === area);
  const url = await getRequestAbsoluteUrl(`/area/${slug}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Top agents in ${area}`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Leaderboard', href: '/leaderboard' }, { label: area }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Area</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Top agents in {area}</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          Agents ranked by transaction volume in {area}. Use this page to compare agents who are most active in this specific location.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Coverage Year</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{year}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active Agents</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{formatCount(leaderboard.total)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">What this means</div>
          <p className="mt-3 text-sm leading-7 text-zinc-400">Area pages help you find agents with the most transaction experience in a specific neighbourhood.</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Top agents</h2>
        <div className="mt-5 space-y-3">
          {leaderboard.rows.slice(0, 15).map((agent) => (
            <Link key={agent.cea_number} href={`/agent/${agent.cea_number}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 transition hover:border-zinc-700">
              <div>
                <div className="text-sm font-medium text-zinc-100">{agent.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{agent.agency || 'Independent'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-100">#{agent.rank}</div>
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} in {area}</div>
              </div>
            </Link>
          ))}
          {leaderboard.total === 0 && (
            <p className="text-sm text-zinc-500">No agents found for this area in {year}.</p>
          )}
        </div>
      </section>

      {areaCombos.length > 0 && (
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Browse by property type in {area}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {areaCombos.map((combo) => (
              <Link
                key={combo.propertyType}
                href={`/area/${slug}/${slugifySegment(combo.propertyType)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(combo.propertyType)} ({combo.agentCount} agents)
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="text-sm text-zinc-400">
        Related: <Link href="/leaderboard" className="text-zinc-100 transition hover:text-white">Overall leaderboard</Link>
      </div>
    </div>
  );
}
