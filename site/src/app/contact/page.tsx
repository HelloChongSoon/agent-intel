import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createPageMetadata } from '@/lib/seo';
import { getRequestAbsoluteUrl } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'Contact PropNext — Feedback, Partnerships & Support',
    description: 'Get in touch with PropNext for product feedback, data corrections, partnership enquiries, or support related to PropNext Intel.',
    path: '/contact',
  });
}

export default async function ContactPage() {
  const url = await getRequestAbsoluteUrl('/contact');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact PropNext',
    url,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Contact</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50">Get in touch</h1>
        <p className="mt-4 text-lg text-zinc-400">
          Use this page for product feedback, data correction requests, and conversations about partnerships or future product collaboration.
        </p>
      </div>

      <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-7">
        <h2 className="text-xl font-semibold text-zinc-100">Contact path</h2>
        <div className="mt-4 space-y-4 text-sm text-zinc-400">
          <p><span className="font-medium text-zinc-100">Email:</span> hello@propnext.sg</p>
          <p><span className="font-medium text-zinc-100">Use cases:</span> data corrections, brand questions, product feedback, and partnership enquiries.</p>
          <p><span className="font-medium text-zinc-100">Expected response:</span> a reviewed response after the relevant data or methodology has been checked internally.</p>
        </div>
      </section>
    </div>
  );
}
