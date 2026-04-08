import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://openagent.sg';
const DEFAULT_DELAY_MS = 750;
const MAX_RETRIES = 3;

export function buildUrl(pathname: string, params?: Record<string, string>): string {
  const url = new URL(pathname, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function delay(ms: number = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchPage(url: string, retries: number = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OpenAgentScraper/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Attempt ${attempt}/${retries} failed for ${url}: ${message}`);

      if (attempt < retries) {
        const backoff = attempt * 1500;
        await delay(backoff);
      } else {
        throw new Error(`Failed after ${retries} attempts: ${url}`);
      }
    }
  }
  throw new Error('Unreachable');
}

export function ensureOutputDir(subdir: string): string {
  const base = process.env.OUTPUT_DIR || path.join(process.cwd(), 'data', 'raw');
  const outputDir = path.join(base, subdir);
  fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

export function appendJsonl(filePath: string, data: unknown): void {
  fs.appendFileSync(filePath, JSON.stringify(data) + '\n');
}

export function clearFile(filePath: string): void {
  fs.writeFileSync(filePath, '');
}

export function log(message: string): void {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${message}`);
}
