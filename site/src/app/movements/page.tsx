import Link from 'next/link';
import { getMovements } from '@/lib/queries';
import { getAbsoluteUrl } from '@/lib/site';
import Pagination from '@/components/Pagination';

interface Props {
  searchParams: Promise<{ page?: string; type?: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  agency_change: 'Agency Transfer',
  new_registration: 'New Registration',
  deregistration: 'Deregistration',
  reregistration: 'Re-registration',
};

const TYPE_COLORS: Record<string, string> = {
  agency_change: 'bg-blue-100 text-blue-700',
  new_registration: 'bg-green-100 text-green-700',
  deregistration: 'bg-red-100 text-red-700',
  reregistration: 'bg-purple-100 text-purple-700',
};

export default async function MovementsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const type = params.type || undefined;
  const pageSize = 20;

  const { rows, total } = await getMovements({ page, pageSize, type });
  const totalPages = Math.ceil(total / pageSize);

  const filterParams: Record<string, string> = {};
  if (type) filterParams.type = type;
  const url = getAbsoluteUrl(`/movements${type ? `?type=${encodeURIComponent(type)}` : ''}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Agent Movements',
    url,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: getAbsoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Movements', item: getAbsoluteUrl('/movements') },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rows.length,
      itemListElement: rows.map((movement, index) => ({
        '@type': 'ListItem',
        position: ((page - 1) * pageSize) + index + 1,
        url: getAbsoluteUrl(`/agent/${movement.cea_number}`),
        item: {
          '@type': 'Person',
          name: movement.agent_name,
          identifier: movement.cea_number,
        },
      })),
    },
  };

  return (
    <div className="space-y-6 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">Agent Movements</h1>
          <p className="mt-2 text-lg text-zinc-400">
            {total.toLocaleString()} movements tracked
            {type && <span> — filtered by {TYPE_LABELS[type] || type}</span>}
          </p>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/movements"
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${!type ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          All
        </Link>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/movements?type=${key}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${type === key ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((movement) => (
          <div key={movement.id} className="flex items-center justify-between rounded-[24px] border border-zinc-800 bg-zinc-950/90 px-6 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/agent/${movement.cea_number}`} className="text-sm font-medium text-zinc-100 transition hover:text-white">
                  {movement.agent_name}
                </Link>
                <span className="text-xs text-zinc-500">{movement.cea_number}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                {movement.type === 'agency_change' && (
                  <>{movement.previous_agency} → {movement.new_agency}</>
                )}
                {movement.type === 'new_registration' && (
                  <>Joined {movement.new_agency}</>
                )}
                {movement.type === 'deregistration' && (
                  <>Left {movement.previous_agency}</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLORS[movement.type] || 'bg-zinc-800 text-zinc-300'}`}>
                {TYPE_LABELS[movement.type] || movement.type}
              </span>
              <span className="w-24 text-right text-xs text-zinc-500">
                {new Date(movement.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-8 text-center text-zinc-500">No movements found</div>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/movements" searchParams={filterParams} />
    </div>
  );
}
