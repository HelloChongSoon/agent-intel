import { scrapeLeaderboard } from './leaderboard';
import { scrapeAgents } from './agents';
import { scrapeMovements } from './movements';

const COMMANDS: Record<string, string> = {
  leaderboard: 'Scrape agent rankings (all pages)',
  agents: 'Scrape agent profiles (from leaderboard CEA numbers)',
  movements: 'Scrape agency movement records',
  all: 'Run all scrapers in sequence',
};

function printUsage(): void {
  console.log('\nUsage: npx ts-node src/scraper/index.ts <command> [options]\n');
  console.log('Commands:');
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(15)} ${desc}`);
  }
  console.log('\nOptions:');
  console.log('  --max-pages=N    Limit number of pages to scrape');
  console.log('  --max-agents=N   Limit number of agent profiles to scrape');
  console.log('  --delay=N        Delay between requests in ms (default: 750)');
  console.log('  --year=N         Year for leaderboard (default: 2026)');
  console.log('');
}

function parseArgs(args: string[]): { command: string; options: Record<string, string> } {
  const command = args[0] || '';
  const options: Record<string, string> = {};

  for (const arg of args.slice(1)) {
    const match = arg.match(/^--(\w[\w-]*)=(.+)$/);
    if (match) {
      options[match[1]] = match[2];
    }
  }

  return { command, options };
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (!command || !COMMANDS[command]) {
    printUsage();
    process.exit(command ? 1 : 0);
  }

  const maxPages = options['max-pages'] ? parseInt(options['max-pages']) : undefined;
  const maxAgents = options['max-agents'] ? parseInt(options['max-agents']) : undefined;
  const delayMs = options['delay'] ? parseInt(options['delay']) : undefined;
  const year = options['year'] ? parseInt(options['year']) : undefined;
  const resume = 'resume' in options;

  const startTime = Date.now();

  try {
    if (command === 'leaderboard' || command === 'all') {
      await scrapeLeaderboard({ year, maxPages, delayMs });
    }

    if (command === 'agents' || command === 'all') {
      await scrapeAgents({ fromLeaderboard: true, maxAgents, delayMs, resume });
    }

    if (command === 'movements' || command === 'all') {
      await scrapeMovements({ maxPages, delayMs });
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nDone in ${elapsed}s`);
  } catch (err) {
    console.error('\nFatal error:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
