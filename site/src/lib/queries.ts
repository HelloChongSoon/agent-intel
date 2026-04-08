import { supabase } from './supabase';

export interface LeaderboardRow {
  rank: number;
  name: string;
  cea_number: string;
  agency: string;
  transactions: number;
}

export async function getLeaderboard(params: {
  page?: number;
  pageSize?: number;
  agency?: string;
}): Promise<{ rows: LeaderboardRow[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('leaderboard_mv')
    .select('cea_number, name, agency, transactions, rank', { count: 'exact' });

  if (params.agency) {
    query = query.eq('agency', params.agency);
  }

  const { data, count, error } = await query
    .order('rank', { ascending: true })
    .range(from, to);

  if (error) throw error;

  return {
    rows: (data || []) as LeaderboardRow[],
    total: count || 0,
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
  const { data, error } = await supabase
    .from('transactions')
    .select('date, property_type, transaction_type, role, location')
    .eq('cea_number', ceaNumber)
    .order('date', { ascending: false });

  if (error) throw error;
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

  if (error) throw error;

  return {
    rows: (data || []) as MovementRow[],
    total: count || 0,
  };
}

export async function searchAgents(query: string, limit: number = 50): Promise<AgentRow[]> {
  // Use trigram similarity for fuzzy search on name, exact match on CEA number
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,cea_number.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;
  return (data || []) as AgentRow[];
}

export async function getAgencies(): Promise<string[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('agency')
    .not('agency', 'is', null)
    .not('agency', 'eq', '')
    .order('agency');

  if (error) throw error;

  // Deduplicate
  const unique = [...new Set((data || []).map(r => r.agency).filter(Boolean))];
  return unique as string[];
}
