import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { slugifySegment } from '@/lib/format';

export interface LeaderboardRow {
  rank: number;
  name: string;
  cea_number: string;
  agency: string;
  transactions: number;
}

export interface LeaderboardFilterOptions {
  propertyTypes: string[];
  transactionTypes: string[];
}

export interface AgencyOption {
  name: string;
  count: number;
}

export interface AgencySummary {
  agency: AgencyOption;
  year: number;
  leaderboard: { rows: LeaderboardRow[]; total: number };
  recentMovements: MovementRow[];
  propertyMix: Array<{ propertyType: string; count: number }>;
}

function extractRpcScalar<T extends string | number>(
  value: unknown,
  key: string
): T | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value as T;
  }

  if (value && typeof value === 'object' && key in value) {
    const fieldValue = (value as Record<string, unknown>)[key];
    if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
      return fieldValue as T;
    }
  }

  return null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);
let publicSupabase: SupabaseClient | null | undefined;

function getSupabase() {
  if (!hasSupabaseEnv) {
    return null;
  }

  if (publicSupabase !== undefined) {
    return publicSupabase;
  }

  try {
    publicSupabase = createSupabaseClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase in query layer:', error);
    publicSupabase = null;
  }

  return publicSupabase;
}

function asTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function parseCountList(
  value: unknown,
  itemKey: string
): Array<{ value: string; count: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const listValue = record[itemKey];
      const count = Number(record.count);
      if (typeof listValue !== 'string' || !listValue || !Number.isFinite(count)) return null;
      return { value: listValue, count };
    })
    .filter((item): item is { value: string; count: number } => Boolean(item));
}

function parseAreaCountList(value: unknown): Array<{ area: string; count: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const area = record.area;
      const count = Number(record.count);
      if (typeof area !== 'string' || !area || !Number.isFinite(count)) return null;
      return { area, count };
    })
    .filter((item): item is { area: string; count: number } => Boolean(item));
}

function parseMonthlyActivity(value: unknown): Array<{ bucket: string; count: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const bucket = record.bucket;
      const count = Number(record.count);
      if (typeof bucket !== 'string' || !bucket || !Number.isFinite(count)) return null;
      return { bucket, count };
    })
    .filter((item): item is { bucket: string; count: number } => Boolean(item));
}

function parseMovementBreakdown(
  value: unknown
): Array<{ weekStart: string; counts: Record<string, number>; total: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const weekStart = record.week_start;
      const total = Number(record.total);
      if (typeof weekStart !== 'string' || !Number.isFinite(total)) return null;

      const countsRecord =
        record.counts && typeof record.counts === 'object'
          ? Object.fromEntries(
              Object.entries(record.counts as Record<string, unknown>).map(([key, rawCount]) => [
                key,
                Number(rawCount) || 0,
              ])
            )
          : {};

      return { weekStart, counts: countsRecord, total };
    })
    .filter(
      (
        item
      ): item is { weekStart: string; counts: Record<string, number>; total: number } => Boolean(item)
    );
}

function parseAgencyNetChange(
  value: unknown
): Array<{ agency: string; gained: number; lost: number; net: number }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const agency = record.agency;
      const gained = Number(record.gained);
      const lost = Number(record.lost);
      const net = Number(record.net);
      if (typeof agency !== 'string' || !agency) return null;
      if (![gained, lost, net].every(Number.isFinite)) return null;
      return { agency, gained, lost, net };
    })
    .filter(
      (item): item is { agency: string; gained: number; lost: number; net: number } => Boolean(item)
    );
}

export interface AgentSummary {
  ceaNumber: string;
  totalTransactions: number;
  latestActivity: string | null;
  topPropertyTypes: Array<{ value: string; count: number }>;
  topTransactionTypes: Array<{ value: string; count: number }>;
  topRoles: Array<{ value: string; count: number }>;
  uniqueAreaCount: number;
  monthlyActivity: Array<{ bucket: string; count: number }>;
  topRecentAreas: Array<{ area: string; count: number }>;
  filterPropertyTypes: string[];
  filterTransactionTypes: string[];
  filterRoles: string[];
  filterYears: number[];
}

export interface AgentTransactionFilters {
  propertyTypes: string[];
  transactionTypes: string[];
  roles: string[];
  years: number[];
  monthIndexes: number[];
}

