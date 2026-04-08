// @ts-nocheck
import { chromium } from 'playwright';
import * as path from 'path';
import { Movement } from '../types';
import { ensureOutputDir, appendJsonl, clearFile, log } from './utils';

function extractFromRSC(text: string): any[] {
  const results: any[] = [];
  // Unescape all variants
  let unescaped = text;
  // Handle multiple levels of escaping
  for (let i = 0; i < 3; i++) {
    if (unescaped.includes('\\"')) {
      unescaped = unescaped.replace(/\\"/g, '"');
    }
  }
  unescaped = unescaped.replace(/\\u0026/g, '&');

  // Match movement objects with id field
  const pattern = /\{"id":\d+,"detected_at":"[^"]+","reg_num":"[A-Z]\d+[A-Z]","salesperson_name":"[^"]*"(?:,"old_estate_agent_name":(?:"[^"]*"|null))?(?:,"new_estate_agent_name":(?:"[^"]*"|null))?(?:,"old_estate_agent_license_no":(?:"[^"]*"|null))?(?:,"new_estate_agent_license_no":(?:"[^"]*"|null))?,"movement_type":"[^"]*"\}/g;
  const matches = unescaped.match(pattern);
  if (matches) {
    for (const m of matches) {
      try { results.push(JSON.parse(m)); } catch {}
    }
  }

  // Fallback: less strict pattern
  if (results.length === 0) {
    const loosePat = /\{"id":\d+[^}]*movement_type[^}]*\}/g;
    const looseMatches = unescaped.match(loosePat);
    if (looseMatches) {
      for (const m of looseMatches) {
        try { results.push(JSON.parse(m)); } catch {}
      }
    }
  }

  return results;
}

function transformMovement(raw: any): Movement {
  return {
    agentName: raw.salesperson_name || '',
    ceaNumber: raw.reg_num || '',
    previousAgency: raw.old_estate_agent_name || undefined,
    newAgency: raw.new_estate_agent_name || undefined,
    date: raw.detected_at || '',
    type: (raw.movement_type as Movement['type']) || 'agency_change',
  };
}

export async function scrapeMovementsBrowser(options: { maxPages?: number } = {}): Promise<void> {
  const maxPages = options.maxPages || Infinity;
  const outputDir = ensureOutputDir('');
  const outputFile = path.join(outputDir, 'movements.jsonl');
  clearFile(outputFile);

  log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allMovements = new Map<number, any>();

  // Intercept ALL responses
  page.on('response', async (response) => {
    try {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('text/x-component') || (response.url().includes('movements') && ct.includes('text/html'))) {
        const text = await response.text();
        const extracted = extractFromRSC(text);
        for (const mv of extracted) {
          if (mv.id && !allMovements.has(mv.id)) {
            allMovements.set(mv.id, mv);
          }
        }
      }
    } catch {}
  });

  log('Navigating to movements page...');
  await page.goto('https://openagent.sg/movements', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  log(`Initial load: ${allMovements.size} movements`);

  let pageNum = 1;
  let staleCount = 0;

  while (pageNum < maxPages) {
    const nextBtn = page.locator('button:has-text("Next")').first();
    const isVisible = await nextBtn.isVisible().catch(() => false);
    if (!isVisible) { log('Next button not found'); break; }
    const isDisabled = await nextBtn.evaluate((el: any) => el.disabled).catch(() => false);
    if (isDisabled) { log('Last page reached'); break; }

    const before = allMovements.size;

    // Wait for the RSC response after clicking
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('movements') && res.request().method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null);

    await nextBtn.click();
    await responsePromise;
    await page.waitForTimeout(500);
    pageNum++;

    const after = allMovements.size;
    const added = after - before;

    if (added === 0) {
      // RSC response might not have parsed — wait more
      await page.waitForTimeout(3000);
      const afterWait = allMovements.size;
      if (afterWait === after) {
        staleCount++;
        if (staleCount >= 5) { log('Stale for 5 pages, stopping'); break; }
      } else {
        staleCount = 0;
      }
    } else {
      staleCount = 0;
    }

    if (pageNum % 10 === 0) {
      log(`  Page ${pageNum}: ${allMovements.size} total movements`);
    }
  }

  // Sort and write
  const sorted = [...allMovements.values()].sort((a, b) =>
    new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
  );
  for (const raw of sorted) {
    appendJsonl(outputFile, transformMovement(raw));
  }

  log(`Done: ${sorted.length} unique movements → ${outputFile}`);
  await browser.close();
}

if (require.main === module) {
  const maxPages = process.argv[2] ? parseInt(process.argv[2]) : undefined;
  scrapeMovementsBrowser({ maxPages }).catch(console.error);
}
