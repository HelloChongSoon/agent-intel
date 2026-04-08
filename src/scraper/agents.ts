import * as path from 'path';
import * as fs from 'fs';
import pLimit from 'p-limit';
import { AgentProfile, Transaction } from '../types';
import { fetchPage, delay, buildUrl, ensureOutputDir, appendJsonl, clearFile, log } from './utils';

interface RawAgentData {
  name?: string;
  reg_num?: string;
  estate_agent_name?: string;
  phone?: string;
  email?: string;
  registration_start_date?: string;
  registration_end_date?: string;
  total_transactions?: number;
  records?: RawTransaction[];
}

interface RawTransaction {
  transaction_date?: string;
  property_type?: string;
  transaction_type?: string;
  represented?: string;
  general_location?: string;
  town?: string;
  district?: string;
}

function unescapeJson(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, '&')
    .replace(/\\\\/g, '\\');
}

function extractAgentData(html: string, ceaNumber: string): RawAgentData {
  const data: RawAgentData = { reg_num: ceaNumber };

  // All data is in Next.js streaming format with escaped JSON
  // Extract agent info block: contains name, reg_num, registration dates, agency, mobile, email
  const infoMarker = `\\"reg_num\\":\\"${ceaNumber}\\"`;
  const escapedInfoPatterns = [
    // Pattern: {...,"reg_num":"R043039D","registration_start_date":"...","estate_agent_name":"...",...}
    new RegExp(`\\{[^}]*?${infoMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^}]*?\\\\?"estate_agent_name\\\\?"[^}]*?\\}`, 's'),
  ];

  // Find agent info with estate_agent_name (the most complete block)
  const agencyEscaped = '\\"estate_agent_name\\"';
  const regStartEscaped = '\\"registration_start_date\\"';

  // Find the block containing registration + agency info
  const regIdx = html.indexOf(regStartEscaped);
  if (regIdx >= 0) {
    // Go back to find the opening of this object and forward to find the end
    const blockStart = html.lastIndexOf('{', regIdx);
    const blockEnd = html.indexOf('}', regIdx + 200);
    if (blockStart >= 0 && blockEnd >= 0) {
      const block = unescapeJson(html.slice(blockStart, blockEnd + 1));
      try {
        const info = JSON.parse(block);
        data.name = info.name;
        data.reg_num = info.reg_num || ceaNumber;
        data.registration_start_date = info.registration_start_date;
        data.registration_end_date = info.registration_end_date;
        data.estate_agent_name = info.estate_agent_name;
        data.phone = info.mobile;
        data.email = info.email;
      } catch {
        // Extract individual fields via regex from the unescaped block
        const fields: Record<string, RegExp> = {
          name: /"name":"([^"]+)"/,
          estate_agent_name: /"estate_agent_name":"([^"]+)"/,
          registration_start_date: /"registration_start_date":"([^"]+)"/,
          registration_end_date: /"registration_end_date":"([^"]+)"/,
          phone: /"mobile":"([^"]+)"/,
          email: /"email":"([^"]+)"/,
        };
        for (const [key, regex] of Object.entries(fields)) {
          const m = block.match(regex);
          if (m) (data as any)[key] = m[1];
        }
      }
    }
  }

  // Extract transaction records from initialData
  const recordsMarker = '\\"initialData\\":\{\\"records\\":[';
  const altMarker = '\\"initialData\\":{\\"records\\":[';
  let recordsIdx = html.indexOf(recordsMarker);
  if (recordsIdx < 0) recordsIdx = html.indexOf(altMarker);

  if (recordsIdx >= 0) {
    // Find "records":[ and extract the array
    const arrStart = html.indexOf('[', recordsIdx + 20);
    if (arrStart >= 0) {
      // Find the matching closing bracket - scan for ],
      // The records array ends with ],"
      let depth = 1;
      let pos = arrStart + 1;
      while (pos < html.length && depth > 0) {
        if (html[pos] === '[' && html[pos - 1] !== '\\') depth++;
        else if (html[pos] === ']' && html[pos - 1] !== '\\') depth--;
        pos++;
      }
      const arrStr = unescapeJson(html.slice(arrStart, pos));
      try {
        data.records = JSON.parse(arrStr);
      } catch {}
    }
  }

  // Fallback: extract name from HTML h1/h2
  if (!data.name) {
    const nameMatch = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/);
    if (nameMatch) data.name = nameMatch[1].trim();
  }

  return data;
}

