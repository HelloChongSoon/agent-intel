import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAgencyBySlug, getLeaderboard, getLatestLeaderboardYear, getPropertyTypeBySlug } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatLabel } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string; type: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, type: typeSlug } = await params;
  const [agency, propertyType] = await Promise.all([
    getAgencyBySlug(slug),
    getPropertyTypeBySlug(typeSlug),
  ]);

  const typeLabel = propertyType ? formatLabel(propertyType) : '';

  return createPageMetadata({
    title: agency && propertyType ? `${agency.name} Top ${typeLabel} Agents` : 'Agency property type',
    description: agency && propertyType
      ? `${agency.name} agents ranked by ${typeLabel.toLowerCase()} transaction volume on PropNext Intel.`
      : 'Agency property type page',
    path: `/agency/${slug}/property-type/${typeSlug}`,
    noindex: !agency || !propertyType,
  });
}

export default async function AgencyPropertyTypePage({ params }: Props) {
  const { slug, type: typeSlug } = await params;
  const [agency, propertyType] = await Promise.all([
    getAgencyBySlug(slug),
    getPropertyTypeBySlug(typeSlug),
  ]);
  if (!agency || !propertyType) notFound();

  const year = await getLatestLeaderboardYear();
  const leaderboard = await getLeaderboard({ year, agency: agency.name, propertyType, pageSize: 25 });
  const url = await getRequestAbsoluteUrl(`/agency/${slug}/property-type/${typeSlug}`);
  const typeLabel = formatLabel(propertyType);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${agency.name} ${typeLabel} agents`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: agency.name, href: `/agency/${slug}` },
          { label: typeLabel },
        ]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">{agency.name} &middot; {typeLabel}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">{agency.name} top {typeLabel.toLowerCase()} agents</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          {agency.name} agents ranked by {typeLabel.toLowerCase()} transaction volume, showing who specialises in this property segment.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Matched Agents</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{formatCount(leaderboard.total)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Coverage Year</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-100">{year}</div>
        </div>
      </section>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Top agents</h2>
        <div className="mt-5 space-y-3">
          {leaderboard.rows.slice(0, 15).map((agent) => (
            <Link key={agent.cea_number} href={`/agent/${agent.cea_number}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 transition hover:border-zinc-700">
              <div>
                <div className="text-sm font-medium text-zinc-100">{agent.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{agent.cea_number}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-100">#{agent.rank}</div>
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} {typeLabel.toLowerCase()}</div>
              </div>
            </Link>
          ))}
          {leaderboard.total === 0 && (
            <p className="text-sm text-zinc-500">No {agency.name} agents found for {typeLabel.toLowerCase()} in {year}.</p>
          )}
        </div>
      </section>

      <div className="text-sm text-zinc-400">
        Related: <Link href={`/agency/${slug}`} className="text-zinc-100 transition hover:text-white">{agency.name} overview</Link>,{' '}
        <Link href={`/property-type/${typeSlug}`} className="text-zinc-100 transition hover:text-white">All {typeLabel.toLowerCase()} agents</Link>
      </div>
    </div>
  );
}
