import SearchBar from '@/components/SearchBar';
import { getAbsoluteUrl } from '@/lib/site';
import Link from 'next/link';

export default function Home() {
  const siteUrl = getAbsoluteUrl('/');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Agent Intel',
    url: siteUrl,
    description: "Search property agents, track rankings, and monitor agency movements in Singapore's real estate market.",
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getAbsoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10 py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="max-w-3xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Singapore Real Estate Intelligence</p>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">Agent Intel</h1>
        <p className="text-xl text-zinc-400">
          Singapore property agent directory — rankings, profiles, and agency movements.
        </p>
      </div>

      <SearchBar />

      <div className="mt-4 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/leaderboard"
          className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">Leaderboard</h2>
          <p className="text-sm text-zinc-400">Agent rankings by transaction volume</p>
        </Link>

        <Link
          href="/movements"
          className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">Movements</h2>
          <p className="text-sm text-zinc-400">Agency transfers and registrations</p>
        </Link>

        <Link
          href="/leaderboard?agency=ERA+REALTY+NETWORK+PTE+LTD"
          className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
        >
          <h2 className="mb-2 text-xl font-semibold text-zinc-100">ERA Agents</h2>
          <p className="text-sm text-zinc-400">Filter leaderboard by ERA Realty</p>
        </Link>
      </div>
    </div>
  );
}