function transformAgent(raw: RawAgentData, ceaNumber: string): AgentProfile {
  const transactions: Transaction[] = (raw.records || []).map(r => ({
    date: r.transaction_date || '',
    propertyType: r.property_type || '',
    transactionType: r.transaction_type || '',
    role: r.represented || '',
    location: r.general_location || r.town || r.district || '',
  }));

  return {
    name: raw.name || '',
    ceaNumber: raw.reg_num || ceaNumber,
    agency: raw.estate_agent_name || '',
    phone: raw.phone,
    email: raw.email,
    registrationStart: raw.registration_start_date,
    registrationEnd: raw.registration_end_date,
    totalTransactions: raw.total_transactions || transactions.length,
    transactions,
  };
}

export async function scrapeAgents(options: {
  ceaNumbers?: string[];
  fromLeaderboard?: boolean;
  concurrency?: number;
  delayMs?: number;
  maxAgents?: number;
  resume?: boolean;
} = {}): Promise<void> {
  const concurrency = options.concurrency || 2;
  const delayMs = options.delayMs || 750;
  const maxAgents = options.maxAgents || Infinity;
  const resume = options.resume || false;
  const limit = pLimit(concurrency);

  const outputDir = ensureOutputDir('');
  const outputFile = path.join(outputDir, 'agents.jsonl');

  // If not resuming, start fresh
  if (!resume) {
    clearFile(outputFile);
  }

  let ceaNumbers = options.ceaNumbers || [];

  // If using leaderboard as source, read CEA numbers from leaderboard.jsonl
  if (options.fromLeaderboard || ceaNumbers.length === 0) {
    const leaderboardFile = path.join(outputDir, 'leaderboard.jsonl');
    if (fs.existsSync(leaderboardFile)) {
      const lines = fs.readFileSync(leaderboardFile, 'utf-8').split('\n').filter(Boolean);
      ceaNumbers = lines.map(line => JSON.parse(line).ceaNumber);
      log(`Loaded ${ceaNumbers.length} CEA numbers from leaderboard`);
    } else {
      log('No leaderboard.jsonl found. Provide CEA numbers or run leaderboard scraper first.');
      return;
    }
  }

  // Deduplicate
  ceaNumbers = [...new Set(ceaNumbers)];

  // If resuming, skip already-scraped agents
  if (resume && fs.existsSync(outputFile)) {
    const existingLines = fs.readFileSync(outputFile, 'utf-8').split('\n').filter(Boolean);
    const existingCeas = new Set(existingLines.map(line => JSON.parse(line).ceaNumber));
    const before = ceaNumbers.length;
    ceaNumbers = ceaNumbers.filter(c => !existingCeas.has(c));
    log(`Resume mode: skipping ${before - ceaNumbers.length} already-scraped agents`);
  }

  if (ceaNumbers.length > maxAgents) {
    ceaNumbers = ceaNumbers.slice(0, maxAgents);
  }

  log(`Starting agent profile scrape for ${ceaNumbers.length} agents`);

  let scraped = 0;
  let failed = 0;

  const tasks = ceaNumbers.map((ceaNumber, idx) =>
    limit(async () => {
      try {
        const url = buildUrl(`/agent/${ceaNumber}`);
        const html = await fetchPage(url);
        const raw = extractAgentData(html, ceaNumber);
        const agent = transformAgent(raw, ceaNumber);
        appendJsonl(outputFile, agent);
        scraped++;

        if (scraped % 50 === 0 || scraped === ceaNumbers.length) {
          log(`  Progress: ${scraped}/${ceaNumbers.length} agents scraped`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`  Failed ${ceaNumber}: ${msg}`);
        failed++;
      }

      await delay(delayMs);
    })
  );

  await Promise.all(tasks);

  log(`Agent scrape complete: ${scraped} saved, ${failed} failed → ${outputFile}`);
}
