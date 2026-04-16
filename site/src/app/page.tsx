import SearchBar from '@/components/SearchBar';
import RootHeroBackground from '@/components/RootHeroBackground';
import HeroBlobCard from '@/components/HeroBlobCard';
import { createPageMetadata } from '@/lib/seo';
import { getAgencies, getAvailableLeaderboardYears, getLeaderboardFilterOptions, getMovements } from '@/lib/queries';
import { formatDateLabel, formatLabel, slugifySegment } from '@/lib/format';
import { getRequestAbsoluteUrl, getRequestSiteContext, getVariantSiteUrl } from '@/lib/site';
import Link from 'next/link';

export async function generateMetadata() {
  const context = await getRequestSiteContext();

  return createPageMetadata({
    title: context.isIntel
      ? 'Singapore Property Agent Rankings & Intelligence'
      : 'PropNext — Singapore Property Intelligence Platform',
    description: context.isIntel
      ? 'Compare Singapore property agents by transaction volume, track agency movements, and explore agent profiles powered by official CEA data.'
      : 'PropNext builds property intelligence tools for Singapore consumers, starting with agent rankings, movement tracking, and profile data.',
    path: '/',
  });
}

export default async function Home() {
  const [
    resolvedSiteUrl,
    context,
    agencies,
    years,
    movements,
  ] = await Promise.all([
    getRequestAbsoluteUrl('/'),
    getRequestSiteContext(),
    getAgencies(),
    getAvailableLeaderboardYears(),
    getMovements({ pageSize: 4, includeCount: false }),
  ]);
  const coverageYear = years[0] || new Date().getFullYear();
  const filterOptions = await getLeaderboardFilterOptions(coverageYear);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: context.isIntel ? 'PropNext Intel' : 'PropNext',
    url: resolvedSiteUrl,
    description: "Search property agents, track rankings, and monitor agency movements in Singapore's real estate market.",
    potentialAction: {
      '@type': 'SearchAction',
      target: `${resolvedSiteUrl.replace(/\/$/, '')}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

    if (!context.isIntel) {
      const intelUrl = getVariantSiteUrl('intel');

      return (
        <div className="space-y-10 py-4">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
  
          {/* ── Hero ── */}
          <section>
            <HeroBlobCard>
              <div className="px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-28">
                {/* Intro pill */}
                <div className="hero-fade-in hero-fade-in-d1 hero-pill-float relative inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 dark:border-zinc-700/60 bg-zinc-900/70 dark:bg-zinc-900/70 px-4 py-2 text-xs font-semibold text-zinc-300 backdrop-blur-sm hero-pill-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                  Singapore Property Intelligence
                </div>

                <h1 className="hero-fade-in hero-fade-in-d2 mt-7 max-w-4xl text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-[3.5rem] md:leading-[1.08] lg:text-[4.2rem]">
                  <span className="block">Clearer data.</span>
                  <span className="block mt-1 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                    Smarter choices.
                  </span>
                </h1>

                <p className="hero-fade-in hero-fade-in-d3 mt-6 max-w-2xl text-sm text-zinc-400 sm:text-base sm:leading-7">
                  PropNext builds property intelligence tools for Singapore consumers, starting with agent rankings, movement tracking, and structured profile data from official sources.
                </p>

                {/* Status badge */}
                <div className="hero-fade-in hero-fade-in-d4 hero-badge-float mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 dark:border-zinc-800 bg-zinc-900/60 dark:bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Building in public · Based in Singapore
                </div>

                {/* CTAs */}
                <div className="hero-fade-in hero-fade-in-d5 mt-10 flex flex-wrap gap-3">
                  <Link
                    href={intelUrl}
                    className="group relative inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 hover:-translate-y-0.5"
                  >
                    Explore PropNext Intel
                    <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </Link>
                  <Link
                    href="/about"
                    className="rounded-full border border-zinc-700 bg-zinc-900/40 px-6 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900/60 hover:-translate-y-0.5"
                  >
                    About PropNext
                  </Link>
                </div>
              </div>
            </HeroBlobCard>
          </section>

          {/* ── Product ── */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Product</p>
            <h2 className="mb-6 text-2xl font-semibold text-zinc-100 sm:text-3xl">What we&apos;re building</h2>

            <Link href="/products/intel" className="group flex flex-col gap-5 rounded-[24px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/90 dark:bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80">
                <svg viewBox="0 0 20 20" className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="2" y="10" width="3" height="8" rx="1" />
                  <rect x="8.5" y="6" width="3" height="12" rx="1" />
                  <rect x="15" y="2" width="3" height="16" rx="1" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100 transition group-hover:text-white">PropNext Intel</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">Agent rankings, profiles, and movement tracking powered by official CEA and URA data. Compare agent activity, specialization, and agency movements.</p>
              </div>
              <svg viewBox="0 0 16 16" className="hidden h-5 w-5 shrink-0 text-zinc-600 transition group-hover:text-zinc-300 group-hover:translate-x-1 sm:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </section>

          {/* ── Resources ── */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Resources</p>
            <h2 className="mb-6 text-2xl font-semibold text-zinc-100 sm:text-3xl">Learn more</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/methodology" className="group rounded-[24px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/90 dark:bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <svg viewBox="0 0 20 20" className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M10 2v5M10 18v-5M2 10h5M18 10h-5" />
                    <circle cx="10" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 transition group-hover:text-white">Methodology</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">How we calculate rankings, what the data means, and how consumers should interpret it.</p>
              </Link>

              <Link href="/contact" className="group rounded-[24px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/90 dark:bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <svg viewBox="0 0 20 20" className="h-5 w-5 text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                    <path d="m2 6 8 5 8-5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 transition group-hover:text-white">Contact</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Report data issues, ask about partnerships, or reach out about the product roadmap.</p>
              </Link>
            </div>
          </section>

          {/* ── Trust strip ── */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/60 dark:bg-zinc-950/60 p-6">
              <div className="text-2xl font-semibold text-zinc-100">Official sources</div>
              <p className="mt-2 text-sm text-zinc-400">Built on CEA registration records, URA transaction data, and data.gov.sg feeds.</p>
            </div>
            <div className="rounded-[20px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/60 dark:bg-zinc-950/60 p-6">
              <div className="text-2xl font-semibold text-zinc-100">Consumer-first</div>
              <p className="mt-2 text-sm text-zinc-400">Designed for home buyers and sellers, not for agents or agencies.</p>
            </div>
            <div className="rounded-[20px] border border-zinc-800 dark:border-zinc-800 bg-zinc-950/60 dark:bg-zinc-950/60 p-6">
              <div className="text-2xl font-semibold text-zinc-100">Open methodology</div>
              <p className="mt-2 text-sm text-zinc-400">Every ranking and metric links back to how it was calculated and where the data came from.</p>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-10 py-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        {/* ── Hero card with blob background ── */}
        <section>
          <HeroBlobCard>
            <div className="px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
              {/* Intro pill */}
              <div className="hero-fade-in hero-fade-in-d1 hero-pill-float relative inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 dark:border-zinc-700/60 bg-zinc-900/70 dark:bg-zinc-900/70 px-4 py-2 text-xs font-semibold text-zinc-300 backdrop-blur-sm hero-pill-border">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                Singapore Property Intelligence
              </div>

              <h1 className="hero-fade-in hero-fade-in-d2 mt-7 max-w-4xl text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-[3.5rem] md:leading-[1.08] lg:text-[4rem]">
                Compare agents with{' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  clearer data
                </span>
              </h1>

              <p className="hero-fade-in hero-fade-in-d3 mt-5 max-w-2xl text-sm text-zinc-400 sm:text-base sm:leading-7">
                Rankings, profiles, and movement intelligence powered by official CEA and URA records.
                Structured summaries that are easier to verify and use in a real decision.
              </p>

              {/* Status badge */}
              <div className="hero-fade-in hero-fade-in-d4 hero-badge-float mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 dark:border-zinc-800 bg-zinc-900/60 dark:bg-zinc-900/60 px-3.5 py-1.5 text-xs text-zinc-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Updated with {coverageYear} transaction data
              </div>

              {/* Search bar */}
              <div className="hero-fade-in hero-fade-in-d5 mt-8 max-w-xl">
                <SearchBar />
              </div>
            </div>
          </HeroBlobCard>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/leaderboard" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">Leaderboard</h2>
            <p className="text-sm text-zinc-400">Top agents by transaction volume, with property-type and deal-type filters.</p>
          </Link>
          <Link href="/movements" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">Movements</h2>
            <p className="text-sm text-zinc-400">Agency transfers, new registrations, and movement patterns that add context for consumers.</p>
          </Link>
          <Link href="/guides/how-to-choose-a-property-agent-in-singapore" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900">
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">Guides</h2>
            <p className="text-sm text-zinc-400">Answer-first consumer guides that explain what the rankings and profiles really mean.</p>
          </Link>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Top Agencies To Explore</h2>
                <p className="mt-2 text-sm text-zinc-500">Start with the biggest active agencies, then compare their strongest individual agents.</p>
              </div>
              <Link href="/leaderboard" className="text-sm text-zinc-400 transition hover:text-zinc-100">View leaderboard</Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {agencies.slice(0, 6).map((agency) => (
                <Link
                  key={agency.name}
                href={`/agency/${slugifySegment(agency.name)}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                >
                  <div className="text-sm font-medium text-zinc-100">{agency.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{agency.count.toLocaleString()} agents</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
            <h2 className="text-xl font-semibold text-zinc-100">Latest Movement Signals</h2>
            <p className="mt-2 text-sm text-zinc-500">Recent records that help consumers understand what is changing across the market.</p>
            <div className="mt-5 space-y-3">
              {movements.rows.map((movement) => (
                <Link
                  key={movement.id}
                  href={`/agent/${movement.cea_number}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                >
                  <div className="text-sm font-medium text-zinc-100">{movement.agent_name}</div>
                  <div className="mt-1 text-xs text-zinc-400">{formatLabel(movement.type)} · {formatDateLabel(movement.date)}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Key Takeaways</div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>Recent activity matters more than lifetime volume on its own.</li>
              <li>Property-type rankings help consumers compare like-for-like specialists.</li>
              <li>Movement data adds context to what agency and support structure an agent is operating within.</li>
            </ul>
          </div>
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Latest Coverage Year</div>
            <div className="mt-3 text-3xl font-semibold text-zinc-100">{coverageYear}</div>
            <div className="mt-2 text-sm text-zinc-400">Use the year filter on leaderboard pages to compare historical standings.</div>
          </div>
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Property-Type Coverage</div>
            {filterOptions.propertyTypes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {filterOptions.propertyTypes.slice(0, 5).map((value) => (
                  <Link
                    key={value}
                    href={`/property-type/${slugifySegment(value)}`}
                    className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 transition hover:border-zinc-700"
                  >
                    {formatLabel(value)}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm leading-7 text-zinc-400">
                Property-type slices are still being prepared for {coverageYear}. Use the leaderboard for the broadest current coverage.
              </div>
            )}
          </div>
        </section>
      </div>
    );
}
