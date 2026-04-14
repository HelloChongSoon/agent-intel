import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Methodology',
    description: 'Understand how PropNext Intel calculates rankings, summarizes agent activity, and presents movement intelligence for Singapore consumers.',
    path: '/methodology',
  });
}

export default async function MethodologyPage() {
  const url = await getRequestAbsoluteUrl('/methodology');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Methodology',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">How PropNext Intel calculates and presents data</h1>
        <p className="mt-4 text-lg text-zinc-400">
          PropNext Intel groups public records into consumer-friendly views such as leaderboards, activity snapshots, movement timelines, and profile summaries.
        </p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">How we calculate this</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-400">
          <p>Leaderboards rank agents by transaction volume within the selected year and optional filter set.</p>
          <p>Profile pages combine registration information, contact details when available, recent transaction activity, property mix, and movement context.</p>
          <p>Movement pages group records such as agency transfers, new registrations, and related changes into a clear timeline view.</p>
          <p>Guides are written as answer-first summaries so consumers can understand what the metrics mean before they compare agents.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">What this means</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            A high transaction count can indicate experience, but it should be read together with recency, property type, and role mix. The platform is designed to help consumers compare agents on relevant context, not one headline number alone.
          </p>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Source transparency</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            PropNext Intel mixes official public records, data.gov ingestion, and structured scraping. The goal is to make the source context visible rather than hide it.
          </p>
          <Link href="/data-sources" className="mt-4 inline-flex text-sm font-medium text-zinc-100 transition hover:text-white">
            View data sources
          </Link>
        </div>
      </section>
    </div>
  );
}
