import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getVariantSiteUrl, getRequestAbsoluteUrl } from '@/lib/site';
import OpenIntelLink from '@/components/OpenIntelLink';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'PropNext Intel — Agent Rankings & Movement Tracker',
    description: 'PropNext Intel provides Singapore property agent rankings, detailed profiles, movement tracking, and consumer guides powered by official data.',
    path: '/products/intel',
  });
}

export default async function ProductIntelPage() {
  const url = await getRequestAbsoluteUrl('/products/intel');
  const intelUrl = getVariantSiteUrl('intel');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'PropNext Intel',
    url,
    description: 'Singapore property agent rankings, profiles, and movement intelligence.',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Products' }, { label: 'PropNext Intel' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Product</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">PropNext Intel</h1>
        <p className="mt-4 text-lg text-zinc-400">
          The first PropNext product is built to help Singapore consumers evaluate agent activity, specialization, and market movement with clearer public-data summaries.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Rankings</h2>
          <p className="mt-2 text-sm text-zinc-400">Leaderboards by year and filter set so consumers can compare agents on the right basis.</p>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Profiles</h2>
          <p className="mt-2 text-sm text-zinc-400">Agent pages that combine registration context, transaction mix, and recent activity.</p>
        </div>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Movement intelligence</h2>
          <p className="mt-2 text-sm text-zinc-400">Agency transfers and registrations that add context to how the market is shifting.</p>
        </div>
      </section>

      <OpenIntelLink href={intelUrl} />
    </div>
  );
}
