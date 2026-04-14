import type { Metadata } from 'next';
import { getAgent, getAgentMovements, getAgentTransactions, getComparableAgents, type MovementRow } from '@/lib/queries';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';
import Breadcrumbs from '@/components/Breadcrumbs';
import RevealContact from '@/components/RevealContact';
import Pagination from '@/components/Pagination';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { slugifySegment } from '@/lib/format';

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

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
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

function parseTransactionPeriod(value: string): { year: number | null; monthIndex: number | null } {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (periodMatch) {
    return {
      year: Number(periodMatch[2]),
      monthIndex: MONTH_INDEX[periodMatch[1]] ?? null,
    };
  }

  const dateMatch = value.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (dateMatch) {
    return {
      year: Number(dateMatch[1]),
      monthIndex: Number(dateMatch[2]) - 1,
    };
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      monthIndex: parsed.getMonth(),
    };
  }

  return { year: null, monthIndex: null };
}

function formatMonthBucket(value: string): string {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (!periodMatch) return value;
  return `${periodMatch[1].charAt(0)}${periodMatch[1].slice(1).toLowerCase()} ${periodMatch[2]}`;
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

  const [transactions, comparableAgents, agentMovements] = await Promise.all([
    getAgentTransactions(ceaNumber),
    getComparableAgents({
      ceaNumber,
      agency: agent.agency,
      limit: 5,
    }),
    getAgentMovements(ceaNumber, 8),
  ]);
  const totalTransactions = transactions.length > 0 ? transactions.length : Math.max(agent.total_transactions || 0, 0);

  // Group transaction stats
  const propertyTypes = new Map<string, number>();
  const transactionTypes = new Map<string, number>();
  const roles = new Map<string, number>();
  const monthlyActivity = new Map<string, number>();
  for (const tx of transactions) {
    propertyTypes.set(tx.property_type, (propertyTypes.get(tx.property_type) || 0) + 1);
    transactionTypes.set(tx.transaction_type, (transactionTypes.get(tx.transaction_type) || 0) + 1);
    roles.set(tx.role, (roles.get(tx.role) || 0) + 1);
    monthlyActivity.set(tx.date, (monthlyActivity.get(tx.date) || 0) + 1);
  }

  const latestTransaction = transactions[0]?.date || null;

  const topPropertyTypes = [...propertyTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topTransactionTypes = [...transactionTypes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topRoles = [...roles.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const recentAreaCounts = new Map<string, number>();
  for (const tx of transactions.slice(0, 60)) {
    const { area } = splitLocation(tx.location);
    if (area === '—') continue;
    recentAreaCounts.set(area, (recentAreaCounts.get(area) || 0) + 1);
  }
  const topRecentAreas = [...recentAreaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const recentMonths = [...monthlyActivity.entries()]
    .sort((a, b) => getTransactionSortKey(b[0]) - getTransactionSortKey(a[0]))
    .slice(0, 12)
    .reverse();
  const monthlyPeak = Math.max(...recentMonths.map(([, count]) => count), 1);
  const uniqueAreas = new Set(
    transactions
      .map((tx) => splitLocation(tx.location).area)
      .filter((area) => area !== '—')
  ).size;
  const filters = {
    propertyTypes: [...propertyTypes.keys()].sort(),
    transactionTypes: [...transactionTypes.keys()].sort(),
    roles: [...roles.keys()].sort(),
    years: [...new Set(
      transactions
        .map((tx) => parseTransactionPeriod(tx.date).year)
        .filter((year): year is number => year !== null)
    )].sort((a, b) => b - a),
  };
  const monthOptions = MONTH_OPTIONS.filter((option) => {
    const monthIndex = Number(option.value);
    return transactions.some((tx) => {
      const period = parseTransactionPeriod(tx.date);
      if (selectedYear && String(period.year) !== selectedYear) return false;
      return period.monthIndex === monthIndex;
    });
  });
  const filteredTransactions = transactions.filter((tx) => {
    const period = parseTransactionPeriod(tx.date);
    if (selectedPropertyType && tx.property_type !== selectedPropertyType) return false;
    if (selectedTransactionType && tx.transaction_type !== selectedTransactionType) return false;
    if (selectedRole && tx.role !== selectedRole) return false;
    if (selectedYear && String(period.year) !== selectedYear) return false;
    if (selectedMonth && String(period.monthIndex) !== selectedMonth) return false;
    return true;
  });
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams.txPage || '1', 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
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

  return (
    <div className="space-y-6 py-2">
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
      <Link href="/leaderboard" className="inline-block text-sm text-zinc-400 transition hover:text-zinc-100">
        &larr; Back to Leaderboard
      </Link>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Profile summary</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {agent.name} is listed on PropNext Intel with public registration context, visible transaction history, and market-position signals that help consumers judge recency, specialization, and fit.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Key takeaways</div>
            <p className="mt-2 text-sm text-zinc-300">Latest visible activity: {formatDateLabel(latestTransaction)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Main specialty</div>
            <p className="mt-2 text-sm text-zinc-300">{topPropertyTypes[0] ? formatLabel(topPropertyTypes[0][0]) : 'No visible mix yet'}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Agency context</div>
            <p className="mt-2 text-sm text-zinc-300">{agent.agency || 'Independent / unavailable'}</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-6 py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Agent Profile</div>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
                {agent.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
                  CEA {ceaNumber}
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1">
                  {agent.agency || 'Independent'}
                </span>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-3 text-right">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Verified Transactions</div>
                <div className="mt-1 text-3xl font-semibold text-zinc-50">{formatCount(totalTransactions)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Latest Activity</div>
                <div className="mt-1 text-sm font-medium text-zinc-200">{formatDateLabel(latestTransaction)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-6 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Agency</div>
            <div className="mt-1 text-sm font-medium text-zinc-100">{agent.agency || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Phone</div>
            <div className="mt-1 text-sm text-zinc-100">
              <RevealContact kind="phone" value={agent.phone} />
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Email</div>
            <div className="mt-1 text-sm text-zinc-100">
              <RevealContact kind="email" value={agent.email} />
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Registration</div>
            <div className="mt-1 text-sm text-zinc-100">
              {formatDateLabel(agent.registration_start)} to {formatDateLabel(agent.registration_end)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-100">Transaction Snapshot</div>
              <div className="mt-1 text-sm text-zinc-500">How this agent&apos;s verified records break down.</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold text-zinc-50">{formatCount(totalTransactions)}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Total Records</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {topTransactionTypes.map(([type, count]) => (
              <div key={type} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{formatLabel(type)}</div>
                <div className="mt-2 text-xl font-semibold text-zinc-50">{formatCount(count)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Property Mix</div>
          <div className="mt-1 text-sm text-zinc-500">Top property types by transaction count.</div>
          <div className="mt-3 space-y-2">
            {topPropertyTypes.map(([type, count]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{formatLabel(type)}</span>
                  <span className="font-medium text-zinc-100">{formatCount(count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-zinc-200"
                    style={{ width: `${Math.max(8, Math.round((count / totalTransactions) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Representation</div>
          <div className="mt-1 text-sm text-zinc-500">Most common roles across completed deals.</div>
          <div className="mt-3 space-y-2">
            {topRoles.map(([role, count]) => (
              <div key={role} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
                <span className="text-zinc-300">{formatLabel(role)}</span>
                <span className="font-medium text-zinc-100">{formatCount(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-100">12-Month Activity</div>
              <div className="mt-1 text-sm text-zinc-500">Recent monthly transaction volume for this agent.</div>
            </div>
            <div className="text-sm text-zinc-400">
              Peak month: <span className="font-medium text-zinc-100">{formatCount(monthlyPeak)}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-12 items-end gap-2">
            {recentMonths.map(([bucket, count]) => (
              <div key={bucket} className="flex flex-col items-center gap-2">
                <div className="text-[11px] text-zinc-500">{formatCount(count)}</div>
                <div
                  className="w-full rounded-t-md bg-zinc-100/90"
                  style={{ height: `${Math.max(20, Math.round((count / monthlyPeak) * 120))}px` }}
                  aria-hidden="true"
                />
                <div className="text-center text-[11px] text-zinc-500">{formatMonthBucket(bucket)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <div className="text-sm font-medium text-zinc-100">Coverage Snapshot</div>
          <div className="mt-1 text-sm text-zinc-500">Useful context at a glance.</div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Unique areas</span>
              <span className="text-lg font-semibold text-zinc-50">{formatCount(uniqueAreas)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Property categories</span>
              <span className="text-lg font-semibold text-zinc-50">{formatCount(propertyTypes.size)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <span className="text-sm text-zinc-400">Deal types</span>
              <span className="text-lg font-semibold text-zinc-50">{formatCount(transactionTypes.size)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-zinc-100">Recent Deals by Area</div>
            <div className="mt-1 text-sm text-zinc-500">Most active locations across the latest transaction records.</div>
          </div>
          <div className="text-sm text-zinc-400">
            Based on the latest <span className="font-medium text-zinc-100">{Math.min(60, transactions.length)}</span> records
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {topRecentAreas.map(([area, count], index) => (
            <div
              key={area}
              className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-950">
                {index + 1}
              </span>
              <span className="text-sm text-zinc-200">{area}</span>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                {formatCount(count)} deals
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Movement History</h2>
              <p className="mt-1 text-sm text-zinc-500">Agency transfers and registration events tied to this profile.</p>
            </div>
            <Link
              href="/movements"
              className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
            >
              View all movements
            </Link>
          </div>
        </div>

        {agentMovements.length > 0 ? (
          <>
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">From</th>
                    <th className="w-12 px-2 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">To</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {agentMovements.map((movement) => {
                    const movementColumns = getMovementColumns(movement);

                    return (
                      <tr key={movement.id} className="transition hover:bg-zinc-900/60">
                        <td className="px-6 py-4 text-sm text-zinc-300">{formatDateLabel(movement.date)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-100">
                          {movementColumns.from.agencySlug ? (
                            <Link
                              href={`/agency/${movementColumns.from.agencySlug}`}
                              className="transition hover:text-white"
                            >
                              {movementColumns.from.label}
                            </Link>
                          ) : movementColumns.from.label}
                        </td>
                        <td className="px-2 py-4 text-center text-zinc-500">-&gt;</td>
                        <td className="px-6 py-4 text-sm text-zinc-100">
                          {movementColumns.to.agencySlug ? (
                            <Link
                              href={`/agency/${movementColumns.to.agencySlug}`}
                              className="text-blue-400 transition hover:text-blue-300"
                            >
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

            <div className="divide-y divide-zinc-900 md:hidden">
              {agentMovements.map((movement) => {
                const movementColumns = getMovementColumns(movement);

                return (
                  <div key={movement.id} className="space-y-3 px-5 py-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{formatDateLabel(movement.date)}</div>
                    <div className="grid gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">From</div>
                        <div className="mt-1 text-sm text-zinc-100">
                          {movementColumns.from.agencySlug ? (
                            <Link
                              href={`/agency/${movementColumns.from.agencySlug}`}
                              className="transition hover:text-white"
                            >
                              {movementColumns.from.label}
                            </Link>
                          ) : movementColumns.from.label}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">To</div>
                        <div className="mt-1 text-sm text-zinc-100">
                          {movementColumns.to.agencySlug ? (
                            <Link
                              href={`/agency/${movementColumns.to.agencySlug}`}
                              className="text-blue-400 transition hover:text-blue-300"
                            >
                              {movementColumns.to.label}
                            </Link>
                          ) : movementColumns.to.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <div className="text-3xl text-zinc-600">-&gt;</div>
            <p className="mt-5 text-lg text-zinc-400">No movement history recorded for this agent</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              We&apos;ll show agency transfers, new registrations, and deregistrations here when public movement records are available.
            </p>
          </div>
        )}
      </section>

      {/* Transaction History */}
      <div className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950/90">
        <div className="border-b border-zinc-800 px-6 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Transaction History</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Showing records {filteredTransactions.length === 0 ? 0 : startIndex + 1} to {endIndex} of {formatCount(filteredTransactions.length)}.
              </p>
            </div>
            <div className="text-sm text-zinc-400">
              Page <span className="font-medium text-zinc-100">{safeCurrentPage}</span> of <span className="font-medium text-zinc-100">{totalPages}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Property</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    transactionType: selectedTransactionType || undefined,
                    role: selectedRole || undefined,
                    txYear: selectedYear || undefined,
                    txMonth: selectedMonth || undefined,
                  })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${!selectedPropertyType ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                >
                  All
                </Link>
                {filters.propertyTypes.slice(0, 6).map((value) => {
                  return (
                    <Link
                      key={value}
                      href={buildAgentTransactionFilterHref(ceaNumber, {
                        propertyType: value,
                        transactionType: selectedTransactionType || undefined,
                        role: selectedRole || undefined,
                        txYear: selectedYear || undefined,
                        txMonth: selectedMonth || undefined,
                      })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${selectedPropertyType === value ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                    >
                      {formatLabel(value)}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Deal Type</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    propertyType: selectedPropertyType || undefined,
                    role: selectedRole || undefined,
                    txYear: selectedYear || undefined,
                    txMonth: selectedMonth || undefined,
                  })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${!selectedTransactionType ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                >
                  All
                </Link>
                {filters.transactionTypes.slice(0, 6).map((value) => {
                  return (
                    <Link
                      key={value}
                      href={buildAgentTransactionFilterHref(ceaNumber, {
                        propertyType: selectedPropertyType || undefined,
                        transactionType: value,
                        role: selectedRole || undefined,
                        txYear: selectedYear || undefined,
                        txMonth: selectedMonth || undefined,
                      })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${selectedTransactionType === value ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                    >
                      {formatLabel(value)}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Role</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    propertyType: selectedPropertyType || undefined,
                    transactionType: selectedTransactionType || undefined,
                    txYear: selectedYear || undefined,
                    txMonth: selectedMonth || undefined,
                  })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${!selectedRole ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                >
                  All
                </Link>
                {filters.roles.slice(0, 6).map((value) => {
                  return (
                    <Link
                      key={value}
                      href={buildAgentTransactionFilterHref(ceaNumber, {
                        propertyType: selectedPropertyType || undefined,
                        transactionType: selectedTransactionType || undefined,
                        role: value,
                        txYear: selectedYear || undefined,
                        txMonth: selectedMonth || undefined,
                      })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${selectedRole === value ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                    >
                      {formatLabel(value)}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Year</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    propertyType: selectedPropertyType || undefined,
                    transactionType: selectedTransactionType || undefined,
                    role: selectedRole || undefined,
                    txMonth: selectedMonth || undefined,
                  })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${!selectedYear ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                >
                  All
                </Link>
                {filters.years.slice(0, 6).map((value) => (
                  <Link
                    key={value}
                    href={buildAgentTransactionFilterHref(ceaNumber, {
                      propertyType: selectedPropertyType || undefined,
                      transactionType: selectedTransactionType || undefined,
                      role: selectedRole || undefined,
                      txYear: String(value),
                    })}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selectedYear === String(value) ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                  >
                    {value}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">Month</div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildAgentTransactionFilterHref(ceaNumber, {
                    propertyType: selectedPropertyType || undefined,
                    transactionType: selectedTransactionType || undefined,
                    role: selectedRole || undefined,
                    txYear: selectedYear || undefined,
                  })}
                  className={`rounded-full border px-3 py-1 text-xs transition ${!selectedMonth ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
                >
                  All
                </Link>
                {monthOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={buildAgentTransactionFilterHref(ceaNumber, {
                      propertyType: selectedPropertyType || undefined,
                      transactionType: selectedTransactionType || undefined,
                      role: selectedRole || undefined,
                      txYear: selectedYear || undefined,
                      txMonth: option.value,
                    })}
                    className={`rounded-full border px-3 py-1 text-xs transition ${selectedMonth === option.value ? 'border-zinc-100 bg-zinc-100 text-zinc-950' : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}`}
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
              <thead className="sticky top-0 z-10 bg-zinc-950">
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">District</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {paginatedTransactions.map((tx, i) => {
                  const { district, area } = splitLocation(tx.location);

                  return (
                    <tr key={i} className="transition hover:bg-zinc-900/60">
                      <td className="px-6 py-3 text-xs text-zinc-300">{formatDateLabel(tx.date)}</td>
                      <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.property_type)}</td>
                      <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.transaction_type)}</td>
                      <td className="px-6 py-3 text-xs text-zinc-300">{formatLabel(tx.role)}</td>
                      <td className="px-6 py-3 text-xs text-zinc-300">{district}</td>
                      <td className="px-6 py-3 text-xs text-zinc-400">{area}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="divide-y divide-zinc-900 md:hidden">
          {paginatedTransactions.map((tx, i) => {
            const { district, area } = splitLocation(tx.location);

            return (
              <div key={i} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{formatLabel(tx.transaction_type)}</div>
                    <div className="mt-1 text-xs text-zinc-500">{formatDateLabel(tx.date)}</div>
                  </div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-300">
                    {formatLabel(tx.role)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="uppercase tracking-[0.16em] text-zinc-500">Property</div>
                    <div className="mt-1 text-zinc-300">{formatLabel(tx.property_type)}</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.16em] text-zinc-500">District</div>
                    <div className="mt-1 text-zinc-300">{district}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="uppercase tracking-[0.16em] text-zinc-500">Location</div>
                    <div className="mt-1 text-zinc-400">{area}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredTransactions.length > pageSize && (
          <div className="border-t border-zinc-800 px-6 py-5">
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

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">What this means</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Consumers should use this page to check whether the agent&apos;s visible activity aligns with the property segment and role they actually need. Transaction volume is useful, but fit and recency are usually more important.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {topPropertyTypes.slice(0, 3).map(([type]) => (
              <Link
                key={type}
                href={`/property-type/${slugifySegment(type)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(type)}
              </Link>
            ))}
            {topTransactionTypes.slice(0, 2).map(([type]) => (
              <Link
                key={type}
                href={`/transaction-type/${slugifySegment(type)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {formatLabel(type)}
              </Link>
            ))}
            {agent.agency && (
              <Link
                href={`/agency/${slugifySegment(agent.agency)}`}
                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
              >
                {agent.agency}
              </Link>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Comparable agents</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Similar profiles are shown to help consumers compare an agent within the same broader agency context.
          </p>
          <div className="mt-5 space-y-3">
            {comparableAgents.length > 0 ? comparableAgents.map((comparable) => (
              <Link
                key={comparable.cea_number}
                href={`/agent/${comparable.cea_number}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition hover:border-zinc-700"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-100">{comparable.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{comparable.cea_number}</div>
                </div>
                <div className="text-sm font-semibold text-zinc-100">{formatCount(comparable.total_transactions || 0)}</div>
              </Link>
            )) : (
              <p className="text-sm text-zinc-500">No comparable profiles available yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