export interface AgentTransactionPageResult {
  rows: TransactionRow[];
  total: number;
}

const getCachedAvailableLeaderboardYears = unstable_cache(
  async () => {
    const currentYear = new Date().getFullYear();
    const supabase = getSupabase();

    if (!supabase) {
      return [currentYear];
    }

    const { data, error } = await supabase.rpc('get_available_leaderboard_years');

    if (error) {
      console.error('getAvailableLeaderboardYears failed:', error.message);
      return [currentYear];
    }

    const years = ((data || []) as Array<unknown>)
      .map((value) => extractRpcScalar<number | string>(value, 'year'))
      .filter((value): value is number | string => value !== null)
      .map((value) => Number(value))
      .filter((year) => Number.isInteger(year))
      .sort((a, b) => b - a);

    return years.length > 0 ? years : [currentYear];
  },
  ['leaderboard-years'],
  { revalidate: 600 }
);

export async function getAvailableLeaderboardYears(minYear: number = 2017): Promise<number[]> {
  const currentYear = new Date().getFullYear();
  const years = await getCachedAvailableLeaderboardYears();
  const filteredYears = years.filter((year) => year >= minYear && year <= currentYear);

  return filteredYears.length > 0
    ? filteredYears
    : Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
}

export async function getLatestLeaderboardYear(minYear: number = 2017): Promise<number> {
  const currentYear = new Date().getFullYear();
  const availableYears = await getAvailableLeaderboardYears(minYear);

  return availableYears[0] || currentYear;
}

const getCachedLeaderboardFilterOptions = unstable_cache(
  async (yearFilter: string | null): Promise<LeaderboardFilterOptions> => {
    const supabase = getSupabase();

    if (!supabase) {
      return { propertyTypes: [], transactionTypes: [] };
    }

    const [propertyTypesResult, transactionTypesResult] = await Promise.all([
      supabase.rpc('get_available_leaderboard_property_types', { year_filter: yearFilter }),
      supabase.rpc('get_available_leaderboard_transaction_types', { year_filter: yearFilter }),
    ]);

    if (propertyTypesResult.error) {
      console.error('getLeaderboardFilterOptions property types failed:', propertyTypesResult.error.message);
    }

    if (transactionTypesResult.error) {
      console.error('getLeaderboardFilterOptions transaction types failed:', transactionTypesResult.error.message);
    }

    const propertyTypes = ((propertyTypesResult.data || []) as Array<unknown>)
      .map((value) => extractRpcScalar<string>(value, 'property_type'))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b));

    const transactionTypes = ((transactionTypesResult.data || []) as Array<unknown>)
      .map((value) => extractRpcScalar<string>(value, 'transaction_type'))
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => a.localeCompare(b));

    return { propertyTypes, transactionTypes };
  },
  ['leaderboard-filter-options'],
  { revalidate: 600 }
);

export async function getLeaderboardFilterOptions(year?: number): Promise<LeaderboardFilterOptions> {
  return getCachedLeaderboardFilterOptions(year ? String(year) : null);
}

