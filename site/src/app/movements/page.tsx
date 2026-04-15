import Link from 'next/link';
import { getMovementInsights, getMovements } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { formatDateLabel, formatLabel, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl } from '@/lib/site';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/Pagination';
import MovementsSearchForm from '@/components/MovementsSearchForm';
import MovementsTypeFilters from '@/components/MovementsTypeFilters';

interface Props {
  searchParams: Promise<{ page?: string; type?: string; q?: string }>;
}

export async function generateMetadata() {
  return createPageMetadata({
    title: 'Property Agent Movements & Agency Transfers Singapore',
    description: 'Track Singapore property agent agency transfers, new registrations, and deregistrations with weekly trends and searchable history.',
    path: '/movements',
  });
}

const TYPE_LABELS: Record<string, string> = {
  agency_change: 'Agency Transfer',
  new_registration: 'New Registration',
  deregistration: 'Deregistration',
  reregistration: 'Re-registration',
};

const TYPE_COLORS: Record<string, string> = {
  agency_change: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  new_registration: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  deregistration: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  reregistration: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
};

function formatCompactNumber(value: number): string {
  return value.toLocaleString('en-SG');
}

function getMovementColumns(movement: {
  previous_agency: string | null;
  new_agency: string | null;
  type: string;
}) {
  if (movement.type === 'new_registration') {
    return { from: 'New Registration', to: movement.new_agency || '—' };
  }

  if (movement.type === 'deregistration') {
    return { from: movement.previous_agency || '—', to: 'Deregistered' };
  }

  if (movement.type === 'reregistration') {
    return { from: 'Re-registration', to: movement.new_agency || '—' };
  }

  return {
    from: movement.previous_agency || '—',
    to: movement.new_agency || '—',
  };
}

