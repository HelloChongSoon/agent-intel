import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { createInterface } from 'readline';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY = process.env.DATAGOV_API_KEY || '';
const BATCH_SIZE = 500;
const MAX_UPSERT_ATTEMPTS = 5;
const UPSERT_RETRY_BASE_MS = 2_000;
const TMP_DIR = process.env.TMP_DIR || '/tmp';

const DATASETS = {
  agents: 'd_07c63be0f37e6e59c07a4ddc2fd87fcb',
  transactions: 'd_ee7e46d3c57f7865790704632b0aef71',
};

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function txHash(ceaNumber: string, date: string, propType: string, txType: string, role: string, location: string): string {
  return createHash('md5').update(`${ceaNumber}|${date}|${propType}|${txType}|${role}|${location}`).digest('hex');
}

function normalizeLocationPart(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === '-') return null;
  return normalized;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getErrorMessage(error: any): string {
  return String(error?.message || error?.error_description || error?.details || error || '');
}

function isTransientUpsertError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = String(error?.code || error?.status || error?.statusCode || '');

  return (
    ['502', '503', '504', '522', '523', '524', '57014', '08006', '53300'].includes(code) ||
    message.includes('502 bad gateway') ||
    message.includes('503 service unavailable') ||
    message.includes('504 gateway timeout') ||
    message.includes('bad gateway') ||
    message.includes('gateway timeout') ||
    message.includes('cloudflare') ||
    message.includes('canceling statement due to statement timeout') ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

function retryDelay(attempt: number): number {
  const jitter = Math.floor(Math.random() * 750);
  return UPSERT_RETRY_BASE_MS * 2 ** (attempt - 1) + jitter;
}

async function upsertWithRetry(
  table: string,
  rows: any | any[],
  onConflict: string,
  ignoreDuplicates: boolean,
  context: string
) {
  for (let attempt = 1; attempt <= MAX_UPSERT_ATTEMPTS; attempt++) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict, ignoreDuplicates });

    if (!error) {
      return null;
    }

    if (!isTransientUpsertError(error) || attempt === MAX_UPSERT_ATTEMPTS) {
      return error;
    }

    const waitMs = retryDelay(attempt);
    log(
      `  ${context}: transient upsert error on attempt ${attempt}/${MAX_UPSERT_ATTEMPTS}; retrying in ${Math.round(waitMs / 1000)}s`
    );
    await delay(waitMs);
  }

  return null;
}

// Download CSV via data.gov.sg v1 download API (returns S3 presigned URL)
async function downloadDataset(datasetId: string, filename: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (API_KEY) headers['x-api-key'] = API_KEY;

  // Step 1: Initiate download
  log(`  Initiating download for ${datasetId}...`);
  const initRes = await fetch(
    `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/initiate-download`,
    { headers }
  );
  const initData = await initRes.json();

  let downloadUrl: string;

  if (initData.data?.url) {
    // Direct URL returned
    downloadUrl = initData.data.url;
  } else {
    // Need to poll
    log('  Polling for download URL...');
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      const pollRes = await fetch(
        `https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`,
        { headers }
      );
      const pollData = await pollRes.json();
      if (pollData.data?.url) {
        downloadUrl = pollData.data.url;
        break;
      }
      if (i === 29) throw new Error('Timed out waiting for download URL');
    }
  }

  // Step 2: Download CSV
  log(`  Downloading CSV...`);
  const csvRes = await fetch(downloadUrl!);
  if (!csvRes.ok) throw new Error(`Download failed: ${csvRes.status}`);

  const filePath = path.join(TMP_DIR, filename);
  const body = csvRes.body;
  if (!body) throw new Error('No response body');

  const chunks: Buffer[] = [];
  const reader = body.getReader();
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
    totalBytes += value.length;
  }
  writeFileSync(filePath, Buffer.concat(chunks));
  log(`  Downloaded ${(totalBytes / 1024 / 1024).toFixed(1)}MB to ${filePath}`);

  return filePath;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

