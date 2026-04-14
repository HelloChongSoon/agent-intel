import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAreaBySlug, getAreaLeaderboard, getLatestLeaderboardYear, getPropertyTypeBySlug } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatLabel } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ area: string; propertyType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: areaSlug, propertyType: typeSlug } = await params;
  const [area, propertyType] = await Promise.all([
    getAreaBySlug(areaSlug),
    getPropertyTypeBySlug(typeSlug),
  ]);

  const title = area && propertyType
    ? `Top ${formatLabel(propertyType)} Agents in ${area}, Singapore`
    : 'Area property type';

  return createPageMetadata({
    title,
    description: area && propertyType
      ? `Ranked list of ${formatLabel(propertyType).toLowerCase()} property agents most active in ${area} by transaction volume.`
      : 'Area property type page',
    path: `/area/${areaSlug}/${typeSlug}`,
    noindex: !area || !propertyType,
  });
}

export default async function AreaPropertyTypePage({ params }: Props) {
  const { area: areaSlug, propertyType: typeSlug } = await params;
  const [area, propertyType] = await Promise.all([
    getAreaBySlug(areaSlug),
    getPropertyTypeBySlug(typeSlug),
  ]);
  if (!area || !propertyType) notFound();

  const year = await getLatestLeaderboardYear();
  const leaderboard = await getAreaLeaderboard({ area, year, propertyType, pageSize: 25 });
  const url = await getRequestAbsoluteUrl(`/area/${areaSlug}/${typeSlug}`);
  const typeLabel = formatLabel(propertyType);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Top ${typeLabel} agents in ${area}`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: area, href: `/area/${areaSlug}` },
          { label: typeLabel },
        ]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">{area} &middot; {typeLabel}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">Top {typeLabel.toLowerCase()} agents in {area}</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          Agents ranked by {typeLabel.toLowerCase()} transaction volume in {area}, narrowing down to the most relevant specialists.
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
          <p className="mt-3 text-sm leading-7 text-zinc-400">Cross-filtering by area and property type shows agents with the most relevant local experience.</p>
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
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} transactions</div>
              </div>
            </Link>
          ))}
          {leaderboard.total === 0 && (
            <p className="text-sm text-zinc-500">No agents matched this combination in {year}.</p>
          )}
        </div>
      </section>

      <div className="text-sm text-zinc-400">
        Related: <Link href={`/area/${areaSlug}`} className="text-zinc-100 transition hover:text-white">All agents in {area}</Link>,{' '}
        <Link href={`/property-type/${typeSlug}`} className="text-zinc-100 transition hover:text-white">All {typeLabel.toLowerCase()} agents</Link>
      </div>
    </div>
  );
}
