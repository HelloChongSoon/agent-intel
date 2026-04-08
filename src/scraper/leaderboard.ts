import * as path from 'path';
import { LeaderboardAgent } from '../types';
import { fetchPage, delay, buildUrl, ensureOutputDir, appendJsonl, clearFile, log } from './utils';

interface RawLeaderboardRow {
  rank: number;
  reg_num: string;
  name: string;
  estate_agent_name: string;
  transaction_count: number;
}

function extractLeaderboardData(html: string): { rows: RawLeaderboardRow[]; totalCount: number; hasMore: boolean } {
  // Data is in Next.js streaming format: self.__next_f.push([1,"...escaped JSON..."])
  // The JSON is escaped with \" inside the string literal
  // Strategy: find the escaped initialData block, unescape it, then parse

  // Find the escaped "initialData" marker
  const marker = '\\"initialData\\"';
  const markerIdx = html.indexOf(marker);

  if (markerIdx >= 0) {
    // Extract a large chunk starting from initialData
    const chunk = html.slice(markerIdx, markerIdx + 500000);

    // Unescape the JSON: \" -> " and \\ -> \
    const unescaped = chunk
      .replace(/\\"/g, '"')
      .replace(/\\u0026/g, '&')
      .replace(/\\\\/g, '\\');

    // Now extract the initialData object
    const match = unescaped.match(/"initialData":\{"rows":\[(.*?)\],"totalCount":(\d+),"hasMore":(true|false)\}/s);
    if (match) {
      try {
        const rows: RawLeaderboardRow[] = JSON.parse('[' + match[1] + ']');
        return {
          rows,
          totalCount: parseInt(match[2]),
          hasMore: match[3] === 'true',
        };
      } catch {}
    }
  }

  // Fallback: look for unescaped format (in case structure changes)
  const unescapedMarker = '"initialData"';
  const uIdx = html.indexOf(unescapedMarker);
  if (uIdx >= 0) {
    const chunk = html.slice(uIdx, uIdx + 500000);
    const match = chunk.match(/"initialData":\{"rows":\[(.*?)\],"totalCount":(\d+),"hasMore":(true|false)\}/s);
    if (match) {
      try {
        const rows: RawLeaderboardRow[] = JSON.parse('[' + match[1] + ']');
        return { rows, totalCount: parseInt(match[2]), hasMore: match[3] === 'true' };
      } catch {}
    }
  }

  throw new Error('Could not extract leaderboard data from page');
}

function transformRow(row: RawLeaderboardRow, year: number): LeaderboardAgent {
  return {
    rank: row.rank,
    name: row.name,
    ceaNumber: row.reg_num,
    agency: row.estate_agent_name,
    transactions: row.transaction_count,
    year,
  };
}

export async function scrapeLeaderboard(options: {
  year?: number;
  maxPages?: number;
  delayMs?: number;
} = {}): Promise<void> {
  const year = options.year || 2026;
  const maxPages = options.maxPages || Infinity;
  const delayMs = options.delayMs || 750;

  const outputDir = ensureOutputDir('');
  const outputFile = path.join(outputDir, 'leaderboard.jsonl');
  clearFile(outputFile);

  let page = 1;
  let totalCount = 0;
  let scraped = 0;

  log(`Starting leaderboard scrape for year ${year}`);

  while (page <= maxPages) {
    const url = buildUrl('/leaderboard', { page: String(page), year: String(year) });
    log(`Fetching page ${page}... ${url}`);

    const html = await fetchPage(url);
    const data = extractLeaderboardData(html);

    if (page === 1) {
      totalCount = data.totalCount;
      log(`Total agents: ${totalCount}`);
    }

    if (data.rows.length === 0) {
      log('No more rows found, stopping');
      break;
    }

    for (const row of data.rows) {
      const agent = transformRow(row, year);
      appendJsonl(outputFile, agent);
      scraped++;
    }

    log(`  Page ${page}: ${data.rows.length} agents (total scraped: ${scraped})`);

    if (!data.hasMore) {
      log('No more pages');
      break;
    }

    page++;
    await delay(delayMs);
  }

  log(`Leaderboard scrape complete: ${scraped} agents saved to ${outputFile}`);
}