const getCachedLeaderboard = unstable_cache(
  async (params: {
    year: number;
    page: number;
    pageSize: number;
    agency: string | null;
    propertyType: string | null;
    transactionType: string | null;
  }): Promise<{ rows: LeaderboardRow[]; total: number }> => {
    const supabase = getSupabase();
    if (!supabase) return { rows: [], total: 0 };

    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    const { data, error } = await supabase.rpc('get_leaderboard', {
      year_filter: String(params.year),
      agency_filter: params.agency,
      property_type_filter: params.propertyType,
      transaction_type_filter: params.transactionType,
      page_num: params.page,
      page_size: params.pageSize,
    });

    if (error) {
      console.error('getLeaderboard failed:', error.message);

      if (error.message.includes('statement timeout')) {
        let fallbackQuery = supabase
          .from('agents')
          .select('cea_number, name, agency, total_transactions', { count: 'exact' })
          .gt('total_transactions', 0);

        if (params.agency) {
          fallbackQuery = fallbackQuery.eq('agency', params.agency);
        }

        const { data: fallbackData, count: fallbackCount, error: fallbackError } = await fallbackQuery
          .order('total_transactions', { ascending: false })
          .order('cea_number', { ascending: true })
          .range(from, to);

        if (fallbackError) {
          console.error('getLeaderboard fallback failed:', fallbackError.message);
          return { rows: [], total: 0 };
        }

        const fallbackRows: LeaderboardRow[] = (fallbackData || []).map((row, index) => ({
          rank: from + index + 1,
          name: row.name,
          cea_number: row.cea_number,
          agency: row.agency || '',
          transactions: Number(row.total_transactions || 0),
        }));

        return {
          rows: fallbackRows,
          total: fallbackCount || 0,
        };
      }

      return { rows: [], total: 0 };
    }

    const rows = (data || []) as (LeaderboardRow & { total_count: number })[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return {
      rows: rows.map(({ rank, name, cea_number, agency, transactions }) => ({
        rank,
        name,
        cea_number,
        agency,
        transactions,
      })),
      total,
    };
  },
  ['leaderboard'],
  { revalidate: 600 }
);

export async function getLeaderboard(params: {
  year?: number;
  page?: number;
  pageSize?: number;
  agency?: string;
  propertyType?: string;
  transactionType?: string;
}): Promise<{ rows: LeaderboardRow[]; total: number }> {
  return getCachedLeaderboard({
    year: params.year || new Date().getFullYear(),
    page: params.page || 1,
    pageSize: params.pageSize || 25,
    agency: params.agency || null,
    propertyType: params.propertyType || null,
    transactionType: params.transactionType || null,
  });
}

export interface AgentRow {
  cea_number: string;
  name: string;
  agency: string | null;
  phone: string | null;
  email: string | null;
  registration_start: string | null;
  registration_end: string | null;
  total_transactions: number;
}

export async function getAgent(ceaNumber: string): Promise<AgentRow | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('cea_number', ceaNumber)
    .single();

  if (error) return null;
  return data as AgentRow;
}

export interface TransactionRow {
  date: string;
  property_type: string;
  transaction_type: string;
  role: string;
  location: string;
}

const getCachedAgentSummary = unstable_cache(
  async (ceaNumber: string): Promise<AgentSummary | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.rpc('get_agent_summary', {
      target_cea: ceaNumber,
    });

    if (error) {
      console.error('getAgentSummary failed:', error.message);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') return null;

    const record = row as Record<string, unknown>;
    return {
      ceaNumber: String(record.cea_number || ceaNumber),
      totalTransactions: Number(record.total_transactions || 0),
      latestActivity: typeof record.latest_activity === 'string' ? record.latest_activity : null,
      topPropertyTypes: parseCountList(record.top_property_types, 'property_type'),
      topTransactionTypes: parseCountList(record.top_transaction_types, 'transaction_type'),
      topRoles: parseCountList(record.top_roles, 'role'),
      uniqueAreaCount: Number(record.unique_area_count || 0),
      monthlyActivity: parseMonthlyActivity(record.monthly_activity),
      topRecentAreas: parseAreaCountList(record.top_recent_areas),
      filterPropertyTypes: asTextArray(record.filter_property_types),
      filterTransactionTypes: asTextArray(record.filter_transaction_types),
      filterRoles: asTextArray(record.filter_roles),
      filterYears: asNumberArray(record.filter_years).sort((a, b) => b - a),
    };
  },
  ['agent-summary'],
  { revalidate: 600 }
);

export async function getAgentSummary(ceaNumber: string): Promise<AgentSummary | null> {
  return getCachedAgentSummary(ceaNumber);
}

const getCachedAgentTransactionFilters = unstable_cache(
  async (ceaNumber: string, yearFilter: string | null): Promise<AgentTransactionFilters> => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        propertyTypes: [],
        transactionTypes: [],
        roles: [],
        years: [],
        monthIndexes: [],
      };
    }

    const { data, error } = await supabase.rpc('get_agent_transaction_filters', {
      target_cea: ceaNumber,
      year_filter: yearFilter,
    });

    if (error) {
      console.error('getAgentTransactionFilters failed:', error.message);
      return {
        propertyTypes: [],
        transactionTypes: [],
        roles: [],
        years: [],
        monthIndexes: [],
      };
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') {
      return {
        propertyTypes: [],
        transactionTypes: [],
        roles: [],
        years: [],
        monthIndexes: [],
      };
    }

    const record = row as Record<string, unknown>;
    return {
      propertyTypes: asTextArray(record.property_types),
      transactionTypes: asTextArray(record.transaction_types),
      roles: asTextArray(record.roles),
      years: asNumberArray(record.years).sort((a, b) => b - a),
      monthIndexes: asNumberArray(record.month_indexes).sort((a, b) => a - b),
    };
  },
  ['agent-transaction-filters'],
  { revalidate: 600 }
);

