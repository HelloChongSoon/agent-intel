import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
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

async function getSupabase() {
  try {
    const cookieStore = await cookies();
    return createClient(cookieStore);
  } catch (error) {
    console.error('Failed to initialize Supabase in server query layer:', error);
    return null;
  }
}

export async function getAvailableLeaderboardYears(minYear: number = 2017): Promise<number[]> {
  const currentYear = new Date().getFullYear();
  const supabase = await getSupabase();

  if (!supabase) {
    return Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
  }

  const { data, error } = await supabase.rpc('get_available_leaderboard_years');

  if (error) {
    console.error('getAvailableLeaderboardYears failed:', error.message);
    return Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
  }

  const years = ((data || []) as Array<unknown>)
    .map((value) => extractRpcScalar<number | string>(value, 'year'))
    .filter((value): value is number | string => value !== null)
    .map((value) => Number(value))
    .filter((year: number) => Number.isInteger(year) && year >= minYear && year <= currentYear)
    .sort((a, b) => b - a);

  return years.length > 0 ? years : [currentYear];
}

export async function getLatestLeaderboardYear(minYear: number = 2017): Promise<number> {
  const currentYear = new Date().getFullYear();
  const availableYears = await getAvailableLeaderboardYears(minYear);

  return availableYears[0] || currentYear;
}

export async function getLeaderboardFilterOptions(year?: number): Promise<LeaderboardFilterOptions> {
  const supabase = await getSupabase();

  if (!supabase) {
    return { propertyTypes: [], transactionTypes: [] };
  }

  const yearFilter = year ? String(year) : null;
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
}