async function batchUpsert(
  table: string,
  rows: any[],
  onConflict: string,
  options: { ignoreDuplicates?: boolean } = {}
) {
  const ignoreDuplicates = options.ignoreDuplicates ?? true;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    let batch = rows.slice(i, i + BATCH_SIZE);
    // Deduplicate within batch by conflict key to avoid "cannot affect row a second time"
    const seen = new Set<string>();
    batch = batch.filter(row => {
      const key = onConflict.split(',').map(k => row[k.trim()]).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const error = await upsertWithRetry(table, batch, onConflict, ignoreDuplicates, `${table} batch ${i}`);
    if (error) {
      // FK violations: insert rows one-by-one to skip bad references
      if (error.code === '23503') {
        let inserted = 0;
        for (const row of batch) {
          const rowErr = await upsertWithRetry(table, row, onConflict, ignoreDuplicates, `${table} row fallback ${i}`);
          if (!rowErr) inserted++;
        }
        log(`  Batch ${i}: ${inserted}/${batch.length} rows (skipped FK violations)`);
        continue;
      }
      console.error(`Error upserting to ${table} at batch ${i}:`, error.message);
      throw error;
    }
  }
}

async function syncAgents() {
  log('Syncing agents from data.gov.sg...');

  const csvPath = await downloadDataset(DATASETS.agents, 'agents.csv');

  const rl = createInterface({ input: createReadStream(csvPath) });
  let headers: string[] = [];
  let batch: any[] = [];
  let totalUpserted = 0;

  for await (const line of rl) {
    if (!headers.length) {
      headers = parseCSVLine(line).map(h => h.toLowerCase().trim());
      continue;
    }

    const fields = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = fields[i] || ''; });

    batch.push({
      cea_number: row.registration_no,
      name: row.salesperson_name,
      agency: row.estate_agent_name || null,
      registration_start: row.registration_start_date || null,
      registration_end: row.registration_end_date || null,
    });

    if (batch.length >= BATCH_SIZE) {
      await batchUpsert('agents', batch, 'cea_number', { ignoreDuplicates: false });
      totalUpserted += batch.length;
      batch = [];
      if (totalUpserted % 10000 === 0) log(`  Agents: ${totalUpserted} upserted`);
    }
  }

  if (batch.length > 0) {
    await batchUpsert('agents', batch, 'cea_number', { ignoreDuplicates: false });
    totalUpserted += batch.length;
  }

  unlinkSync(csvPath);
  log(`  Agents sync complete: ${totalUpserted} total`);
  return totalUpserted;
}

async function syncTransactions() {
  log('Syncing transactions from data.gov.sg...');

  const csvPath = await downloadDataset(DATASETS.transactions, 'transactions.csv');

  // CSV columns: salesperson_name, transaction_date, salesperson_reg_num,
  //              property_type, transaction_type, represented, town, district, general_location
  const rl = createInterface({ input: createReadStream(csvPath) });
  let headers: string[] = [];
  let batch: any[] = [];
  let totalUpserted = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!headers.length) {
      headers = parseCSVLine(line).map(h => h.toLowerCase().trim());
      continue;
    }

    const fields = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = fields[i] || ''; });

    const ceaNumber = row.salesperson_reg_num;
    if (!ceaNumber) { skipped++; continue; }

    const location = [
      normalizeLocationPart(row.town),
      normalizeLocationPart(row.district),
      normalizeLocationPart(row.general_location),
    ]
      .filter((value): value is string => Boolean(value))
      .join(', ');

    const dateVal = row.transaction_date || '';
    let year: number | null = null;
    const mmYyyy = dateVal.match(/^[A-Z]{3}-(\d{4})$/);
    if (mmYyyy) year = parseInt(mmYyyy[1], 10);
    else if (/^\d{4}-/.test(dateVal)) year = parseInt(dateVal.slice(0, 4), 10);

    // Extract area from general_location (the part after district code in the location string)
    const area = normalizeLocationPart(row.general_location);

    batch.push({
      cea_number: ceaNumber,
      date: dateVal,
      year,
      property_type: row.property_type || null,
      transaction_type: row.transaction_type || null,
      role: row.represented || null,
      location: location || null,
      area: area || null,
      hash: txHash(ceaNumber, dateVal, row.property_type || '', row.transaction_type || '', row.represented || '', location || ''),
    });

    if (batch.length >= BATCH_SIZE) {
      await batchUpsert('transactions', batch, 'hash');
      totalUpserted += batch.length;
      batch = [];
      if (totalUpserted % 50000 === 0) log(`  Transactions: ${totalUpserted} upserted`);
    }
  }

  if (batch.length > 0) {
    await batchUpsert('transactions', batch, 'hash');
    totalUpserted += batch.length;
  }

  unlinkSync(csvPath);
  log(`  Transactions sync complete: ${totalUpserted} total (${skipped} skipped)`);
  return totalUpserted;
}

async function main() {
  log('Starting data.gov.sg sync');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  if (!API_KEY) {
    log('Warning: No DATAGOV_API_KEY set — downloads may be rate limited');
  }

  const agentCount = await syncAgents();
  const txCount = await syncTransactions();

  if (txCount > 0 || agentCount > 0) {
    log('Refreshing leaderboard...');
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
