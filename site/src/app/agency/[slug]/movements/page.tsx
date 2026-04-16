import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/Pagination';
import MovementsTypeFilters from '@/components/MovementsTypeFilters';
import { getAgencyBySlug, getAgencyMovementsPage } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatCount, formatDateLabel, formatLabel } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}

const TYPE_COLORS: Record<string, string> = {
  agency_change: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  new_registration: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  deregistration: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  reregistration: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
};

function getMovementColumns(movement: { previous_agency: string | null; new_agency: string | null; type: string }) {
  if (movement.type === 'new_registration') return { from: 'New Registration', to: movement.new_agency || '—' };
  if (movement.type === 'deregistration') return { from: movement.previous_agency || '—', to: 'Deregistered' };
  if (movement.type === 'reregistration') return { from: 'Re-registration', to: movement.new_agency || '—' };
  return { from: movement.previous_agency || '—', to: movement.new_agency || '—' };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  return createPageMetadata({
    title: agency ? `${agency.name} — Agent Movements & Transfers` : 'Agency movements',
    description: agency
      ? `Track agent transfers, new registrations, and deregistrations at ${agency.name}.`
      : 'Agency movement history',
    path: `/agency/${slug}/movements`,
    noindex: !agency,
  });
}

export default async function AgencyMovementsPage({ params, searchParams }: Props) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10) || 1);
  const type = resolvedSearchParams.type || undefined;
  const pageSize = 25;

  const { rows, total } = await getAgencyMovementsPage({
    agency: agency.name,
    page: currentPage,
    pageSize,
    type,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const url = await getRequestAbsoluteUrl(`/agency/${slug}/movements`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${agency.name} movements`,
    url,
  };

  return (
    <div className="space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div>
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Agencies', href: '/agencies' },
          { label: agency.name, href: `/agency/${slug}` },
          { label: 'Movements' },
        ]} />
        <Link href={`/agency/${slug}`} className="text-sm text-zinc-400 transition hover:text-zinc-100">&larr; Back to agency overview</Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">{agency.name} movements</h1>
        <p className="mt-2 text-base text-zinc-400">{formatCount(total)} movement records</p>
      </div>

      <MovementsTypeFilters selectedType={type} basePath={`/agency/${slug}/movements`} />

      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Agent</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Type</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">From</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {rows.map((movement) => {
                const columns = getMovementColumns(movement);
                return (
                  <tr key={movement.id} className="transition hover:bg-zinc-900/60">
                    <td className="px-6 py-3.5 text-sm tabular-nums text-zinc-400">{formatDateLabel(movement.date)}</td>
                    <td className="px-6 py-3.5">
                      <Link href={`/agent/${movement.cea_number}`} className="text-sm font-medium text-zinc-100 transition hover:text-white">
                        {movement.agent_name}
                      </Link>
                      <div className="mt-0.5 text-xs text-zinc-500">{movement.cea_number}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`rounded-full border px-3 py-1 text-xs ${TYPE_COLORS[movement.type] || 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>
                        {formatLabel(movement.type)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-zinc-400">{columns.from}</td>
                    <td className="px-6 py-3.5 text-sm text-zinc-100">{columns.to}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-zinc-900 md:hidden">
          {rows.map((movement) => {
            const columns = getMovementColumns(movement);
            return (
              <div key={movement.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/agent/${movement.cea_number}`} className="text-sm font-medium text-zinc-100">
                      {movement.agent_name}
                    </Link>
                    <div className="mt-0.5 text-xs text-zinc-500">{movement.cea_number}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${TYPE_COLORS[movement.type] || 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>
                    {formatLabel(movement.type)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {columns.from} <span className="text-zinc-600">&rarr;</span> {columns.to}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{formatDateLabel(movement.date)}</div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <svg className="mb-3 h-8 w-8 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <p className="text-sm text-zinc-500">No movement records found{type ? ` for ${formatLabel(type)}` : ''}.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/agency/${slug}/movements`}
              searchParams={type ? { type } : {}}
            />
          </div>
        )}
      </section>
    </div>
  );
}