export async function getAgentTransactionFilters(
  ceaNumber: string,
  year?: number | string | null
): Promise<AgentTransactionFilters> {
  return getCachedAgentTransactionFilters(ceaNumber, year ? String(year) : null);
}

export async function getAgentTransactionsPage(params: {
  ceaNumber: string;
  page?: number;
  pageSize?: number;
  propertyType?: string | null;
  transactionType?: string | null;
  role?: string | null;
  year?: number | string | null;
  monthIndex?: number | string | null;
}): Promise<AgentTransactionPageResult> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0 };

  const { data, error } = await supabase.rpc('get_agent_transactions_page', {
    target_cea: params.ceaNumber,
    property_type_filter: params.propertyType || null,
    transaction_type_filter: params.transactionType || null,
    role_filter: params.role || null,
    year_filter: params.year ? String(params.year) : null,
    month_filter:
      params.monthIndex === null || params.monthIndex === undefined || params.monthIndex === ''
        ? null
        : Number(params.monthIndex),
    page_num: params.page || 1,
    page_size: params.pageSize || 25,
  });

  if (error) {
    console.error('getAgentTransactionsPage failed:', error.message);
    return { rows: [], total: 0 };
  }

  const rows = (data || []) as Array<TransactionRow & { total_count: number }>;

  return {
    rows: rows.map(({ date, property_type, transaction_type, role, location }) => ({
      date,
      property_type,
      transaction_type,
      role,
      location,
    })),
    total: rows.length > 0 ? Number(rows[0].total_count) : 0,
  };
}

export async function getAgentTransactionSummaries(
  ceaNumbers: string[]
): Promise<Record<string, { count: number; latest: string | null }>> {
  const dedupedCeaNumbers = [...new Set(ceaNumbers.filter(Boolean))];
  if (dedupedCeaNumbers.length === 0) return {};

  const supabase = getSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase.rpc('get_agent_search_summaries', {
    cea_numbers: dedupedCeaNumbers,
  });

  if (error) {
    console.error('getAgentTransactionSummaries failed:', error.message);
    return {};
  }

  return Object.fromEntries(
    ((data || []) as Array<Record<string, unknown>>)
      .map((row) => {
        const ceaNumber = extractRpcScalar<string>(row, 'cea_number');
        if (!ceaNumber) return null;

        return [
          ceaNumber,
          {
            count: Number(extractRpcScalar<number | string>(row, 'total_transactions') || 0),
            latest: extractRpcScalar<string>(row, 'latest_activity'),
          },
        ] as const;
      })
      .filter(
        (
          entry
        ): entry is readonly [string, { count: number; latest: string | null }] => Boolean(entry)
      )
  );
}

export interface MovementRow {
  id: number;
  cea_number: string;
  agent_name: string;
  previous_agency: string | null;
  new_agency: string | null;
  date: string;
  type: string;
}

export interface MovementInsights {
  totalMovements: number;
  countsByType: Record<string, number>;
  weeklyBreakdown: Array<{
    weekStart: string;
    counts: Record<string, number>;
    total: number;
  }>;
  topAgencyNetChange: Array<{
    agency: string;
    gained: number;
    lost: number;
    net: number;
  }>;
}

