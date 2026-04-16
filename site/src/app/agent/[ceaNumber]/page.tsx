import type { Metadata } from 'next';
import { getAgent, getAgentMovements, getAgentSummary, getAgentTransactionFilters, getAgentTransactionsPage, getSimilarVolumeAgents, getSameAreaAgents, getSamePropertyTypeAgents, type MovementRow } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';
import Breadcrumbs from '@/components/Breadcrumbs';
import RevealContact from '@/components/RevealContact';
import Pagination from '@/components/Pagination';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatLabel, slugifySegment } from '@/lib/format';

interface Props {
  params: Promise<{ ceaNumber: string }>;
  searchParams: Promise<{
    txPage?: string;
    propertyType?: string;
    transactionType?: string;
    role?: string;
    txYear?: string;
    txMonth?: string;
  }>;
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { ceaNumber } = await params;
  const agent = await getAgent(ceaNumber);

  return createPageMetadata({
    title: agent ? `${agent.name} — Property Agent Profile (${ceaNumber})` : `Agent ${ceaNumber}`,
    description: agent
      ? `${agent.name} (${ceaNumber})${agent.agency ? ` at ${agent.agency}` : ''} — view transaction history, property mix, rankings, and registration details on PropNext Intel.`
      : 'Agent profile page',
    path: `/agent/${ceaNumber}`,
    noindex: !agent,
  });
}

const MONTH_INDEX: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

function formatLocation(location: string | null | undefined): string {
  if (!location) return '—';

  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== '-');

  return parts.length > 0 ? parts.join(', ') : '—';
}

