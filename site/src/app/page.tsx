import SearchBar from '@/components/SearchBar';
import RootHeroBackground from '@/components/RootHeroBackground';
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
        <div className="-mx-4 -mt-8 overflow-x-hidden sm:-mx-6 lg:-mx-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />

          {/* ── Hero ── */}
          <section className="relative min-h-[85vh] flex items-center overflow-hidden">
            <RootHeroBackground />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Singapore Property Intelligence
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl md:text-7xl">
                <span className="block">Clearer data.</span>
                <span className="block mt-1 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  Smarter choices.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg sm:leading-8">
                PropNext builds property intelligence tools for Singapore consumers, starting with agent rankings, movement tracking, and structured profile data from official sources.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={intelUrl}
                  className="group relative inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-6 py-3.5 text-sm font-medium text-zinc-950 transition hover:bg-white"
                >
                  Explore PropNext Intel
                  <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
                <Link
                  href="/about"
                  className="rounded-2xl border border-zinc-700 bg-zinc-900/40 px-6 py-3.5 text-sm font-medium text-zinc-100 backdrop-blur-sm transition hover:border-zinc-500 hover:bg-zinc-900/60"
                >
                  About PropNext
                </Link>
              </div>
            </div>
          </section>

          {/* ── Products ── */}
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Products</p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-100 sm:text-3xl">What we&apos;re building</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Link href="/products/intel" className="group rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <svg viewBox="0 0 20 20" className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <rect x="2" y="10" width="3" height="8" rx="1" />
                    <rect x="8.5" y="6" width="3" height="12" rx="1" />
                    <rect x="15" y="2" width="3" height="16" rx="1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 transition group-hover:text-white">PropNext Intel</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Agent rankings, profiles, and movement tracking powered by official CEA and URA data.</p>
              </Link>

              <Link href="/methodology" className="group rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <svg viewBox="0 0 20 20" className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M10 2v5M10 18v-5M2 10h5M18 10h-5" />
                    <circle cx="10" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-100 transition group-hover:text-white">Methodology</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">How we calculate rankings, what the data means, and how consumers should interpret it.</p>
              </Link>

              <Link href="/contact" className="group rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-7 transition hover:border-zinc-700 hover:bg-zinc-900/60">
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
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/60 p-6">
                <div className="text-2xl font-semibold text-zinc-100">Official sources</div>
                <p className="mt-2 text-sm text-zinc-400">Built on CEA registration records, URA transaction data, and data.gov.sg feeds.</p>
              </div>
              <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/60 p-6">
                <div className="text-2xl font-semibold text-zinc-100">Consumer-first</div>
                <p className="mt-2 text-sm text-zinc-400">Designed for home buyers and sellers, not for agents or agencies.</p>
              </div>
              <div className="rounded-[20px] border border-zinc-800 bg-zinc-950/60 p-6">
                <div className="text-2xl font-semibold text-zinc-100">Open methodology</div>
                <p className="mt-2 text-sm text-zinc-400">Every ranking and metric links back to how it was calculated and where the data came from.</p>
              </div>
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
        <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-4 py-10 sm:rounded-[32px] sm:px-8 sm:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500 sm:mb-4 sm:text-sm">Singapore Property Intelligence</p>
          <h1 className="mb-3 max-w-4xl text-3xl font-semibold tracking-tight text-zinc-50 sm:mb-4 sm:text-4xl md:text-6xl">PropNext Intel</h1>
          <p className="max-w-3xl text-base text-zinc-400 sm:text-xl">
            Singapore property agent rankings, profiles, and movement intelligence for consumers who want to compare agents with clearer data.
          </p>
          <div className="mt-5 max-w-3xl text-sm text-zinc-500">
            Compare agent activity, specialization, and agency movement using public records and structured summaries that are easier to verify and use in a real decision.
          </div>
          <div className="mt-8">
            <SearchBar />
          </div>
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