export async function getMovements(params: {
  page?: number;
  pageSize?: number;
  type?: string;
  query?: string;
  includeCount?: boolean;
}): Promise<{ rows: MovementRow[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('movements')
    .select('*', params.includeCount === false ? undefined : { count: 'exact' });

  if (params.type) {
    query = query.eq('type', params.type);
  }

  if (params.query) {
    const searchValue = params.query.replace(/[%_]/g, '').trim();
    if (searchValue) {
      query = query.or(`agent_name.ilike.%${searchValue}%,cea_number.ilike.%${searchValue}%`);
    }
  }

  const { data, count, error } = await query
    .order('date', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getMovements failed:', error.message);
    return { rows: [], total: 0 };
  }

  return {
    rows: (data || []) as MovementRow[],
    total: params.includeCount === false ? 0 : count || 0,
  };
}

const getCachedMovementInsights = unstable_cache(
  async (weeks: number): Promise<MovementInsights> => {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        totalMovements: 0,
        countsByType: {},
        weeklyBreakdown: [],
        topAgencyNetChange: [],
      };
    }

    const { data, error } = await supabase.rpc('get_movement_insights', {
      weeks,
    });

    if (error) {
      console.error('getMovementInsights failed:', error.message);
      return {
        totalMovements: 0,
        countsByType: {},
        weeklyBreakdown: [],
        topAgencyNetChange: [],
      };
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row !== 'object') {
      return {
        totalMovements: 0,
        countsByType: {},
        weeklyBreakdown: [],
        topAgencyNetChange: [],
      };
    }

    const record = row as Record<string, unknown>;
    const countsByType =
      record.counts_by_type && typeof record.counts_by_type === 'object'
        ? Object.fromEntries(
            Object.entries(record.counts_by_type as Record<string, unknown>).map(([key, rawCount]) => [
              key,
              Number(rawCount) || 0,
            ])
          )
        : {};

    return {
      totalMovements: Number(record.total_movements || 0),
      countsByType,
      weeklyBreakdown: parseMovementBreakdown(record.weekly_breakdown),
      topAgencyNetChange: parseAgencyNetChange(record.top_agency_net_change),
    };
  },
  ['movement-insights'],
  { revalidate: 600 }
);

export async function getMovementInsights(weeks: number = 10): Promise<MovementInsights> {
  return getCachedMovementInsights(weeks);
}

export async function getAgentMovements(ceaNumber: string, limit: number = 10): Promise<MovementRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('cea_number', ceaNumber)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getAgentMovements failed:', error.message);
    return [];
  }

  return (data || []) as MovementRow[];
}

export async function searchAgents(query: string, limit: number = 50): Promise<AgentRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  // Use trigram similarity for fuzzy search on name, exact match on CEA number
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,cea_number.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('searchAgents failed:', error.message);
    return [];
  }
  return (data || []) as AgentRow[];
}

const getCachedAgencies = unstable_cache(
  async (): Promise<AgencyOption[]> => {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('get_agency_options');

    if (error) {
      console.error('getAgencies failed:', error.message);
      return [];
    }

    return ((data || []) as Array<Record<string, unknown>>)
      .map((row) => {
        const name = extractRpcScalar<string>(row, 'agency');
        const count = extractRpcScalar<number | string>(row, 'agent_count');
        if (!name || count === null) return null;
        return {
          name,
          count: Number(count),
        };
      })
      .filter((value): value is AgencyOption => Boolean(value))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },
  ['agencies'],
  { revalidate: 600 }
);

export async function getAgencies(): Promise<AgencyOption[]> {
  return getCachedAgencies();
}

export async function getAllAgentRefs(): Promise<Array<{ cea_number: string; updated_at?: string | null }>> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agents')
    .select('cea_number, updated_at')
    .order('cea_number', { ascending: true });

  if (error) {
    console.error('getAllAgentRefs failed:', error.message);
    return [];
  }

  return (data || []) as Array<{ cea_number: string; updated_at?: string | null }>;
}

export async function getAgencyBySlug(slug: string): Promise<AgencyOption | null> {
  const agencies = await getAgencies();
  return agencies.find((agency) => slugifySegment(agency.name) === slug) || null;
}

export async function getAgencyMovements(agency: string, limit: number = 10): Promise<MovementRow[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const [previousAgencyResult, newAgencyResult] = await Promise.all([
    supabase
      .from('movements')
      .select('*')
      .eq('previous_agency', agency)
      .order('date', { ascending: false })
      .limit(limit),
    supabase
      .from('movements')
      .select('*')
      .eq('new_agency', agency)
      .order('date', { ascending: false })
      .limit(limit),
  ]);

  if (previousAgencyResult.error) {
    console.error('getAgencyMovements previous agency failed:', previousAgencyResult.error.message);
  }

  if (newAgencyResult.error) {
    console.error('getAgencyMovements new agency failed:', newAgencyResult.error.message);
  }

  const deduped = new Map<number, MovementRow>();
  for (const row of [...(previousAgencyResult.data || []), ...(newAgencyResult.data || [])] as MovementRow[]) {
    deduped.set(row.id, row);
  }

  return [...deduped.values()]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}

