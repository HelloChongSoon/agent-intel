import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Data Sources',
    description: 'See what data on PropNext Intel comes from public records, data.gov, and structured scraping, including refresh cadence and limitations.',
    path: '/data-sources',
  });
}

export default async function DataSourcesPage() {
  const url = await getRequestAbsoluteUrl('/data-sources');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'PropNext Intel Data Sources',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Data Sources' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Data Sources</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">Where the information comes from</h1>
        <p className="mt-4 text-lg text-zinc-400">
          PropNext Intel surfaces public market information in a structured way. The product is transparent about which fields come from official records and which are assembled through scraping and enrichment.
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Official public records and data.gov</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Where possible, the product uses official public sources for fields such as registration status, dates, or other publicly released market information.
          </p>
        </section>
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Structured scraping</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Some fields are collected through structured scraping when they are publicly visible but not distributed in a convenient machine-readable format. These fields should be read as publicly sourced, not as direct platform claims.
          </p>
        </section>
        <section className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Refresh cadence and limitations</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Data is refreshed on a recurring basis, but there may be delays between the original public update and PropNext Intel&apos;s display. Users should treat the platform as a decision-support layer, not as a legally authoritative registry.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            To report a correction or question, use the contact path published on the contact page.
          </p>
        </section>
      </div>
    </div>
  );
}
