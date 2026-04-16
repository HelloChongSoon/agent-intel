import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/Pagination';
import AgenciesSearchForm from '@/components/AgenciesSearchForm';
import { getAgencies } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: 'Property Agency Directory Singapore — All Agencies',
    description: 'Browse all Singapore property agencies and their agent counts on PropNext Intel.',
    path: '/agencies',
  });
}

export default async function AgenciesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const query = params.q?.trim() || '';
  const pageSize = 50;

  const allAgencies = await getAgencies();
  const filtered = query
    ? allAgencies.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : allAgencies;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const url = await getRequestAbsoluteUrl('/agencies');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Agency Directory',
    url,
    description: 'Browse all Singapore property agencies.',
  };

  return (
    <div className="min-h-[calc(100vh-97px)] py-2 text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mb-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Agencies' }]} />
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
          Agency Directory
        </h1>
        <p className="mt-2 text-base text-zinc-400">
          {formatCount(allAgencies.length)} registered agencies
          {query && <span> — {formatCount(filtered.length)} matching &ldquo;{query}&rdquo;</span>}
        </p>
      </div>

      <div className="mb-6 max-w-lg">
        <AgenciesSearchForm defaultValue={query || undefined} />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="divide-y divide-zinc-900">
          {paged.map((agency) => (
            <Link
              key={agency.name}
              href={`/agency/${slugifySegment(agency.name)}`}
              className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-900/60"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-100">{agency.name}</div>
              </div>
              <div className="ml-4 shrink-0 text-sm tabular-nums text-zinc-400">
                {formatCount(agency.count)} agents
              </div>
            </Link>
          ))}
          {paged.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <svg className="mb-3 h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="text-sm text-zinc-500">No agencies matching &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/agencies"
              searchParams={query ? { q: query } : {}}
            />
          </div>
        )}
      </section>
    </div>
  );
}
