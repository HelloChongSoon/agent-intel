import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAgencyBySlug, getAreaBySlug, getAreaLeaderboard, getLatestLeaderboardYear } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string; area: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, area: areaSlug } = await params;
  const [agency, area] = await Promise.all([
    getAgencyBySlug(slug),
    getAreaBySlug(areaSlug),
  ]);

  return createPageMetadata({
    title: agency && area ? `${agency.name} Agents in ${area}` : 'Agency area',
    description: agency && area
      ? `${agency.name} property agents active in ${area}, ranked by transaction volume on PropNext Intel.`
      : 'Agency area page',
    path: `/agency/${slug}/area/${areaSlug}`,
    noindex: !agency || !area,
  });
}

export default async function AgencyAreaPage({ params }: Props) {
  const { slug, area: areaSlug } = await params;
  const [agency, area] = await Promise.all([
    getAgencyBySlug(slug),
    getAreaBySlug(areaSlug),
  ]);
  if (!agency || !area) notFound();

  const year = await getLatestLeaderboardYear();
  const leaderboard = await getAreaLeaderboard({ area, year, agency: agency.name, pageSize: 25 });
  const url = await getRequestAbsoluteUrl(`/agency/${slug}/area/${areaSlug}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${agency.name} agents in ${area}`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: agency.name, href: `/agency/${slug}` },
          { label: area },
        ]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">{agency.name} &middot; {area}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">{agency.name} agents in {area}</h1>
        <p className="mt-4 max-w-3xl text-lg text-zinc-400">
          {agency.name} agents ranked by transaction volume in {area}, showing who has the most local experience within this agency.
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
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} in {area}</div>
              </div>
            </Link>
          ))}
          {leaderboard.total === 0 && (
            <p className="text-sm text-zinc-500">No {agency.name} agents found in {area} for {year}.</p>
          )}
        </div>
      </section>

      <div className="text-sm text-zinc-400">
        Related: <Link href={`/agency/${slug}`} className="text-zinc-100 transition hover:text-white">{agency.name} overview</Link>,{' '}
        <Link href={`/area/${areaSlug}`} className="text-zinc-100 transition hover:text-white">All agents in {area}</Link>
      </div>
    </div>
  );
}
