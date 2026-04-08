import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 500;

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function txHash(ceaNumber: string, date: string, propType: string, txType: string, role: string, location: string): string {
  return createHash('md5').update(`${ceaNumber}|${date}|${propType}|${txType}|${role}|${location}`).digest('hex');
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function batchUpsert(table: string, rows: any[], onConflict: string) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      console.error(`Error upserting to ${table} at batch ${i}:`, error.message);
      throw error;
    }
  }
}

// data.gov.sg CKAN API endpoints
const DATASETS = {
  agents: 'd_93212e010e47e75a842d9040ef0be9c7',
  transactions: 'd_ebc84e4af2add3a1b1a698e7e65a0245',
};

async function syncAgents() {
  log('Syncing agents from data.gov.sg...');

  let offset = 0;
  const limit = 10000;
  let totalUpserted = 0;

  while (true) {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${DATASETS.agents}&limit=${limit}&offset=${offset}`;
    const data = await fetchJson(url);
    const records = data.result?.records || [];

    if (records.length === 0) break;

    const agentRows = records.map((r: any) => ({
      cea_number: r.registration_no || r.reg_num,
      name: r.salesperson_name || r.name,
      agency: r.estate_agent_name || r.agency || null,
      registration_start: r.registration_start_date || null,
      registration_end: r.registration_end_date || null,
      total_transactions: 0,
    }));

    await batchUpsert('agents', agentRows, 'cea_number');
    totalUpserted += agentRows.length;
    offset += limit;

    log(`  Agents: ${totalUpserted} upserted so far`);

    if (records.length < limit) break;
  }

  log(`  Agents sync complete: ${totalUpserted} total`);
  return totalUpserted;
}

async function syncTransactions() {
  log('Syncing transactions from data.gov.sg...');

  let offset = 0;
  const limit = 10000;
  let totalUpserted = 0;

  while (true) {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${DATASETS.transactions}&limit=${limit}&offset=${offset}`;
    const data = await fetchJson(url);
    const records = data.result?.records || [];

    if (records.length === 0) break;

    const txRows = records.map((r: any) => ({
      cea_number: r.salesperson_reg_num || r.reg_num,
      date: r.transaction_date || r.date || '',
      property_type: r.property_type || null,
      transaction_type: r.transaction_type || null,
      role: r.representing || r.role || null,
      location: r.project_name || r.location || null,
      hash: txHash(
        r.salesperson_reg_num || r.reg_num || '',
        r.transaction_date || r.date || '',
        r.property_type || '',
        r.transaction_type || '',
        r.representing || r.role || '',
        r.project_name || r.location || ''
      ),
    }));

    await batchUpsert('transactions', txRows, 'hash');
    totalUpserted += txRows.length;
    offset += limit;

    if (offset % 50000 === 0) {
      log(`  Transactions: ${totalUpserted} upserted so far`);
    }

    if (records.length < limit) break;
  }

  log(`  Transactions sync complete: ${totalUpserted} total`);
  return totalUpserted;
}

async function updateTransactionCounts() {
  log('Updating transaction counts on agents...');
  const { error } = await supabase.rpc('refresh_leaderboard');
  if (error) {
    console.error('Error refreshing leaderboard:', error.message);
  } else {
    log('  Leaderboard materialized view refreshed');
  }
}

async function main() {
  log('Starting data.gov.sg sync');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  const agentCount = await syncAgents();
  const txCount = await syncTransactions();

  // Update transaction counts per agent
  if (txCount > 0) {
    // Update total_transactions for each agent based on actual transaction count
    const { error } = await supabase.rpc('refresh_leaderboard');
    if (error) console.error('Error refreshing leaderboard:', error.message);
    else log('Leaderboard refreshed');
  }

  log(`\nSync complete! Agents: ${agentCount}, Transactions: ${txCount}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