const getCachedAgencyPropertyMix = unstable_cache(
  async (agency: string): Promise<Array<{ propertyType: string; count: number }>> => {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc('get_agency_property_mix', {
      agency_filter: agency,
    });

    if (error) {
      console.error('getAgencyPropertyMix failed:', error.message);
      return [];
    }

    return ((data || []) as Array<Record<string, unknown>>)
      .map((row) => {
        const propertyType = extractRpcScalar<string>(row, 'property_type');
        const count = extractRpcScalar<number | string>(row, 'transaction_count');
        if (!propertyType || count === null) return null;
        return {
          propertyType,
          count: Number(count),
        };
      })
      .filter((value): value is { propertyType: string; count: number } => Boolean(value))
      .sort((a, b) => b.count - a.count);
  },
  ['agency-property-mix'],
  { revalidate: 600 }
);

export async function getAgencyPropertyMix(agency: string): Promise<Array<{ propertyType: string; count: number }>> {
  return getCachedAgencyPropertyMix(agency);
}

export async function getAgencySummary(slug: string): Promise<AgencySummary | null> {
  const agency = await getAgencyBySlug(slug);
  if (!agency) return null;

  const year = await getLatestLeaderboardYear();
  const [leaderboard, recentMovements, propertyMix] = await Promise.all([
    getLeaderboard({ year, agency: agency.name, pageSize: 10 }),
    getAgencyMovements(agency.name, 8),
    getAgencyPropertyMix(agency.name),
  ]);

  return {
    agency,
    year,
    leaderboard,
    recentMovements,
    propertyMix,
  };
}

export async function getAgencyAgents(agency: string, limit: number = 6): Promise<AgentRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('agency', agency)
    .order('total_transactions', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getAgencyAgents failed:', error.message);
    return [];
  }

  return (data || []) as AgentRow[];
}

export async function getComparableAgents(params: {
  ceaNumber: string;
  agency?: string | null;
  limit?: number;
}): Promise<AgentRow[]> {
  const supabase = await getSupabase();
  if (!supabase || !params.agency) return [];

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('agency', params.agency)
    .neq('cea_number', params.ceaNumber)
    .order('total_transactions', { ascending: false })
    .limit(params.limit || 5);

  if (error) {
    console.error('getComparableAgents failed:', error.message);
    return [];
  }

  return (data || []) as AgentRow[];
}

export async function getSimilarVolumeAgents(params: {
  ceaNumber: string;
  totalTransactions: number;
  limit?: number;
}): Promise<AgentRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const spread = Math.max(params.totalTransactions * 0.3, 5);
  const lowerBound = Math.max(0, Math.floor(params.totalTransactions - spread));
  const upperBound = Math.ceil(params.totalTransactions + spread);

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .neq('cea_number', params.ceaNumber)
    .gte('total_transactions', lowerBound)
    .lte('total_transactions', upperBound)
    .order('total_transactions', { ascending: false })
    .limit(20);

  if (error) {
    console.error('getSimilarVolumeAgents failed:', error.message);
    return [];
  }

  const target = params.totalTransactions;
  return ((data || []) as AgentRow[])
    .sort((a, b) => Math.abs((a.total_transactions || 0) - target) - Math.abs((b.total_transactions || 0) - target))
    .slice(0, params.limit || 4);
}

export interface AreaAgentRow extends AgentRow {
  area_count: number;
}

export async function getSameAreaAgents(params: {
  ceaNumber: string;
  area: string;
  limit?: number;
}): Promise<AreaAgentRow[]> {
  const supabase = await getSupabase();
  if (!supabase || !params.area) return [];

  const { data, error } = await supabase.rpc('get_agents_by_area', {
    area_filter: params.area,
    exclude_cea: params.ceaNumber,
    result_limit: params.limit || 4,
  });

  if (error) {
    console.error('getSameAreaAgents failed:', error.message);
    return [];
  }

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    cea_number: String(row.cea_number || ''),
    name: String(row.name || ''),
    agency: row.agency ? String(row.agency) : null,
    phone: null,
    email: null,
    registration_start: null,
    registration_end: null,
    total_transactions: Number(row.total_transactions || 0),
    area_count: Number(row.area_count || 0),
  }));
}

