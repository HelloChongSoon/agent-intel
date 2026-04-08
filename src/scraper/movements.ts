import * as path from 'path';
import { Movement } from '../types';
import { fetchPage, delay, buildUrl, ensureOutputDir, appendJsonl, clearFile, log } from './utils';

interface RawMovement {
  salesperson_name?: string;
  reg_num?: string;
  old_estate_agent_name?: string;
  new_estate_agent_name?: string;
  detected_at?: string;
  movement_type?: string;
}

function unescapeJson(str: string): string {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, '&')
    .replace(/\\u002/g, '')
    .replace(/\\\\/g, '\\');
}

function extractMovementsData(html: string): { movements: RawMovement[]; totalCount: number; hasMore: boolean } {
  // Data is in Next.js streaming format with escaped JSON
  // Pattern: \"initialData\":{\"movements\":[...],\"totalCount\":N,\"hasMore\":bool}
  const marker = '\\"initialData\\":\{\\"movements\\":[';
  const markerIdx = html.indexOf(marker);

  if (markerIdx >= 0) {
    // Extract a large chunk from the marker
    const chunk = html.slice(markerIdx, markerIdx + 500000);
    const unescaped = unescapeJson(chunk);

    // Parse the initialData object
    const match = unescaped.match(/"initialData":\{"movements":\[(.*?)\],"totalCount":(\d+),"hasMore":(true|false)\}/s);
    if (match) {
      try {
        const movements: RawMovement[] = JSON.parse('[' + match[1] + ']');
        return {
          movements,
          totalCount: parseInt(match[2]),
          hasMore: match[3] === 'true',
        };
      } catch {}
    }
  }

  // Fallback: try unescaped format
  const altMarker = '"initialData":{"movements":[';
  const altIdx = html.indexOf(altMarker);
  if (altIdx >= 0) {
    const chunk = html.slice(altIdx, altIdx + 500000);
    const match = chunk.match(/"initialData":\{"movements":\[(.*?)\],"totalCount":(\d+),"hasMore":(true|false)\}/s);
    if (match) {
      try {
        const movements: RawMovement[] = JSON.parse('[' + match[1] + ']');
        return { movements, totalCount: parseInt(match[2]), hasMore: match[3] === 'true' };
      } catch {}
    }
  }

  throw new Error('Could not extract movements data from page');
}

function transformMovement(raw: RawMovement): Movement {
  return {
    agentName: raw.salesperson_name || '',
    ceaNumber: raw.reg_num || '',
    previousAgency: raw.old_estate_agent_name || undefined,
    newAgency: raw.new_estate_agent_name || undefined,
    date: raw.detected_at || '',
    type: (raw.movement_type as Movement['type']) || 'agency_change',
  };
}

export async function scrapeMovements(options: {
  maxPages?: number;
  delayMs?: number;
} = {}): Promise<void> {
  const maxPages = options.maxPages || Infinity;
  const delayMs = options.delayMs || 750;

  const outputDir = ensureOutputDir('');
  const outputFile = path.join(outputDir, 'movements.jsonl');
  clearFile(outputFile);

  let page = 1;
  let totalCount = 0;
  let scraped = 0;

  log('Starting movements scrape');

  while (page <= maxPages) {
    const url = buildUrl('/movements', { page: String(page) });
    log(`Fetching page ${page}... ${url}`);

    const html = await fetchPage(url);
    const data = extractMovementsData(html);

    if (page === 1) {
      totalCount = data.totalCount;
      log(`Total movements: ${totalCount}`);
    }

    if (data.movements.length === 0) {
      log('No more movements found, stopping');
      break;
    }

    for (const raw of data.movements) {
      const movement = transformMovement(raw);
      appendJsonl(outputFile, movement);
      scraped++;
    }

    log(`  Page ${page}: ${data.movements.length} movements (total scraped: ${scraped})`);

    if (!data.hasMore) {
      log('No more pages');
      break;
    }

    page++;
    await delay(delayMs);
  }

  log(`Movements scrape complete: ${scraped} records saved to ${outputFile}`);
}
