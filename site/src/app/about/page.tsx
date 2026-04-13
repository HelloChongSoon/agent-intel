import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'About PropNext',
    description: 'Learn what PropNext is building, why PropNext Intel exists, and how the brand fits into the wider property intelligence roadmap.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const url = await getRequestAbsoluteUrl('/about');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About PropNext',
    url,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">About</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">PropNext</h1>
        <p className="mt-4 text-lg text-zinc-400">
          PropNext is building Singapore property intelligence products that help consumers make better decisions with clearer, more structured public data.
        </p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">What we are building</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          The root domain is the PropNext trust layer. The main indexed product in this phase is PropNext Intel, which focuses on property agent rankings, profile pages, and movement intelligence for Singapore consumers.
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          This first phase is intentionally narrow. Instead of launching a full listings portal immediately, the product starts with agent intelligence and structured market signals that are easier to verify, cite, and scale cleanly.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/products/intel" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-100">PropNext Intel</h2>
          <p className="mt-2 text-sm text-zinc-400">Explore the core product for rankings, agent profiles, movement tracking, and answer-first guides.</p>
        </Link>
        <Link href="/methodology" className="rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-6 transition hover:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-100">Methodology</h2>
          <p className="mt-2 text-sm text-zinc-400">See how metrics are calculated and how consumers should interpret them.</p>
        </Link>
      </section>
    </div>
  );
}