function splitLocation(location: string | null | undefined): { district: string; area: string } {
  const formatted = formatLocation(location);
  if (formatted === '—') {
    return { district: '-', area: '—' };
  }

  const districtMatch = formatted.match(/^(\d{2}),\s*(.+)$/);
  if (districtMatch) {
    return {
      district: districtMatch[1],
      area: districtMatch[2],
    };
  }

  return {
    district: '-',
    area: formatted,
  };
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return '—';

  const monthYearMatch = value.match(/^([A-Z]{3})-(\d{4})$/i);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    return `${month.charAt(0).toUpperCase()}${month.slice(1).toLowerCase()} ${year}`;
  }

  const isoMonthMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (isoMonthMatch) {
    const parsed = new Date(`${value}-01T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-SG', {
        month: 'short',
        year: 'numeric',
      });
    }
  }

  if (/^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return value;
}


function getTransactionSortKey(value: string): number {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (periodMatch) {
    const month = MONTH_INDEX[periodMatch[1]] ?? -1;
    return Number(periodMatch[2]) * 12 + month;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? -1 : parsed;
}

function formatMonthBucket(value: string): { month: string; year: string } | null {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (!periodMatch) return null;
  return {
    month: `${periodMatch[1].charAt(0)}${periodMatch[1].slice(1).toLowerCase()}`,
    year: periodMatch[2],
  };
}

const MONTH_OPTIONS = [
  { value: '0', label: 'Jan' },
  { value: '1', label: 'Feb' },
  { value: '2', label: 'Mar' },
  { value: '3', label: 'Apr' },
  { value: '4', label: 'May' },
  { value: '5', label: 'Jun' },
  { value: '6', label: 'Jul' },
  { value: '7', label: 'Aug' },
  { value: '8', label: 'Sep' },
  { value: '9', label: 'Oct' },
  { value: '10', label: 'Nov' },
  { value: '11', label: 'Dec' },
];

function getMovementColumns(movement: MovementRow): {
  from: { label: string; agencySlug?: string };
  to: { label: string; agencySlug?: string };
} {
  if (movement.type === 'new_registration') {
    return {
      from: { label: 'New Registration' },
      to: movement.new_agency
        ? { label: movement.new_agency, agencySlug: slugifySegment(movement.new_agency) }
        : { label: '—' },
    };
  }

  if (movement.type === 'deregistration') {
    return {
      from: movement.previous_agency
        ? { label: movement.previous_agency, agencySlug: slugifySegment(movement.previous_agency) }
        : { label: '—' },
      to: { label: 'Deregistered' },
    };
  }

  if (movement.type === 'reregistration') {
    return {
      from: { label: 'Re-registration' },
      to: movement.new_agency
        ? { label: movement.new_agency, agencySlug: slugifySegment(movement.new_agency) }
        : { label: '—' },
    };
  }

  return {
    from: movement.previous_agency
      ? { label: movement.previous_agency, agencySlug: slugifySegment(movement.previous_agency) }
      : { label: '—' },
    to: movement.new_agency
      ? { label: movement.new_agency, agencySlug: slugifySegment(movement.new_agency) }
      : { label: '—' },
  };
}

function buildAgentTransactionFilterHref(
  ceaNumber: string,
  filters: {
    propertyType?: string;
    transactionType?: string;
    role?: string;
    txYear?: string;
    txMonth?: string;
  }
): string {
  const params = new URLSearchParams();
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.transactionType) params.set('transactionType', filters.transactionType);
  if (filters.role) params.set('role', filters.role);
  if (filters.txYear) params.set('txYear', filters.txYear);
  if (filters.txMonth) params.set('txMonth', filters.txMonth);

  const query = params.toString();
  return `/agent/${ceaNumber}${query ? `?${query}` : ''}`;
}

export default async function AgentPage({ params, searchParams }: Props) {
  const { ceaNumber } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedPropertyType = resolvedSearchParams.propertyType || '';
  const selectedTransactionType = resolvedSearchParams.transactionType || '';
  const selectedRole = resolvedSearchParams.role || '';
  const selectedYear = resolvedSearchParams.txYear || '';
  const selectedMonth = resolvedSearchParams.txMonth || '';
  const pageSize = 25;
  const agent = await getAgent(ceaNumber);
  if (!agent) notFound();

  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.txPage || '1', 10) || 1);

  const [agentSummary, transactionFilters, initialTransactionPage, agentMovements] = await Promise.all([
    getAgentSummary(ceaNumber),
    getAgentTransactionFilters(ceaNumber, selectedYear || null),
    getAgentTransactionsPage({
      ceaNumber,
      page: currentPage,
      pageSize,
      propertyType: selectedPropertyType || null,
      transactionType: selectedTransactionType || null,
      role: selectedRole || null,
      year: selectedYear || null,
      monthIndex: selectedMonth || null,
    }),
    getAgentMovements(ceaNumber, 8),
  ]);
  const totalTransactions = agentSummary?.totalTransactions ?? Math.max(agent.total_transactions || 0, 0);
  const latestTransaction = agentSummary?.latestActivity || null;

  const topPropertyTypes = (agentSummary?.topPropertyTypes || [])
    .map((item) => [item.value, item.count] as const)
    .slice(0, 4);
  const topTransactionTypes = (agentSummary?.topTransactionTypes || [])
    .map((item) => [item.value, item.count] as const)
    .slice(0, 4);
  const topRoles = (agentSummary?.topRoles || [])
    .map((item) => [item.value, item.count] as const)
    .slice(0, 3);
  const topRecentAreas = (agentSummary?.topRecentAreas || [])
    .map((item) => [item.area, item.count] as const)
    .slice(0, 8);
  // Build continuous 12-month range (fill gaps with zero)
  const MONTH_ABBREVS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const monthlyActivity = new Map(
    (agentSummary?.monthlyActivity || []).map((item) => [item.bucket, item.count] as const)
  );
  const sortedMonths = [...monthlyActivity.entries()]
    .sort((a, b) => getTransactionSortKey(b[0]) - getTransactionSortKey(a[0]));
  const recentMonths: [string, number][] = [];
  if (sortedMonths.length > 0) {
    const latest = sortedMonths[0][0];
    const latestMatch = latest.match(/^([A-Z]{3})-(\d{4})$/);
    if (latestMatch) {
      let m = MONTH_INDEX[latestMatch[1]] ?? 0;
      let y = Number(latestMatch[2]);
      for (let i = 0; i < 12; i++) {
        const key = `${MONTH_ABBREVS[m]}-${y}`;
        recentMonths.unshift([key, monthlyActivity.get(key) || 0]);
        m--;
        if (m < 0) { m = 11; y--; }
      }
    }
  }
  const monthlyPeak = Math.max(...recentMonths.map(([, count]) => count), 1);
  const uniqueAreas = agentSummary?.uniqueAreaCount ?? 0;

  // Fetch comparable agents based on computed data
  const topArea = topRecentAreas.length > 0 ? topRecentAreas[0][0] : null;
  const topPropertyType = topPropertyTypes.length > 0 ? topPropertyTypes[0][0] : null;
  const [similarVolumeAgents, sameAreaAgents, samePropertyTypeAgents] = await Promise.all([
    getSimilarVolumeAgents({ ceaNumber, totalTransactions, limit: 4 }),
    topArea ? getSameAreaAgents({ ceaNumber, area: topArea, limit: 4 }) : Promise.resolve([]),
    topPropertyType ? getSamePropertyTypeAgents({ ceaNumber, propertyType: topPropertyType, limit: 4 }) : Promise.resolve([]),
  ]);

  const filters = {
    propertyTypes: transactionFilters.propertyTypes,
    transactionTypes: transactionFilters.transactionTypes,
    roles: transactionFilters.roles,
    years: transactionFilters.years,
  };
  const monthOptions = MONTH_OPTIONS.filter((option) =>
    transactionFilters.monthIndexes.includes(Number(option.value))
  );

  let transactionPage = initialTransactionPage;
  let totalPages = Math.max(1, Math.ceil(transactionPage.total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  if (safeCurrentPage !== currentPage) {
    transactionPage = await getAgentTransactionsPage({
      ceaNumber,
      page: safeCurrentPage,
      pageSize,
      propertyType: selectedPropertyType || null,
      transactionType: selectedTransactionType || null,
      role: selectedRole || null,
      year: selectedYear || null,
      monthIndex: selectedMonth || null,
    });
    totalPages = Math.max(1, Math.ceil(transactionPage.total / pageSize));
  }
  const startIndex = transactionPage.total === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = transactionPage.total === 0 ? 0 : Math.min(startIndex + transactionPage.rows.length, transactionPage.total);
  const paginatedTransactions = transactionPage.rows;
  const txSearchParams: Record<string, string> = {};
  if (selectedPropertyType) txSearchParams.propertyType = selectedPropertyType;
  if (selectedTransactionType) txSearchParams.transactionType = selectedTransactionType;
  if (selectedRole) txSearchParams.role = selectedRole;
  if (selectedYear) txSearchParams.txYear = selectedYear;
  if (selectedMonth) txSearchParams.txMonth = selectedMonth;

  const homeUrl = await getRequestAbsoluteUrl('/');
  const leaderboardUrl = await getRequestAbsoluteUrl('/leaderboard');
  const profileUrl = await getRequestAbsoluteUrl(`/agent/${ceaNumber}`);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: agent.name,
    url: profileUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: 'Leaderboard', item: leaderboardUrl },
        { '@type': 'ListItem', position: 3, name: agent.name, item: profileUrl },
      ],
    },
    mainEntity: {
      '@type': 'Person',
      name: agent.name,
      identifier: agent.cea_number,
      worksFor: agent.agency ? { '@type': 'Organization', name: agent.agency } : undefined,
    },
  };

  const BAR_COLORS = [
    'from-blue-500 to-blue-400',
    'from-blue-500/80 to-sky-400/80',
    'from-sky-500/70 to-cyan-400/70',
    'from-cyan-500/60 to-teal-400/60',
  ];

  const ROLE_COLORS = [
    'from-blue-500 to-blue-400',
    'from-emerald-500 to-emerald-400',
    'from-amber-500 to-amber-400',
  ];

  const maxRole = topRoles.length > 0 ? topRoles[0][1] : 1;

  function getMovementBadge(type: string): { label: string; cls: string } {
    switch (type) {
      case 'new_registration':
        return { label: 'New', cls: 'bg-emerald-500/10 text-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-400' };
      case 'deregistration':
        return { label: 'Left', cls: 'bg-rose-500/10 text-rose-400 dark:bg-rose-500/10 dark:text-rose-400' };
      case 'reregistration':
        return { label: 'Rejoined', cls: 'bg-sky-500/10 text-sky-400 dark:bg-sky-500/10 dark:text-sky-400' };
      default:
        return { label: 'Transfer', cls: 'bg-amber-500/10 text-amber-400 dark:bg-amber-500/10 dark:text-amber-400' };
    }
  }

  return (
    <div className="space-y-5 py-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          ...(agent.agency ? [{ label: agent.agency, href: `/agency/${slugifySegment(agent.agency)}` }] : []),
          { label: agent.name },
        ]}
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 sm:rounded-[28px]">
        {/* Accent gradient line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />

        <div className="bg-gradient-to-br from-zinc-100 via-white to-zinc-50 px-5 pb-5 pt-6 dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:px-7 sm:pb-7 sm:pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                {/* Initials avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                  {agent.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl md:text-3xl">
                    {agent.name}
                  </h1>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <span>CEA {ceaNumber}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                    <span className="truncate">{agent.agency || 'Independent'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-5 sm:shrink-0 sm:text-right">
              <div>
                <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-3xl">{formatCount(totalTransactions)}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-zinc-400">Transactions</div>
              </div>
              <div className="border-l border-zinc-200 pl-5 dark:border-zinc-800">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{formatDateLabel(latestTransaction)}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-zinc-400">Latest</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 md:grid-cols-4">
          {[
            { label: 'Agency', value: agent.agency || '—' },
            { label: 'Phone', kind: 'phone' as const, contact: agent.phone },
            { label: 'Email', kind: 'email' as const, contact: agent.email },
            { label: 'Registration', value: `${formatDateLabel(agent.registration_start)} — ${formatDateLabel(agent.registration_end)}` },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3.5 dark:bg-zinc-950 sm:px-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{item.label}</div>
              <div className="mt-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {item.contact !== undefined ? <RevealContact kind={item.kind!} value={item.contact} /> : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Stats Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Transaction Snapshot */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex items-start justify-between">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Transaction Snapshot</div>
            <div className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold tabular-nums text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              {formatCount(totalTransactions)} total
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {topTransactionTypes.map(([type, count]) => {
              const pct = totalTransactions > 0 ? Math.round((count / totalTransactions) * 100) : 0;
              return (
                <div key={type} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{formatLabel(type)}</div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{formatCount(count)}</span>
                    <span className="text-[11px] text-zinc-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Mix */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Property Mix</div>
          <div className="mt-4 space-y-3">
            {topPropertyTypes.map(([type, count], i) => {
              const pct = totalTransactions > 0 ? Math.round((count / totalTransactions) * 100) : 0;
              return (
                <div key={type}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{formatLabel(type)}</span>
                    <span className="text-xs tabular-nums text-zinc-400">{formatCount(count)} <span className="text-zinc-300 dark:text-zinc-600">({pct}%)</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${BAR_COLORS[i] || BAR_COLORS[BAR_COLORS.length - 1]}`}
                      style={{ width: `${Math.max(6, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Representation + Coverage */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Representation</div>
            <div className="mt-3 space-y-2.5">
              {topRoles.map(([role, count], i) => (
                <div key={role} className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-xs font-medium text-zinc-500">{formatLabel(role)}</div>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-md bg-gradient-to-r ${ROLE_COLORS[i] || ROLE_COLORS[ROLE_COLORS.length - 1]}`}
                      style={{ width: `${Math.max(8, Math.round((count / maxRole) * 100))}%` }}
                    />
                    <span className="relative z-10 flex h-full items-center px-2 text-[11px] font-bold tabular-nums text-white drop-shadow-sm">
                      {formatCount(count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Coverage</div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Unique areas transacted in</span>
                <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{formatCount(uniqueAreas)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Property categories (e.g. HDB, Condo)</span>
                <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{formatCount(filters.propertyTypes.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Deal types (e.g. Resale, Rental)</span>
                <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{formatCount(filters.transactionTypes.length)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 12-Month Activity ───────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">12-Month Activity</div>
            <div className="mt-0.5 text-xs text-zinc-400">Monthly transaction volume</div>
          </div>
          <div className="text-xs text-zinc-400">
            Peak: <span className="font-bold text-zinc-700 dark:text-zinc-200">{formatCount(monthlyPeak)}</span>
          </div>
        </div>
        {/* Grid lines */}
        <div className="relative mt-5">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '32px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t border-dashed border-zinc-100 dark:border-zinc-800/60" />
            ))}
          </div>
          <div className="relative grid grid-cols-12 items-end gap-1.5 sm:gap-2">
            {recentMonths.map(([bucket, count]) => {
              const height = monthlyPeak > 0 ? Math.round((count / monthlyPeak) * 100) : 0;
              return (
                <div key={bucket} className="flex flex-col items-center gap-1">
                  <div className="text-[10px] font-medium tabular-nums text-zinc-400 sm:text-[11px]">{count > 0 ? formatCount(count) : ''}</div>
                  <div
                    className={`w-full rounded-t-md ${count > 0 ? 'bg-gradient-to-t from-blue-600 to-sky-400' : 'bg-zinc-100 dark:bg-zinc-800/40'}`}
                    style={{ height: `${Math.max(4, height)}px`, minHeight: '4px' }}
                    aria-hidden="true"
                  />
                  <div className="text-center text-[9px] leading-tight text-zinc-400 sm:text-[10px]">
                    {(() => { const f = formatMonthBucket(bucket); return f ? <>{f.month}<br />{f.year}</> : bucket; })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Deals by Area ────────────────────────────── */}
      {topRecentAreas.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Active Areas</div>
              <div className="mt-0.5 text-xs text-zinc-400">Based on the latest 60 transactions</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {topRecentAreas.map(([area, count], index) => (
              <div
                key={area}
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pl-1.5 pr-3.5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
              >
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${index < 3 ? 'bg-gradient-to-br from-blue-600 to-sky-500' : 'bg-zinc-400 dark:bg-zinc-600'}`}>
                  {index + 1}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{area}</span>
                <span className="text-[10px] tabular-nums text-zinc-400">{formatCount(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Movement History ─────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Movement History</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Agency transfers and registration events</p>
          </div>
          <Link
            href="/movements"
            className="rounded-full bg-zinc-200/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 transition hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            View all
          </Link>
        </div>

        {agentMovements.length > 0 ? (
          <>
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Date</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Type</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">From</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/40 dark:bg-zinc-950/80">
                  {agentMovements.map((movement) => {
                    const movementColumns = getMovementColumns(movement);
                    const badge = getMovementBadge(movement.type);

                    return (
                      <tr key={movement.id} className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                        <td className="px-5 py-3 text-xs tabular-nums text-zinc-500">{formatDateLabel(movement.date)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-zinc-700 dark:text-zinc-200">
                          {movementColumns.from.agencySlug ? (
                            <Link href={`/agency/${movementColumns.from.agencySlug}`} className="transition hover:text-blue-600 dark:hover:text-blue-400">
                              {movementColumns.from.label}
                            </Link>
                          ) : movementColumns.from.label}
                        </td>
                        <td className="px-5 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-100">
                          {movementColumns.to.agencySlug ? (
                            <Link href={`/agency/${movementColumns.to.agencySlug}`} className="text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                              {movementColumns.to.label}
                            </Link>
                          ) : movementColumns.to.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40 md:hidden">
              {agentMovements.map((movement) => {
                const movementColumns = getMovementColumns(movement);
                const badge = getMovementBadge(movement.type);

                return (
                  <div key={movement.id} className="bg-white px-4 py-3.5 dark:bg-zinc-950/80">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] tabular-nums text-zinc-400">{formatDateLabel(movement.date)}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {movementColumns.from.agencySlug ? (
                        <Link href={`/agency/${movementColumns.from.agencySlug}`} className="text-zinc-700 transition hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400">{movementColumns.from.label}</Link>
                      ) : <span className="text-zinc-700 dark:text-zinc-200">{movementColumns.from.label}</span>}
                      {' '}<span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>{' '}
                      {movementColumns.to.agencySlug ? (
                        <Link href={`/agency/${movementColumns.to.agencySlug}`} className="font-medium text-blue-600 dark:text-blue-400">{movementColumns.to.label}</Link>
                      ) : <span className="font-medium text-zinc-800 dark:text-zinc-100">{movementColumns.to.label}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex min-h-[180px] flex-col items-center justify-center bg-white px-6 py-10 text-center dark:bg-zinc-950/80">
            <svg className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            <p className="mt-3 text-sm text-zinc-400">No movement history recorded</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-400/70">Agency transfers and registration events will appear here when available.</p>
          </div>
        )}
      </section>

      {/* ── Transaction History ──────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Transaction History</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {transactionPage.total === 0 ? '0' : `${startIndex + 1}–${endIndex}`} of {formatCount(transactionPage.total)} records
              </p>
            </div>
            <div className="text-[11px] tabular-nums text-zinc-400">
              Page {safeCurrentPage}/{totalPages}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {[
              { label: 'Property', param: 'propertyType', selected: selectedPropertyType, values: filters.propertyTypes },
              { label: 'Deal Type', param: 'transactionType', selected: selectedTransactionType, values: filters.transactionTypes },
              { label: 'Role', param: 'role', selected: selectedRole, values: filters.roles },
              { label: 'Year', param: 'txYear', selected: selectedYear, values: filters.years.map(String) },
            ].map((group) => (
              <div key={group.label}>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{group.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={buildAgentTransactionFilterHref(ceaNumber, {
                      ...(group.param !== 'propertyType' && selectedPropertyType ? { propertyType: selectedPropertyType } : {}),
                      ...(group.param !== 'transactionType' && selectedTransactionType ? { transactionType: selectedTransactionType } : {}),
                      ...(group.param !== 'role' && selectedRole ? { role: selectedRole } : {}),
                      ...(group.param !== 'txYear' && selectedYear ? { txYear: selectedYear } : {}),
                      ...(group.param !== 'txMonth' && selectedMonth ? { txMonth: selectedMonth } : {}),
                    })}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${!group.selected ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                  >
                    All
                  </Link>
                  {group.values.slice(0, 6).map((value) => (
                    <Link
                      key={value}
                      href={buildAgentTransactionFilterHref(ceaNumber, {
                        ...(group.param === 'propertyType' ? { propertyType: value } : selectedPropertyType ? { propertyType: selectedPropertyType } : {}),
                        ...(group.param === 'transactionType' ? { transactionType: value } : selectedTransactionType ? { transactionType: selectedTransactionType } : {}),
                        ...(group.param === 'role' ? { role: value } : selectedRole ? { role: selectedRole } : {}),
                        ...(group.param === 'txYear' ? { txYear: value } : selectedYear ? { txYear: selectedYear } : {}),
                        ...(group.param !== 'txMonth' && selectedMonth ? { txMonth: selectedMonth } : {}),
                      })}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${group.selected === value ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                    >
                      {group.param === 'txYear' ? value : formatLabel(value)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Month</div>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    ...(selectedPropertyType ? { propertyType: selectedPropertyType } : {}),
                    ...(selectedTransactionType ? { transactionType: selectedTransactionType } : {}),
                    ...(selectedRole ? { role: selectedRole } : {}),
                    ...(selectedYear ? { txYear: selectedYear } : {}),
                  })}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${!selectedMonth ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                >
                  All
                </Link>
                {monthOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={buildAgentTransactionFilterHref(ceaNumber, {
                      ...(selectedPropertyType ? { propertyType: selectedPropertyType } : {}),
                      ...(selectedTransactionType ? { transactionType: selectedTransactionType } : {}),
                      ...(selectedRole ? { role: selectedRole } : {}),
                      ...(selectedYear ? { txYear: selectedYear } : {}),
                      txMonth: option.value,
                    })}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${selectedMonth === option.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="max-h-[900px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-950">
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Property</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Type</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Role</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">District</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                {paginatedTransactions.map((tx, i) => {
                  const { district, area } = splitLocation(tx.location);
                  return (
                    <tr key={i} className="bg-white transition hover:bg-zinc-50 dark:bg-zinc-950/80 dark:hover:bg-zinc-900/40">
                      <td className="px-5 py-2.5 text-xs tabular-nums text-zinc-500">{formatDateLabel(tx.date)}</td>
                      <td className="px-5 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-200">{formatLabel(tx.property_type)}</td>
                      <td className="px-5 py-2.5 text-xs text-zinc-600 dark:text-zinc-300">{formatLabel(tx.transaction_type)}</td>
                      <td className="px-5 py-2.5 text-xs text-zinc-500">{formatLabel(tx.role)}</td>
                      <td className="px-5 py-2.5 text-xs tabular-nums text-zinc-500">{district}</td>
                      <td className="px-5 py-2.5 text-xs text-zinc-400">{area}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/40 md:hidden">
          {paginatedTransactions.map((tx, i) => {
            const { district, area } = splitLocation(tx.location);
            return (
              <div key={i} className="bg-white px-4 py-3 dark:bg-zinc-950/80">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{formatLabel(tx.transaction_type)}</div>
                    <div className="mt-0.5 text-[11px] tabular-nums text-zinc-400">{formatDateLabel(tx.date)}</div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {formatLabel(tx.role)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="font-medium uppercase tracking-wider text-zinc-400">Property</div>
                    <div className="mt-0.5 text-zinc-600 dark:text-zinc-300">{formatLabel(tx.property_type)}</div>
                  </div>
                  <div>
                    <div className="font-medium uppercase tracking-wider text-zinc-400">D{district}</div>
                    <div className="mt-0.5 truncate text-zinc-500">{area}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {transactionPage.total > pageSize && (
          <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              basePath={`/agent/${ceaNumber}`}
              searchParams={txSearchParams}
              pageParam="txPage"
            />
          </div>
        )}
      </div>

      {/* ── Insights + Comparable Agents ─────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">What this means</h2>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Use this page to check whether the agent&apos;s visible activity aligns with the property segment and role you need. Fit and recency matter more than volume.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {topPropertyTypes.slice(0, 3).map(([type]) => (
              <Link key={type} href={`/property-type/${slugifySegment(type)}`}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                {formatLabel(type)}
              </Link>
            ))}
            {topTransactionTypes.slice(0, 2).map(([type]) => (
              <Link key={type} href={`/transaction-type/${slugifySegment(type)}`}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                {formatLabel(type)}
              </Link>
            ))}
            {agent.agency && (
              <Link href={`/agency/${slugifySegment(agent.agency)}`}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                {agent.agency}
              </Link>
            )}
          </div>
        </section>

        {similarVolumeAgents.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Similar transaction volume</h2>
            <p className="mt-1 text-xs text-zinc-400">Agents with comparable transaction counts</p>
            <div className="mt-3 space-y-2">
              {similarVolumeAgents.map((comparable) => (
                <Link key={comparable.cea_number} href={`/agent/${comparable.cea_number}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 transition hover:border-zinc-200 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {comparable.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">{comparable.name}</div>
                    <div className="text-[11px] text-zinc-400">{comparable.agency || 'Independent'}</div>
                  </div>
                  <div className="text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">{formatCount(comparable.total_transactions || 0)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {sameAreaAgents.length > 0 && topArea && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Active in {topArea}</h2>
                <p className="mt-1 text-xs text-zinc-400">Other agents frequently transacting here</p>
              </div>
              <Link href={`/area/${slugifySegment(topArea)}`}
                className="shrink-0 text-[11px] font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all &rarr;
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {sameAreaAgents.map((comparable) => (
                <Link key={comparable.cea_number} href={`/agent/${comparable.cea_number}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 transition hover:border-zinc-200 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {comparable.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">{comparable.name}</div>
                    <div className="text-[11px] text-zinc-400">{comparable.agency || 'Independent'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">{formatCount(comparable.area_count)}</div>
                    <div className="text-[10px] text-zinc-400">in area</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {samePropertyTypeAgents.length > 0 && topPropertyType && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{formatLabel(topPropertyType)} specialists</h2>
                <p className="mt-1 text-xs text-zinc-400">Agents focused on {formatLabel(topPropertyType).toLowerCase()} properties</p>
              </div>
              <Link href={`/property-type/${slugifySegment(topPropertyType)}`}
                className="shrink-0 text-[11px] font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                View all &rarr;
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {samePropertyTypeAgents.map((comparable) => (
                <Link key={comparable.cea_number} href={`/agent/${comparable.cea_number}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3.5 py-2.5 transition hover:border-zinc-200 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:border-zinc-700">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                    {comparable.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">{comparable.name}</div>
                    <div className="text-[11px] text-zinc-400">{comparable.agency || 'Independent'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">{formatCount(comparable.type_count)}</div>
                    <div className="text-[10px] text-zinc-400">{formatLabel(topPropertyType).toLowerCase()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
