import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { createHash } from 'crypto';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '..', 'data', 'raw');
const BATCH_SIZE = 500;

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function txHash(ceaNumber: string, date: string, propType: string, txType: string, role: string, location: string): string {
  return createHash('md5').update(`${ceaNumber}|${date}|${propType}|${txType}|${role}|${location}`).digest('hex');
}

async function readJsonl<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  const lines: T[] = [];
  const rl = createInterface({ input: createReadStream(filePath) });
  for await (const line of rl) {
    if (line.trim()) lines.push(JSON.parse(line));
  }
  return lines;
}

async function batchUpsert(table: string, rows: any[], onConflict: string) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      console.error(`Error upserting to ${table} at batch ${i}:`, error.message);
      throw error;
    }
    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= rows.length) {
      log(`  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }
  }
}

async function loadAgents() {
  log('Loading agents...');
  const agents = await readJsonl<any>('agents.jsonl');

  const agentRows = agents.map(a => ({
    cea_number: a.ceaNumber,
    name: a.name,
    agency: a.agency || null,
    phone: a.phone || null,
    email: a.email || null,
    registration_start: a.registrationStart || null,
    registration_end: a.registrationEnd || null,
    total_transactions: a.totalTransactions || 0,
  }));

  await batchUpsert('agents', agentRows, 'cea_number');
  log(`  Agents: ${agentRows.length} upserted`);

  // Load transactions
  log('Loading transactions...');
  let txCount = 0;
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    if (!agent.transactions?.length) continue;

    const txRows = agent.transactions.map((tx: any) => ({
      cea_number: agent.ceaNumber,
      date: tx.date,
      property_type: tx.propertyType || null,
      transaction_type: tx.transactionType || null,
      role: tx.role || null,
      location: tx.location || null,
      hash: txHash(agent.ceaNumber, tx.date, tx.propertyType || '', tx.transactionType || '', tx.role || '', tx.location || ''),
    }));

    // Batch insert transactions for this agent
    for (let j = 0; j < txRows.length; j += BATCH_SIZE) {
      const batch = txRows.slice(j, j + BATCH_SIZE);
      const { error } = await supabase.from('transactions').upsert(batch, { onConflict: 'hash' });
      if (error) {
        console.error(`Error inserting transactions for ${agent.ceaNumber}:`, error.message);
      }
    }

    txCount += txRows.length;
    if ((i + 1) % 500 === 0) {
      log(`  Transactions: processed ${i + 1}/${agents.length} agents (${txCount} rows)`);
    }
  }
  log(`  Transactions: ${txCount} total`);
}

async function loadLeaderboard() {
  log('Loading leaderboard agents from leaderboard.jsonl...');
  const entries = await readJsonl<any>('leaderboard.jsonl');

  // Ensure all leaderboard agents exist in the agents table
  const agentRows = entries.map(e => ({
    cea_number: e.ceaNumber,
    name: e.name,
    agency: e.agency || null,
    total_transactions: e.transactions || 0,
  }));

  await batchUpsert('agents', agentRows, 'cea_number');
  log(`  Ensured ${agentRows.length} leaderboard agents exist`);
}

async function loadMovements() {
  log('Loading movements...');
  const movements = await readJsonl<any>('movements.jsonl');

  const rows = movements.map(m => ({
    cea_number: m.ceaNumber,
    agent_name: m.agentName,
    previous_agency: m.previousAgency || null,
    new_agency: m.newAgency || null,
    date: m.date,
    type: m.type,
  }));

  await batchUpsert('movements', rows, 'cea_number,date,type');
  log(`  Movements: ${rows.length} upserted`);
}

async function refreshLeaderboard() {
  log('Refreshing leaderboard materialized view...');
  const { error } = await supabase.rpc('refresh_leaderboard');
  if (error) {
    console.error('Error refreshing leaderboard:', error.message);
  } else {
    log('  Leaderboard refreshed');
  }
}

async function main() {
  log('Starting initial data load to Supabase');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  await loadLeaderboard();
  await loadAgents();
  await loadMovements();
  await refreshLeaderboard();

  // Verify counts
  const { count: agentCount } = await supabase.from('agents').select('*', { count: 'exact', head: true });
  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  const { count: mvCount } = await supabase.from('movements').select('*', { count: 'exact', head: true });

  log(`\nDone! Final counts:`);
  log(`  Agents: ${agentCount}`);
  log(`  Transactions: ${txCount}`);
  log(`  Movements: ${mvCount}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