export async function getLeaderboard(params: {
  year?: number;
  page?: number;
  pageSize?: number;
  agency?: string;
  propertyType?: string;
  transactionType?: string;
}): Promise<{ rows: LeaderboardRow[]; total: number }> {
  const supabase = await getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const year = params.year || new Date().getFullYear();
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase.rpc('get_leaderboard', {
    year_filter: String(year),
    agency_filter: params.agency || null,
    property_type_filter: params.propertyType || null,
    transaction_type_filter: params.transactionType || null,
    page_num: page,
    page_size: pageSize,
  });

  if (error) {
    console.error('getLeaderboard failed:', error.message);

    // Fallback to live agents table when the unfiltered RPC hits DB timeout.
    if (error.message.includes('statement timeout')) {
      if (params.year) {
        return { rows: [], total: 0 };
      }

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

const SUPABASE_BATCH_SIZE = 1000;

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

function getTransactionDateSortKey(value: string): number {
  const periodMatch = value.match(/^([A-Z]{3})-(\d{4})$/);
  if (periodMatch) {
    const month = MONTH_INDEX[periodMatch[1]] ?? -1;
    return Number(periodMatch[2]) * 12 + month;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? -1 : parsed;
}

export async function getAgentTransactions(ceaNumber: string): Promise<TransactionRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const rows: TransactionRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('transactions')
      .select('date, property_type, transaction_type, role, location')
      .eq('cea_number', ceaNumber)
      .range(from, from + SUPABASE_BATCH_SIZE - 1);

    if (error) {
      console.error('getAgentTransactions failed:', error.message);
      return [];
    }

    const batch = (data || []) as TransactionRow[];
    rows.push(...batch);

    if (batch.length < SUPABASE_BATCH_SIZE) {
      break;
    }

    from += SUPABASE_BATCH_SIZE;
  }

  return rows.sort(
    (a, b) => getTransactionDateSortKey(b.date) - getTransactionDateSortKey(a.date)
  );
}

export async function getAgentTransactionSummaries(
  ceaNumbers: string[]
): Promise<Record<string, { count: number; latest: string | null }>> {
  const dedupedCeaNumbers = [...new Set(ceaNumbers.filter(Boolean))];
  if (dedupedCeaNumbers.length === 0) return {};

  const supabase = await getSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from('transactions')
    .select('cea_number, date')
    .in('cea_number', dedupedCeaNumbers)
    .limit(50000);

  if (error) {
    console.error('getAgentTransactionSummaries failed:', error.message);
    return {};
  }

  const summaries = new Map<string, { count: number; latest: string | null }>();
  for (const row of (data || []) as Array<{ cea_number: string; date: string }>) {
    const existing = summaries.get(row.cea_number) || { count: 0, latest: null };
    const latest =
      !existing.latest || getTransactionDateSortKey(row.date) > getTransactionDateSortKey(existing.latest)
        ? row.date
        : existing.latest;

    summaries.set(row.cea_number, {
      count: existing.count + 1,
      latest,
    });
  }

  return Object.fromEntries(summaries.entries());
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

function getWeekStart(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}

export async function getMovements(params: {
  page?: number;
  pageSize?: number;
  type?: string;
  query?: string;
}): Promise<{ rows: MovementRow[]; total: number }> {
  const supabase = await getSupabase();
  if (!supabase) return { rows: [], total: 0 };
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('movements')
    .select('*', { count: 'exact' });

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
    total: count || 0,
  };
}

export async function getMovementInsights(weeks: number = 10): Promise<MovementInsights> {
  const supabase = await getSupabase();
  if (!supabase) {
    return {
      totalMovements: 0,
      countsByType: {},
      weeklyBreakdown: [],
      topAgencyNetChange: [],
    };
  }

  const [countResult, dataResult] = await Promise.all([
    supabase
      .from('movements')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('movements')
      .select('date, type, previous_agency, new_agency')
      .order('date', { ascending: false })
      .limit(20000),
  ]);

  if (countResult.error) {
    console.error('getMovementInsights count failed:', countResult.error.message);
  }

  if (dataResult.error) {
    console.error('getMovementInsights failed:', dataResult.error.message);
    return {
      totalMovements: 0,
      countsByType: {},
      weeklyBreakdown: [],
      topAgencyNetChange: [],
    };
  }

  const data = dataResult.data || [];
  const countsByType = new Map<string, number>();
  const weeklyCounts = new Map<string, Map<string, number>>();
  const agencyTotals = new Map<string, { gained: number; lost: number }>();

  for (const row of (data || []) as Array<{
    date: string;
    type: string | null;
    previous_agency: string | null;
    new_agency: string | null;
  }>) {
    const type = row.type || 'unknown';
    countsByType.set(type, (countsByType.get(type) || 0) + 1);

    const weekStart = getWeekStart(row.date);
    const weekBucket = weeklyCounts.get(weekStart) || new Map<string, number>();
    weekBucket.set(type, (weekBucket.get(type) || 0) + 1);
    weeklyCounts.set(weekStart, weekBucket);

    if (row.new_agency) {
      const bucket = agencyTotals.get(row.new_agency) || { gained: 0, lost: 0 };
      bucket.gained += 1;
      agencyTotals.set(row.new_agency, bucket);
    }

    if (row.previous_agency) {
      const bucket = agencyTotals.get(row.previous_agency) || { gained: 0, lost: 0 };
      bucket.lost += 1;
      agencyTotals.set(row.previous_agency, bucket);
    }
  }

  const weeklyBreakdown = [...weeklyCounts.entries()]
    .sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]))
    .slice(-weeks)
    .map(([weekStart, bucket]) => {
      const counts = Object.fromEntries(bucket.entries());
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      return { weekStart, counts, total };
    });

  const topAgencyNetChange = [...agencyTotals.entries()]
    .map(([agency, counts]) => ({
      agency,
      gained: counts.gained,
      lost: counts.lost,
      net: counts.gained - counts.lost,
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.gained - a.gained || a.agency.localeCompare(b.agency))
    .slice(0, 8);

  return {
    totalMovements: countResult.count || data.length,
    countsByType: Object.fromEntries(countsByType.entries()),
    weeklyBreakdown,
    topAgencyNetChange,
  };
}

export async function getAgentMovements(ceaNumber: string, limit: number = 10): Promise<MovementRow[]> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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

export async function getAgencies(): Promise<AgencyOption[]> {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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

export async function getAgencyPropertyMix(agency: string): Promise<Array<{ propertyType: string; count: number }>> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data: agentRows, error: agentError } = await supabase
    .from('agents')
    .select('cea_number')
    .eq('agency', agency)
    .limit(5000);

  if (agentError) {
    console.error('getAgencyPropertyMix agent lookup failed:', agentError.message);
    return [];
  }

  const ceaNumbers = [...new Set(((agentRows || []) as Array<{ cea_number: string | null }>).map((row) => row.cea_number).filter(Boolean))] as string[];
  if (ceaNumbers.length === 0) return [];

  const counts = new Map<string, number>();
  const chunkSize = 200;

  for (let i = 0; i < ceaNumbers.length; i += chunkSize) {
    const chunk = ceaNumbers.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('transactions')
      .select('property_type')
      .in('cea_number', chunk)
      .limit(50000);

    if (error) {
      console.error('getAgencyPropertyMix transaction lookup failed:', error.message);
      continue;
    }

    for (const row of (data || []) as Array<{ property_type?: string | null }>) {
      const propertyType = row.property_type;
      if (!propertyType) continue;
      counts.set(propertyType, (counts.get(propertyType) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([propertyType, count]) => ({ propertyType, count }))
    .sort((a, b) => b.count - a.count);
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