export interface PropertyTypeAgentRow extends AgentRow {
  type_count: number;
}

export async function getSamePropertyTypeAgents(params: {
  ceaNumber: string;
  propertyType: string;
  limit?: number;
}): Promise<PropertyTypeAgentRow[]> {
  const supabase = await getSupabase();
  if (!supabase || !params.propertyType) return [];

  const { data, error } = await supabase.rpc('get_agents_by_property_type', {
    property_type_filter: params.propertyType,
    exclude_cea: params.ceaNumber,
    result_limit: params.limit || 4,
  });

  if (error) {
    console.error('getSamePropertyTypeAgents failed:', error.message);
    return [];
  }

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    cea_number: String(row.cea_number || ''),
    name: String(row.name || ''),
    agency: row.agency ? String(row.agency) : null,
    phone: null,
    email: null,
    registration_start: null,
    registration_end: null,
    total_transactions: Number(row.total_transactions || 0),
    type_count: Number(row.type_count || 0),
  }));
}

export interface AreaOption {
  name: string;
  count: number;
}

export async function getAreas(minAgents: number = 3): Promise<AreaOption[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_areas', { min_agents: minAgents });

  if (error) {
    console.error('getAreas failed:', error.message);
    return [];
  }

  return ((data || []) as Array<Record<string, unknown>>)
    .map((row) => ({
      name: String(row.area || ''),
      count: Number(row.agent_count || 0),
    }))
    .filter((a) => a.name.length > 0);
}

export async function getAreaBySlug(slug: string): Promise<string | null> {
  const areas = await getAreas(1);
  return areas.find((a) => slugifySegment(a.name) === slug)?.name || null;
}

export async function getAreaLeaderboard(params: {
  area: string;
  year?: number;
  agency?: string;
  propertyType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: LeaderboardRow[]; total: number }> {
  const supabase = await getSupabase();
  if (!supabase) return { rows: [], total: 0 };

  const year = params.year || new Date().getFullYear();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;

  const { data, error } = await supabase.rpc('get_area_leaderboard', {
    area_filter: params.area,
    year_filter: String(year),
    agency_filter: params.agency || null,
    property_type_filter: params.propertyType || null,
    page_num: page,
    page_size: pageSize,
  });

  if (error) {
    console.error('getAreaLeaderboard failed:', error.message);
    return { rows: [], total: 0 };
  }

  const rows = (data || []) as (LeaderboardRow & { total_count: number })[];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    rows: rows.map(({ rank, name, cea_number, agency, transactions }) => ({
      rank,
      name,
      cea_number,
      agency,
      transactions,
    })),
    total,
  };
}

export interface AreaPropertyTypeCombo {
  area: string;
  propertyType: string;
  agentCount: number;
}

export async function getAreaPropertyTypeCombos(minAgents: number = 5): Promise<AreaPropertyTypeCombo[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('get_area_property_type_combos', { min_agents: minAgents });

  if (error) {
    console.error('getAreaPropertyTypeCombos failed:', error.message);
    return [];
  }

  return ((data || []) as Array<Record<string, unknown>>)
    .map((row) => ({
      area: String(row.area || ''),
      propertyType: String(row.property_type || ''),
      agentCount: Number(row.agent_count || 0),
    }))
    .filter((c) => c.area.length > 0 && c.propertyType.length > 0);
}

export async function getPropertyTypeBySlug(slug: string): Promise<string | null> {
  const year = await getLatestLeaderboardYear();
  const { propertyTypes } = await getLeaderboardFilterOptions(year);
  return propertyTypes.find((value) => slugifySegment(value) === slug) || null;
}

export async function getTransactionTypeBySlug(slug: string): Promise<string | null> {
  const year = await getLatestLeaderboardYear();
  const { transactionTypes } = await getLeaderboardFilterOptions(year);
  return transactionTypes.find((value) => slugifySegment(value) === slug) || null;
}

export const __private__ = {
  asTextArray,
  asNumberArray,
  parseCountList,
  parseAreaCountList,
  parseMonthlyActivity,
  parseMovementBreakdown,
  parseAgencyNetChange,
};