export default async function MovementsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const type = params.type || undefined;
  const searchQuery = params.q?.trim() || '';
  const pageSize = 20;

  const [{ rows, total }, insights] = await Promise.all([
    getMovements({ page, pageSize, type, query: searchQuery }),
    getMovementInsights(),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  const filterParams: Record<string, string> = {};
  if (type) filterParams.type = type;
  if (searchQuery) filterParams.q = searchQuery;

  const homeUrl = await getRequestAbsoluteUrl('/');
  const movementsUrl = await getRequestAbsoluteUrl('/movements');
  const queryString = new URLSearchParams(filterParams).toString();
  const url = await getRequestAbsoluteUrl(`/movements${queryString ? `?${queryString}` : ''}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Agent Movements',
    url,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Movements', item: movementsUrl },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: rows.length,
      itemListElement: rows.map((movement, index) => ({
        '@type': 'ListItem',
        position: ((page - 1) * pageSize) + index + 1,
        url: `${homeUrl.replace(/\/$/, '')}/agent/${movement.cea_number}`,
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
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Movements' }]} />
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl md:text-4xl">Agent Movements</h1>
          <p className="mt-2 text-lg text-zinc-400">
            {formatCompactNumber(insights.totalMovements)} movements tracked
            {type && <span> — filtered by {TYPE_LABELS[type] || type}</span>}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500">
            Movement records show when an agent changed agencies, entered the market, or reappeared in public records, adding useful context to the profile rather than replacing it.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Total movements</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-50">{formatCompactNumber(insights.totalMovements)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Agency transfers</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-50">{formatCompactNumber(insights.countsByType.agency_change || 0)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">New registrations</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-50">{formatCompactNumber(insights.countsByType.new_registration || 0)}</div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Deregistrations</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-50">{formatCompactNumber(insights.countsByType.deregistration || 0)}</div>
        </div>
      </section>

      <MovementsTypeFilters selectedType={type} searchQuery={searchQuery} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Movements over time</h2>
              <p className="mt-1 text-sm text-zinc-500">Weekly breakdown of movement activity by type.</p>
            </div>
            <div className="text-sm text-zinc-400">Last {insights.weeklyBreakdown.length} weeks</div>
          </div>
          <div className="mt-6 space-y-4">
            {insights.weeklyBreakdown.map((week) => {
              const totalForWeek = Math.max(week.total, 1);
              return (
                <div key={week.weekStart} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{formatDateLabel(week.weekStart)}</span>
                    <span>{formatCompactNumber(week.total)} moves</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-zinc-900">
                    {Object.keys(TYPE_LABELS).map((movementType) => {
                      const count = week.counts[movementType] || 0;
                      if (!count) return null;

                      const colorClass =
                        movementType === 'agency_change'
                          ? 'bg-blue-400'
                          : movementType === 'new_registration'
                            ? 'bg-emerald-400'
                            : movementType === 'deregistration'
                              ? 'bg-rose-400'
                              : 'bg-violet-400';

                      return (
                        <div
                          key={movementType}
                          className={colorClass}
                          style={{ width: `${(count / totalForWeek) * 100}%` }}
                          aria-label={`${TYPE_LABELS[movementType]} ${count}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(TYPE_LABELS).map(([movementType, label]) => (
              <span
                key={movementType}
                className={`rounded-full border px-3 py-1 text-xs ${TYPE_COLORS[movementType] || 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Top agencies by net change</h2>
          <p className="mt-1 text-sm text-zinc-500">Agencies gaining or losing the most people across public movement records.</p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800">
            <div className="hidden md:block">
              <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr_0.6fr] gap-3 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <div>Agency</div>
                <div className="text-right">Gained</div>
                <div className="text-right">Lost</div>
                <div className="text-right">Net</div>
              </div>
              <div className="divide-y divide-zinc-900">
                {insights.topAgencyNetChange.map((agency) => (
                  <div key={agency.agency} className="grid grid-cols-[1.8fr_0.6fr_0.6fr_0.6fr] gap-3 px-4 py-3 text-sm">
                    <Link
                      href={`/agency/${slugifySegment(agency.agency)}`}
                      className="font-medium text-zinc-100 transition hover:text-white"
                    >
                      {agency.agency}
                    </Link>
                    <div className="text-right text-emerald-300">+{formatCompactNumber(agency.gained)}</div>
                    <div className="text-right text-rose-300">-{formatCompactNumber(agency.lost)}</div>
                    <div className={`text-right font-medium ${agency.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {agency.net >= 0 ? '+' : ''}{formatCompactNumber(agency.net)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-zinc-900 md:hidden">
              {insights.topAgencyNetChange.map((agency) => (
                <div key={agency.agency} className="space-y-4 px-4 py-4">
                  <Link
                    href={`/agency/${slugifySegment(agency.agency)}`}
                    className="block text-sm font-medium text-zinc-100 transition hover:text-white"
                  >
                    {agency.agency}
                  </Link>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Gained</div>
                      <div className="mt-1 text-sm font-medium text-emerald-300">+{formatCompactNumber(agency.gained)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Lost</div>
                      <div className="mt-1 text-sm font-medium text-rose-300">-{formatCompactNumber(agency.lost)}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Net</div>
                      <div className={`mt-1 text-sm font-medium ${agency.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {agency.net >= 0 ? '+' : ''}{formatCompactNumber(agency.net)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(TYPE_LABELS).map(([movementType, label]) => (
          <Link
            key={movementType}
            href={`/movements?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), type: movementType }).toString()}`}
            className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <div className="text-sm font-medium text-zinc-100">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-zinc-50">
              {formatCompactNumber(insights.countsByType[movementType] || 0)}
            </div>
            <p className="mt-2 text-sm text-zinc-500">Click to view only this movement type in the history table below.</p>
          </Link>
        ))}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Movement History</h2>
              <p className="mt-1 text-sm text-zinc-500">Search by salesperson name or registration number.</p>
            </div>
            <div className="text-sm text-zinc-400">
              Showing {rows.length === 0 ? 0 : ((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {formatCompactNumber(total)} movements
            </div>
          </div>
          <MovementsSearchForm defaultValue={searchQuery} movementType={type} />
        </div>

        <div className="hidden md:block">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              <tr className="text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Date</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Salesperson</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Reg. No.</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">From</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {rows.map((movement) => {
                const columns = getMovementColumns(movement);

                return (
                  <tr key={movement.id} className="transition hover:bg-zinc-900/60">
                    <td className="px-6 py-4 text-sm text-zinc-300">{formatDateLabel(movement.date)}</td>
                    <td className="px-6 py-4">
                      <Link href={`/agent/${movement.cea_number}`} className="font-medium text-zinc-100 transition hover:text-white">
                        {movement.agent_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">{movement.cea_number}</td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{columns.from}</td>
                    <td className="px-6 py-4 text-sm text-zinc-300">
                      {movement.new_agency ? (
                        <Link
                          href={`/agency/${slugifySegment(movement.new_agency)}`}
                          className="text-blue-400 transition hover:text-blue-300"
                        >
                          {columns.to}
                        </Link>
                      ) : columns.to}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-zinc-900 md:hidden">
          {rows.map((movement) => {
            const columns = getMovementColumns(movement);

            return (
              <div key={movement.id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/agent/${movement.cea_number}`} className="text-sm font-medium text-zinc-100 transition hover:text-white">
                      {movement.agent_name}
                    </Link>
                    <div className="mt-1 text-xs text-zinc-500">{movement.cea_number}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${TYPE_COLORS[movement.type] || 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>
                    {TYPE_LABELS[movement.type] || formatLabel(movement.type)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">{formatDateLabel(movement.date)}</div>
                <div className="grid gap-3 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">From</div>
                    <div className="mt-1 text-zinc-300">{columns.from}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">To</div>
                    <div className="mt-1 text-zinc-300">
                      {movement.new_agency ? (
                        <Link
                          href={`/agency/${slugifySegment(movement.new_agency)}`}
                          className="text-blue-400 transition hover:text-blue-300"
                        >
                          {columns.to}
                        </Link>
                      ) : columns.to}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="px-6 py-10 text-center text-zinc-500">No movements found for this filter combination.</div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">What this means</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Consumers should read movement data as business context. A transfer or registration event does not automatically say whether an agent is better or worse, but it does help explain the environment they are operating in.
          </p>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Latest activity types</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.keys(TYPE_LABELS).map((movementType) => (
              <Link
                key={movementType}
                href={`/movements?${new URLSearchParams({ ...(searchQuery ? { q: searchQuery } : {}), type: movementType }).toString()}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(movementType)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/movements" searchParams={filterParams} />
    </div>
  );
}
