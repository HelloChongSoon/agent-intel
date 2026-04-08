import { createClient } from '@supabase/supabase-js';
import { scrapeMovementsBrowser } from '../src/scraper/movements-browser';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DATA_DIR = path.join(process.cwd(), 'data', 'raw');
const BATCH_SIZE = 500;

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function readJsonl<T>(filename: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, filename);
  const lines: T[] = [];
  try {
    const rl = createInterface({ input: createReadStream(filePath) });
    for await (const line of rl) {
      if (line.trim()) lines.push(JSON.parse(line));
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      log(`  File not found: ${filePath}`);
      return [];
    }
    throw err;
  }
  return lines;
}

async function syncMovements() {
  log('Scraping movements via browser...');
  await scrapeMovementsBrowser({ maxPages: 200 });

  log('Reading scraped movements...');
  const movements = await readJsonl<any>('movements.jsonl');
  if (movements.length === 0) {
    log('  No movements to sync');
    return 0;
  }

  const rows = movements.map(m => ({
    cea_number: m.ceaNumber,
    agent_name: m.agentName,
    previous_agency: m.previousAgency || null,
    new_agency: m.newAgency || null,
    date: m.date,
    type: m.type,
  }));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('movements').upsert(batch, { onConflict: 'cea_number,date,type' });
    if (error) {
      console.error(`Error upserting movements at batch ${i}:`, error.message);
    }
  }

  log(`  Movements: ${rows.length} upserted`);
  return rows.length;
}

async function main() {
  log('Starting scraper sync');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  const mvCount = await syncMovements();
  log(`\nScraper sync complete! Movements: ${mvCount}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
