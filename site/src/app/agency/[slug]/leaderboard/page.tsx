import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/Pagination';
import { getAgencyBySlug, getLeaderboard, getLatestLeaderboardYear } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);

  return createPageMetadata({
    title: agency ? `${agency.name} Agent Leaderboard — Full Rankings` : 'Agency leaderboard',
    description: agency
      ? `Full ranked list of ${agency.name} property agents by transaction volume on PropNext Intel.`
      : 'Agency leaderboard',
    path: `/agency/${slug}/leaderboard`,
    noindex: !agency,
  });
}

export default async function AgencyLeaderboardPage({ params, searchParams }: Props) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const year = await getLatestLeaderboardYear();
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.page || '1', 10) || 1);
  const leaderboard = await getLeaderboard({ year, agency: agency.name, page: currentPage, pageSize: 25 });
  const totalPages = Math.max(1, Math.ceil(leaderboard.total / 25));
  const url = await getRequestAbsoluteUrl(`/agency/${slug}/leaderboard`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${agency.name} leaderboard`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Leaderboard', href: '/leaderboard' }, { label: agency.name, href: `/agency/${slug}` }, { label: 'Agency Rankings' }]} />
        <Link href={`/agency/${slug}`} className="text-sm text-zinc-400 transition hover:text-zinc-100">&larr; Back to agency overview</Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">{agency.name} leaderboard</h1>
        <p className="mt-4 text-lg text-zinc-400">Top visible agents within {agency.name} for {year}.</p>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-5 text-sm text-zinc-400">
          Showing {formatCount(leaderboard.total)} ranked agents
        </div>
        <div className="divide-y divide-zinc-900">
          {leaderboard.rows.map((agent) => (
            <Link key={agent.cea_number} href={`/agent/${agent.cea_number}`} className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-900/60">
              <div>
                <div className="text-sm font-medium text-zinc-100">{agent.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{agent.cea_number}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-100">#{agent.rank}</div>
                <div className="mt-1 text-xs text-zinc-500">{formatCount(agent.transactions)} transactions</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="px-6 py-5">
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath={`/agency/${slug}/leaderboard`} />
        </div>
      </section>
    </div>
  );
}
