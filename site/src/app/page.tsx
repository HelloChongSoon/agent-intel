import SearchBar from '@/components/SearchBar';
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
    getMovements({ pageSize: 4 }),
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
        <div className="space-y-10 py-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
          <section className="rounded-[32px] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-8 py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">PropNext</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl">
              Property intelligence products for Singapore.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              PropNext is building a branded trust layer at the root domain and launching PropNext Intel as the primary indexed product for rankings, profiles, and movement intelligence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={intelUrl}
                className="rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Explore PropNext Intel
              </Link>
              <Link
                href="/about"
                className="rounded-2xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                About PropNext
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Link href="/products/intel" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700">
              <h2 className="text-xl font-semibold text-zinc-100">PropNext Intel</h2>
              <p className="mt-2 text-sm text-zinc-400">The main SEO and GEO product for Singapore property agent rankings, profiles, and movement tracking.</p>
            </Link>
            <Link href="/methodology" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700">
              <h2 className="text-xl font-semibold text-zinc-100">Methodology</h2>
              <p className="mt-2 text-sm text-zinc-400">How the product calculates rankings, what the data means, and how consumers should read it.</p>
            </Link>
            <Link href="/contact" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700">
              <h2 className="text-xl font-semibold text-zinc-100">Contact</h2>
              <p className="mt-2 text-sm text-zinc-400">Report data issues, ask about partnerships, or reach out about the product roadmap.</p>
            </Link>
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
        <section className="rounded-[32px] border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-8 py-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Singapore Property Intelligence</p>
          <h1 className="mb-4 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl">PropNext Intel</h1>
          <p className="max-w-3xl text-xl text-zinc-400">
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
