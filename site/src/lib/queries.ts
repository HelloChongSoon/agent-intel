import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

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

export async function getAgentTransactions(ceaNumber: string): Promise<TransactionRow[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('date, property_type, transaction_type, role, location')
    .eq('cea_number', ceaNumber)
    .order('date', { ascending: false });

  if (error) {
    console.error('getAgentTransactions failed:', error.message);
    return [];
  }
  return (data || []) as TransactionRow[];
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

export async function getMovements(params: {
  page?: number;
  pageSize?: number;
  type?: string;
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

export async function getAgencies(): Promise<string[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('agents')
    .select('agency')
    .not('agency', 'is', null)
    .not('agency', 'eq', '')
    .order('agency');

  if (error) {
    console.error('getAgencies failed:', error.message);
    return [];
  }

  // Deduplicate
  const unique = [...new Set((data || []).map(r => r.agency).filter(Boolean))];
  return unique as string[];
}
